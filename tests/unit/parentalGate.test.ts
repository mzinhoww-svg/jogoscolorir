import { describe, expect, it } from 'vitest';
import { checkAnswer, createGate, LOCK_MS, makeChallenge, MAX_WRONG } from '@/ui/parentalGate';
import { mulberry32 } from '@/engine/tools';

describe('makeChallenge', () => {
  it('produces additions with operands in 2..9', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 500; i++) {
      const c = makeChallenge(rng);
      expect(c.op).toBe('+');
      expect(c.a).toBeGreaterThanOrEqual(2);
      expect(c.a).toBeLessThanOrEqual(9);
      expect(c.b).toBeGreaterThanOrEqual(2);
      expect(c.b).toBeLessThanOrEqual(9);
      expect(c.answer).toBe(c.a + c.b);
      expect(c.answer).toBeLessThanOrEqual(18);
    }
  });
  it('covers the extremes', () => {
    expect(makeChallenge(() => 0)).toMatchObject({ a: 2, b: 2, answer: 4 });
    expect(makeChallenge(() => 0.9999)).toMatchObject({ a: 9, b: 9, answer: 18 });
  });
});

describe('checkAnswer', () => {
  const ch = { a: 6, b: 7, op: '+' as const, answer: 13 };
  it('accepts the right answer (trimmed)', () => {
    expect(checkAnswer(ch, '13')).toBe(true);
    expect(checkAnswer(ch, ' 13 ')).toBe(true);
  });
  it('rejects wrong, empty or non-numeric input', () => {
    expect(checkAnswer(ch, '12')).toBe(false);
    expect(checkAnswer(ch, '')).toBe(false);
    expect(checkAnswer(ch, '1a3')).toBe(false);
    expect(checkAnswer(ch, '13.0')).toBe(false);
  });
});

describe('createGate', () => {
  function setup() {
    let t = 1000;
    const gate = createGate({ rng: mulberry32(7), now: () => t });
    return { gate, advance: (ms: number) => (t += ms) };
  }

  it('passes on the right answer', () => {
    const { gate } = setup();
    expect(gate.submit(String(gate.challenge.answer))).toBe('ok');
  });

  it('issues a new challenge after a wrong answer', () => {
    const { gate } = setup();
    const seen = new Set<string>();
    for (let i = 0; i < 2; i++) {
      const before = gate.challenge;
      expect(gate.submit(String(before.answer + 1))).toBe('wrong');
      expect(gate.challenge).not.toBe(before);
      seen.add(`${gate.challenge.a}+${gate.challenge.b}`);
    }
  });

  it('locks for 10 s after 3 consecutive wrong answers', () => {
    const { gate, advance } = setup();
    expect(MAX_WRONG).toBe(3);
    expect(LOCK_MS).toBe(10_000);
    gate.submit('0');
    gate.submit('0');
    expect(gate.submit('0')).toBe('locked');
    expect(gate.isLocked()).toBe(true);
    expect(gate.remainingMs()).toBe(10_000);
    // even the right answer is refused while locked
    expect(gate.submit(String(gate.challenge.answer))).toBe('locked');
    advance(9_999);
    expect(gate.isLocked()).toBe(true);
    expect(gate.remainingMs()).toBe(1);
    advance(1);
    expect(gate.isLocked()).toBe(false);
    expect(gate.remainingMs()).toBe(0);
    expect(gate.submit(String(gate.challenge.answer))).toBe('ok');
  });

  it('a correct answer resets the wrong-answer streak', () => {
    const { gate } = setup();
    gate.submit('0');
    gate.submit('0');
    expect(gate.submit(String(gate.challenge.answer))).toBe('ok');
    gate.reset();
    gate.submit('0');
    expect(gate.submit('0')).toBe('wrong');
  });

  it('after the lockout, the counter starts over', () => {
    const { gate, advance } = setup();
    gate.submit('0');
    gate.submit('0');
    gate.submit('0');
    advance(10_000);
    expect(gate.submit('0')).toBe('wrong');
    expect(gate.submit('0')).toBe('wrong');
    expect(gate.submit('0')).toBe('locked');
  });
});
