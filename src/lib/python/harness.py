"""
QueryDojo test harness. Runs inside Pyodide, both in the browser worker and in
the Node verification script, so grading is identical in both places.

Entry point: run_suite(user_code: str, spec_json: str) -> str (JSON).
"""

import contextlib
import copy
import io
import json
import math
import sys
import time
import traceback
import typing

MAX_REPR = 400
MAX_STDOUT = 4000


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
    stop_on_fail = spec.get("mode") == "submit"
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
    for index, case in enumerate(cases):
        args = case["args"]
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
            else:
                entry["passed"] = _equal(got, expected, comparator, tol, checker, copy.deepcopy(args))
        except RecursionError as exc:
            entry.update(passed=False, ms=round((time.perf_counter() - start) * 1000, 2), error=_user_traceback(exc)[-1500:])
        except BaseException as exc:  # includes SystemExit from exit()
            entry.update(passed=False, ms=round((time.perf_counter() - start) * 1000, 2), error=_user_traceback(exc))
        got = None
        _release_nodes()
        stdout = out.getvalue()
        if stdout:
            entry["stdout"] = stdout[:MAX_STDOUT] + ("\n… (salida truncada)" if len(stdout) > MAX_STDOUT else "")
        results.append(entry)
        if stop_on_fail and not entry["passed"]:
            break

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
