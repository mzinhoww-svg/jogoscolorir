/** Pure parental-gate logic: arithmetic challenge, answer check and lockout. */
export interface Challenge {
  a: number;
  b: number;
  op: '+' | '×';
  answer: number;
}

export const MAX_WRONG = 3;
export const LOCK_MS = 10_000;
const MIN = 2;
const MAX = 9;

const pick = (rng: () => number): number => MIN + Math.floor(rng() * (MAX - MIN + 1));

/** Addition a+b with a,b in 2..9 (answer ≤ 18, so it can be spelled from num.N). */
export function makeChallenge(rng: () => number): Challenge {
  const a = pick(rng);
  const b = pick(rng);
  return { a, b, op: '+', answer: a + b };
}

export function checkAnswer(ch: Challenge, input: string): boolean {
  const s = input.trim();
  if (!/^\d{1,3}$/.test(s)) return false;
  return Number(s) === ch.answer;
}

export type GateResult = 'ok' | 'wrong' | 'locked';

export interface GateOptions {
  rng?: () => number;
  now?: () => number;
}

export function createGate(opts: GateOptions = {}) {
  const rng = opts.rng ?? Math.random;
  const now = opts.now ?? Date.now;
  let wrong = 0;
  let lockedUntil = 0;
  const gate = {
    challenge: makeChallenge(rng),
    isLocked(): boolean {
      return now() < lockedUntil;
    },
    remainingMs(): number {
      return Math.max(0, lockedUntil - now());
    },
    submit(input: string): GateResult {
      if (gate.isLocked()) return 'locked';
      if (checkAnswer(gate.challenge, input)) {
        wrong = 0;
        return 'ok';
      }
      wrong++;
      gate.challenge = makeChallenge(rng);
      if (wrong >= MAX_WRONG) {
        wrong = 0;
        lockedUntil = now() + LOCK_MS;
        return 'locked';
      }
      return 'wrong';
    },
    /** New challenge, streak cleared (lockout, if any, is kept). */
    reset(): void {
      wrong = 0;
      gate.challenge = makeChallenge(rng);
    },
  };
  return gate;
}

export type Gate = ReturnType<typeof createGate>;
