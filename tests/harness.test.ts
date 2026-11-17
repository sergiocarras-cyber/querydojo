import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PyRunOutput, PyRunner } from '../src/lib/python/evaluate';
import { createNodePyRunner } from './nodePyRunner';

let run: PyRunner;
let close: () => Promise<void>;
beforeAll(() => {
  ({ run, close } = createNodePyRunner());
});
afterAll(() => close());

async function suite(code: string, spec: Record<string, unknown>): Promise<PyRunOutput> {
  return JSON.parse(await run('run_suite', [code, JSON.stringify({ mode: 'submit', ...spec })], []));
}

describe('harness.py', () => {
  it('passes a correct function and captures print()', async () => {
    const out = await suite('def add(a, b):\n    print("hi", a)\n    return a + b', {
      function: 'add',
      cases: [{ args: [1, 2], expected: 3 }],
    });
    expect(out.status).toBe('ok');
    expect(out.cases[0]).toMatchObject({ passed: true, got: '3', stdout: 'hi 1\n' });
  });

  it('treats tuples as lists but keeps bool distinct from int', async () => {
    const tuple = await suite('def f():\n    return (0, 1)', { function: 'f', cases: [{ args: [], expected: [0, 1] }] });
    expect(tuple.cases[0].passed).toBe(true);
    const boolean = await suite('def f():\n    return 1', { function: 'f', cases: [{ args: [], expected: true }] });
    expect(boolean.cases[0].passed).toBe(false);
  });

  it('supports unordered, unordered_deep and float comparators', async () => {
    const un = await suite('def f():\n    return [3, 1, 2]', { function: 'f', comparator: 'unordered', cases: [{ args: [], expected: [1, 2, 3] }] });
    expect(un.cases[0].passed).toBe(true);
    const deep = await suite('def f():\n    return [[2, 1], [3]]', {
      function: 'f',
      comparator: 'unordered_deep',
      cases: [{ args: [], expected: [[3], [1, 2]] }],
    });
    expect(deep.cases[0].passed).toBe(true);
    const fl = await suite('def f():\n    return 0.1 + 0.2', { function: 'f', comparator: 'float', cases: [{ args: [], expected: 0.3 }] });
    expect(fl.cases[0].passed).toBe(true);
  });

  it('reports user exceptions with a traceback limited to the solution', async () => {
    const out = await suite('def f(x):\n    return 1 // x', { function: 'f', cases: [{ args: [0], expected: 1 }] });
    expect(out.cases[0].passed).toBe(false);
    expect(out.cases[0].error).toContain('ZeroDivisionError');
    expect(out.cases[0].error).not.toContain('harness');
  });

  it('reports syntax errors and missing functions as load errors', async () => {
    expect((await suite('def f(:\n  pass', { function: 'f', cases: [] })).status).toBe('error');
    const missing = await suite('def g():\n  pass', { function: 'f', cases: [] });
    expect(missing.error).toContain('f()');
  });

  it('converts linked lists and trees in both directions', async () => {
    const ll = await suite(
      'def rev(head):\n    prev = None\n    while head:\n        head.next, prev, head = prev, head, head.next\n    return prev',
      { function: 'rev', arg_types: ['linked_list'], return_type: 'linked_list', cases: [{ args: [[1, 2, 3]], expected: [3, 2, 1] }] },
    );
    expect(ll.cases[0].passed).toBe(true);
    const tree = await suite('def f(root):\n    return root.left.val + root.right.right.val', {
      function: 'f',
      arg_types: ['tree'],
      cases: [{ args: [[1, 2, 3, null, null, null, 7]], expected: 9 }],
    });
    expect(tree.cases[0].passed).toBe(true);
  });

  it('computes expected values for generated cases with the reference and flags slow code', async () => {
    const out = await suite('def total(n):\n    s = 0\n    for i in range(n):\n        s += i\n    return s', {
      function: 'total',
      time_limit_ms: 50,
      reference_code: 'def total(n):\n    return n * (n - 1) // 2',
      generator_code: 'def cases():\n    yield [10]\n    yield [3_000_000]',
      cases: [],
    });
    expect(out.cases[0].passed).toBe(true);
    expect(out.cases[1]).toMatchObject({ passed: false, tle: true, hidden: true });
  });

  it('stops at the first failure in submit mode only', async () => {
    const spec = { function: 'f', cases: [{ args: [1], expected: 0 }, { args: [2], expected: 2 }] };
    expect((await suite('def f(x):\n    return x', spec)).cases).toHaveLength(1);
    const runOut: PyRunOutput = JSON.parse(await run('run_suite', ['def f(x):\n    return x', JSON.stringify({ ...spec, mode: 'run' })], []));
    expect(runOut.cases).toHaveLength(2);
  });

  it('uses a custom checker', async () => {
    const out = await suite('def f():\n    return 4', {
      function: 'f',
      comparator: 'custom',
      reference_code: 'def f():\n    return 2',
      checker_code: 'def check(got, expected):\n    return got % 2 == 0',
      cases: [{ args: [], expected: 2 }],
    });
    expect(out.cases[0].passed).toBe(true);
  });
});

describe('node runner', () => {
  it('kills an infinite loop and recovers', async () => {
    const { run: quick, close: closeQuick } = createNodePyRunner(1_500);
    const spec = JSON.stringify({ mode: 'run', function: 'f', cases: [{ args: [], expected: 1 }] });
    await expect(quick('run_suite', ['def f():\n    while True:\n        pass', spec], [])).rejects.toThrow(/límite/);
    const out: PyRunOutput = JSON.parse(await quick('run_suite', ['def f():\n    return 1', spec], []));
    expect(out.cases[0].passed).toBe(true);
    await closeQuick();
  });
});
