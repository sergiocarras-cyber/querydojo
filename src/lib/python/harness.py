"""
QueryDojo test harness. Runs inside Pyodide, both in the browser worker and in
the Node verification script, so grading is identical in both places.

Entry point: run_suite(user_code: str, spec_json: str) -> str (JSON).
"""

import contextlib
import copy
import hashlib
import io
import json
import math
import sys
import time
import traceback
import typing

MAX_REPR = 400
MAX_STDOUT = 4000
# On Submit every case runs (to compute a score), but once the user's code has
# used this much time, or hit a per-case time limit, the rest are skipped:
# a slow solution would otherwise hit the worker's global timeout.
SUBMIT_BUDGET_S = 6.0


# --------------------------------------------------------------------------
# Data structures available to every solution (no import needed).
# --------------------------------------------------------------------------


# Every node ever created is registered so the harness can unlink them after
# each case. Freeing a long chain recursively (node -> next -> next ...)
# overflows the WebAssembly stack and kills Pyodide; unlinking first makes
# deallocation flat.
_NODES = []


def _release_nodes():
    for node in _NODES:
        if isinstance(node, ListNode):
            node.next = None
        else:
            node.left = None
            node.right = None
    _NODES.clear()


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
        _NODES.append(self)

    def __repr__(self):
        return f"ListNode({_linked_to_list(self)})"


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
        _NODES.append(self)

    def __repr__(self):
        return f"TreeNode({_tree_to_list(self)})"


def _list_to_linked(values):
    head = None
    for v in reversed(values or []):
        head = ListNode(v, head)
    return head


def _linked_to_list(node, limit=100_000):
    out = []
    seen = 0
    while node is not None:
        out.append(node.val)
        node = node.next
        seen += 1
        if seen > limit:
            raise ValueError("linked list looks cyclic (too many nodes)")
    return out


def _list_to_tree(values):
    """Level-order list with None for missing children -> TreeNode."""
    if not values or values[0] is None:
        return None
    nodes = [None if v is None else TreeNode(v) for v in values]
    kids = iter(nodes[1:])
    for node in nodes:
        if node is None:
            continue
        node.left = next(kids, None)
        node.right = next(kids, None)
    return nodes[0]


def _tree_to_list(root):
    out, queue = [], [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out


ADAPT_IN = {"linked_list": _list_to_linked, "tree": _list_to_tree}
ADAPT_OUT = {"linked_list": _linked_to_list, "tree": _tree_to_list}


# --------------------------------------------------------------------------
# Comparison
# --------------------------------------------------------------------------


def _norm(v):
    """Tuples -> lists recursively so (0, 1) == [0, 1]."""
    if isinstance(v, tuple):
        v = list(v)
    if isinstance(v, list):
        return [_norm(x) for x in v]
    if isinstance(v, dict):
        return {k: _norm(x) for k, x in v.items()}
    return v


def _canon_key(v):
    return json.dumps(v, sort_keys=True, default=repr)


def _close(a, b, tol):
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b or a == b and type(a) is type(b)
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if isinstance(a, float) and math.isnan(a):
            return isinstance(b, float) and math.isnan(b)
        return math.isclose(a, b, rel_tol=tol, abs_tol=tol)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_close(x, y, tol) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_close(a[k], b[k], tol) for k in a)
    return a == b


def _equal(got, expected, comparator, tol, checker, args):
    if comparator == "custom":
        return bool(checker(got, expected, *args))
    got, expected = _norm(got), _norm(expected)
    if comparator == "exact":
        # bool vs int: True == 1 in Python, but we want the declared type.
        return _close(got, expected, 0.0) if _has_float(expected) else _strict_eq(got, expected)
    if comparator == "float":
        return _close(got, expected, tol)
    if comparator == "unordered":
        if not isinstance(got, list) or not isinstance(expected, list):
            return False
        return sorted(map(_canon_key, got)) == sorted(map(_canon_key, expected))
    if comparator == "unordered_deep":
        if not isinstance(got, list) or not isinstance(expected, list):
            return False
        deep = lambda xs: sorted(_canon_key(sorted(x, key=_canon_key) if isinstance(x, list) else x) for x in xs)
        return deep(got) == deep(expected)
    raise ValueError(f"unknown comparator {comparator!r}")


def _has_float(v):
    if isinstance(v, float):
        return True
    if isinstance(v, list):
        return any(_has_float(x) for x in v)
    if isinstance(v, dict):
        return any(_has_float(x) for x in v.values())
    return False


def _strict_eq(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_strict_eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_strict_eq(a[k], b[k]) for k in a)
    return a == b


# --------------------------------------------------------------------------
# Fingerprints: how a submission behaves on each case, so a failing submission
# can be matched against the problem's known wrong answers (see diagnosis.ts).
#   ok | tle | skip | err:<ExceptionType> | out:<hash of the normalised output>
# --------------------------------------------------------------------------


