import { describe, expect, it } from 'vitest';
import { formatNumber, isNumericCorrect, parseNumericAnswer } from '../src/lib/stats/answer';

describe('parseNumericAnswer', () => {
  it.each([
    ['0.375', 0.375],
    ['0,375', 0.375],
    ['3/8', 0.375],
    ['37.5%', 0.375],
    [' 6 ', 6],
    ['-1.5', -1.5],
    ['.5', 0.5],
    ['1e-3', 0.001],
  ])('%s -> %f', (input, expected) => {
    expect(parseNumericAnswer(input)).toBeCloseTo(expected, 12);
  });

  it.each(['', 'abc', '1/0', '3/8/2', '2+2'])('rejects %j', (input) => {
    expect(parseNumericAnswer(input)).toBeNull();
  });
});

describe('isNumericCorrect / formatNumber', () => {
  it('applies the absolute tolerance', () => {
    expect(isNumericCorrect(0.1667, 1 / 6, 1e-3)).toBe(true);
    expect(isNumericCorrect(0.17, 1 / 6, 1e-3)).toBe(false);
  });
  it('formats numbers compactly', () => {
    expect(formatNumber(6)).toBe('6');
    expect(formatNumber(1 / 6)).toBe('0.166667');
  });
});