def _round_floats(v):
    if isinstance(v, float):
        return v if math.isnan(v) or math.isinf(v) else round(v, 6)
    if isinstance(v, list):
        return [_round_floats(x) for x in v]
    if isinstance(v, dict):
        return {k: _round_floats(x) for k, x in v.items()}
    return v


def _digest(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def _output_fp(got, comparator):
    v = _round_floats(_norm(got))
    if isinstance(v, list) and comparator in ("unordered", "unordered_deep"):
        if comparator == "unordered_deep":
            v = [sorted(x, key=_canon_key) if isinstance(x, list) else x for x in v]
        v = sorted(v, key=_canon_key)
    return "out:" + _digest(json.dumps(v, sort_keys=True, default=repr))


def _frame_fp(got, order_matters):
    import pandas as pd

    if not isinstance(got, pd.DataFrame):
        return "type:" + type(got).__name__
    df = got.reset_index(drop=True)
    df.columns = [str(c) for c in df.columns]
    if not order_matters:
        try:
            df = _sort_frame(df)
        except Exception:
            pass
    df = df.round(6)
    return "out:" + _digest(df.to_csv(index=False))


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def _short(v):
    try:
        r = repr(v)
    except Exception as e:  # pragma: no cover
        r = f"<unrepresentable: {e}>"
    if len(r) > MAX_REPR:
        r = r[:MAX_REPR] + f"… ({len(r)} caracteres)"
    return r


def _user_traceback(exc):
    """Only frames from the user's code, like an online judge."""
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == "<solution>"]
    lines = ["Traceback (most recent call last):\n"]
    lines += traceback.format_list(frames)
    lines += traceback.format_exception_only(type(exc), exc)
    return "".join(lines).rstrip()


def _namespace():
    ns = {"__name__": "__solution__", "ListNode": ListNode, "TreeNode": TreeNode}
    for name in ("List", "Optional", "Dict", "Tuple", "Set"):
        ns[name] = getattr(typing, name)
    return ns


def _load(code, filename, function):
    ns = _namespace()
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(compile(code, filename, "exec"), ns)
    fn = ns.get(function)
    if not callable(fn):
        raise NameError(f"no se encontró la función {function}() en tu código")
    return fn, ns, out.getvalue()


def _call(fn, args, arg_types):
    args = copy.deepcopy(args)
    if arg_types:
        args = [ADAPT_IN[t](a) if t else a for t, a in zip(arg_types, args)]
    return fn(*args)


def _adapt_result(value, return_type):
    if return_type:
        return ADAPT_OUT[return_type](value)
    return value


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------


def run_suite(user_code, spec_json):
    spec = json.loads(spec_json)
    function = spec["function"]
    comparator = spec.get("comparator", "exact")
    tol = spec.get("tolerance", 1e-6)
    arg_types = spec.get("arg_types")
    return_type = spec.get("return_type")
    time_limit = spec.get("time_limit_ms", 2000) / 1000
    submit = spec.get("mode") == "submit"
    cases = list(spec["cases"])

    # Reference namespace: official solution, optional generator and checker.
    checker = None
    reference = None
    if spec.get("reference_code"):
        reference, ref_ns, _ = _load(spec["reference_code"], "<reference>", function)
        if spec.get("generator_code"):
            exec(compile(spec["generator_code"], "<generator>", "exec"), ref_ns)
            for args in ref_ns["cases"]():
                cases.append({"args": args, "expected": None, "hidden": True, "generated": True})
        if spec.get("checker_code"):
            exec(compile(spec["checker_code"], "<checker>", "exec"), ref_ns)
            checker = ref_ns["check"]

    # Compile the user's code.
    try:
        fn, _, setup_stdout = _load(user_code, "<solution>", function)
    except BaseException as exc:  # SyntaxError, NameError at import time, missing function…
        if isinstance(exc, SyntaxError):
            error = "".join(traceback.format_exception_only(type(exc), exc)).rstrip()
        else:
            error = _user_traceback(exc)
        return json.dumps({"status": "error", "error": error, "cases": [], "passed": 0, "total": len(cases)})

    results = []
    used = 0.0
    skipping = False
    for index, case in enumerate(cases):
        args = case["args"]
        if skipping:
            results.append(
                {"index": index, "hidden": bool(case.get("hidden")), "input": _short(args), "expected": "—",
                 "passed": False, "skipped": True, "fp": "skip"}
            )
            continue
        expected = case.get("expected")
        if case.get("generated") or "expected" not in case:
            # Expected value comes from the official solution (large generated cases).
            expected = _adapt_result(_call(reference, args, arg_types), return_type)
            _release_nodes()

        out = io.StringIO()
        entry = {
            "index": index,
            "hidden": bool(case.get("hidden")),
            "input": _short(args),
            "expected": _short(expected),
        }
        start = time.perf_counter()
        try:
            with contextlib.redirect_stdout(out):
                got = _call(fn, args, arg_types)
            elapsed = time.perf_counter() - start
            got = _adapt_result(got, return_type)
            entry["got"] = _short(got)
            entry["ms"] = round(elapsed * 1000, 2)
            if elapsed > time_limit:
                entry["passed"] = False
                entry["tle"] = True
                entry["fp"] = "tle"
            else:
                entry["passed"] = _equal(got, expected, comparator, tol, checker, copy.deepcopy(args))
                entry["fp"] = "ok" if entry["passed"] else _output_fp(got, comparator)
        except RecursionError as exc:
            entry.update(passed=False, ms=round((time.perf_counter() - start) * 1000, 2), error=_user_traceback(exc)[-1500:])
            entry["fp"] = "err:RecursionError"
        except BaseException as exc:  # includes SystemExit from exit()
            entry.update(passed=False, ms=round((time.perf_counter() - start) * 1000, 2), error=_user_traceback(exc))
            entry["fp"] = "err:" + type(exc).__name__
        used += time.perf_counter() - start
        got = None
        _release_nodes()
        stdout = out.getvalue()
        if stdout:
            entry["stdout"] = stdout[:MAX_STDOUT] + ("\n… (salida truncada)" if len(stdout) > MAX_STDOUT else "")
        results.append(entry)
        if submit and (entry.get("tle") or used > SUBMIT_BUDGET_S):
            skipping = True

    passed = sum(1 for r in results if r["passed"])
    return json.dumps(
        {
            "status": "ok",
            "setup_stdout": setup_stdout[:MAX_STDOUT],
            "cases": results,
            "passed": passed,
            "total": len(cases),
        }
    )


# --------------------------------------------------------------------------
# pandas problems
# --------------------------------------------------------------------------

MAX_TABLE_ROWS = 200


def _cell(v):
    """JSON-safe cell: NaN/NaT -> None, numpy scalars -> Python, timestamps -> ISO text."""
    import pandas as pd

    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, pd.Timestamp):
        return v.strftime("%Y-%m-%d") if v == v.normalize() else v.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(v, pd.Timedelta):
        return str(v)
    if hasattr(v, "item") and not isinstance(v, (str, bytes)):
        try:
            v = v.item()
        except (ValueError, AttributeError):
            return str(v)
    if isinstance(v, float):
        return round(v, 6)
    if isinstance(v, (int, bool, str)):
        return v
    return str(v)


def _df_table(df):
    import pandas as pd

    if not isinstance(df, (pd.DataFrame, pd.Series)):
        # Scalar argument (e.g. a date string): show it as a 1x1 table.
        return {"columns": ["value"], "dtypes": [type(df).__name__], "rows": [[_cell(df)]], "total_rows": 1, "index_named": False}
    if isinstance(df, pd.Series):
        df = df.to_frame()
    shown = df.head(MAX_TABLE_ROWS)
    return {
        "columns": [str(c) for c in df.columns],
        "dtypes": [str(t) for t in df.dtypes],
        "rows": [[_cell(v) for v in row] for row in shown.itertuples(index=False, name=None)],
        "total_rows": int(len(df)),
        "index_named": df.index.name is not None or isinstance(df.index, pd.MultiIndex),
    }


def _sort_frame(df):
    cols = list(df.columns)
    try:
        return df.sort_values(cols, kind="mergesort", na_position="last").reset_index(drop=True)
    except TypeError:
        # Mixed types in a column: sort by string representation instead.
        key = df.astype(str)
        return df.loc[key.sort_values(cols, kind="mergesort").index].reset_index(drop=True)


def _compare_frames(got, expected, order_matters, check_dtype, tol):
    import pandas as pd

    if not isinstance(got, pd.DataFrame):
        return False, f"Tu función debe devolver un DataFrame, pero devolvió {type(got).__name__}."
    if list(map(str, got.columns)) != list(map(str, expected.columns)):
        return False, (
            f"Columnas distintas. Esperadas: {list(map(str, expected.columns))}. "
            f"Obtenidas: {list(map(str, got.columns))}."
        )
    if len(got) != len(expected):
        return False, f"Número de filas distinto: se esperaban {len(expected)} y se obtuvieron {len(got)}."
    g = got.reset_index(drop=True)
    e = expected.reset_index(drop=True)
    if not order_matters:
        g, e = _sort_frame(g), _sort_frame(e)
    g.columns = e.columns
    try:
        pd.testing.assert_frame_equal(
            g, e, check_dtype=check_dtype, check_exact=False, rtol=tol, atol=tol,
            check_index_type=False, check_column_type=False, check_names=False,
        )
    except AssertionError as err:
        msg = str(err).strip()
        if not order_matters:
            msg += "\n(Las filas se compararon ordenadas, así que el orden no importa.)"
        else:
            msg += "\n(El enunciado exige un orden de filas concreto.)"
        return False, msg
    return True, ""


def _pandas_cases(code):
    ns = {"__name__": "__data__"}
    exec(compile(code, "<data>", "exec"), ns)
    return [list(args) for args in ns["cases"]()]


def _copy_args(args):
    import pandas as pd

    return [a.copy(deep=True) if isinstance(a, (pd.DataFrame, pd.Series)) else copy.deepcopy(a) for a in args]


def preview_pandas(spec_json):
    """Tables of the first visible case, labelled with the function's parameter names."""
    import inspect

    spec = json.loads(spec_json)
    reference, _, _ = _load(spec["reference_code"], "<reference>", spec["function"])
    names = list(inspect.signature(reference).parameters)
    args = _pandas_cases(spec["data_code"])[0]
    return json.dumps(
        {"tables": [{"name": names[i] if i < len(names) else f"arg{i}", "table": _df_table(a)} for i, a in enumerate(args)]}
    )


def run_pandas_suite(user_code, spec_json):
    spec = json.loads(spec_json)
    function = spec["function"]
    order_matters = spec.get("order_matters", False)
    check_dtype = spec.get("check_dtype", False)
    tol = spec.get("tolerance", 1e-6)
    time_limit = spec.get("time_limit_ms", 3000) / 1000
    submit = spec.get("mode") == "submit"

    reference, _, _ = _load(spec["reference_code"], "<reference>", function)
    cases = [(args, False) for args in _pandas_cases(spec["data_code"])]
    if submit and spec.get("hidden_data_code"):
        cases += [(args, True) for args in _pandas_cases(spec["hidden_data_code"])]

    try:
        fn, _, setup_stdout = _load(user_code, "<solution>", function)
    except BaseException as exc:
        if isinstance(exc, SyntaxError):
            error = "".join(traceback.format_exception_only(type(exc), exc)).rstrip()
        else:
            error = _user_traceback(exc)
        return json.dumps({"status": "error", "error": error, "cases": [], "passed": 0, "total": len(cases)})

    results = []
    used = 0.0
    skipping = False
    for index, (args, hidden) in enumerate(cases):
        if skipping:
            results.append({"index": index, "hidden": hidden, "input": "—", "expected": "—", "passed": False, "skipped": True, "fp": "skip"})
            continue
        expected = reference(*_copy_args(args))
        entry = {
            "index": index,
            "hidden": hidden,
            "input": ", ".join(f"DataFrame {a.shape[0]}×{a.shape[1]}" if hasattr(a, "shape") else _short(a) for a in args),
            "expected": f"DataFrame {expected.shape[0]}×{expected.shape[1]}",
            "expected_table": _df_table(expected),
        }
        out = io.StringIO()
        start = time.perf_counter()
        try:
            with contextlib.redirect_stdout(out):
                got = fn(*_copy_args(args))
            elapsed = time.perf_counter() - start
            entry["ms"] = round(elapsed * 1000, 2)
            if hasattr(got, "shape") and hasattr(got, "columns"):
                entry["got"] = f"DataFrame {got.shape[0]}×{got.shape[1]}"
                entry["got_table"] = _df_table(got)
            else:
                entry["got"] = _short(got)
            if elapsed > time_limit:
                entry.update(passed=False, tle=True, fp="tle")
            else:
                ok, message = _compare_frames(got, expected, order_matters, check_dtype, tol)
                entry["passed"] = ok
                entry["fp"] = "ok" if ok else _frame_fp(got, order_matters)
                if message:
                    entry["message"] = message[:2000]
        except BaseException as exc:
            entry.update(passed=False, ms=round((time.perf_counter() - start) * 1000, 2), error=_user_traceback(exc))
            entry["fp"] = "err:" + type(exc).__name__
        used += time.perf_counter() - start
        stdout = out.getvalue()
        if stdout:
            entry["stdout"] = stdout[:MAX_STDOUT]
        results.append(entry)
        if submit and (entry.get("tle") or used > SUBMIT_BUDGET_S):
            skipping = True

    return json.dumps(
        {
            "status": "ok",
            "setup_stdout": setup_stdout[:MAX_STDOUT],
            "cases": results,
            "passed": sum(1 for r in results if r["passed"]),
            "total": len(cases),
        },
        default=str,
    )


# --------------------------------------------------------------------------
# Statistics problems (verification only)
# --------------------------------------------------------------------------


def eval_answer(code):
    """Runs a problem's ## Verification block and returns answer() as JSON."""
    ns = {"__name__": "__verify__"}
    exec(compile(code, "<verification>", "exec"), ns)
    return json.dumps(float(ns["answer"]()))
