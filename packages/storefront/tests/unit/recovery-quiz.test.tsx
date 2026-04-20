import {describe, it, expect} from 'vitest';
import {
  STEPS,
  ACTIVITY_CONTEXTS,
  GOALS,
  TIMES,
  EXPERIENCES,
  isComplete,
  readResult,
  parseStep,
} from '~/components/RecoveryQuiz';

describe('RecoveryQuiz state machine', () => {
  it('exposes the six canonical steps in order', () => {
    expect(STEPS).toEqual(['body', 'pain', 'context', 'goal', 'time', 'experience']);
  });

  it('defines exactly 4 activity contexts, 4 goals, 4 time buckets, 3 experience levels', () => {
    expect(ACTIVITY_CONTEXTS).toHaveLength(4);
    expect(GOALS).toHaveLength(4);
    expect(TIMES).toHaveLength(4);
    expect(EXPERIENCES).toHaveLength(3);
  });

  it('parseStep defaults to "body" for unknown input', () => {
    expect(parseStep(null)).toBe('body');
    expect(parseStep('')).toBe('body');
    expect(parseStep('nonsense')).toBe('body');
    expect(parseStep('goal')).toBe('goal');
  });

  it('readResult parses empty searchParams to empty-ish QuizResult', () => {
    const r = readResult(new URLSearchParams(''));
    expect(r.body).toEqual([]);
    expect(r.pain).toBe(0);
    expect(r.context).toBeNull();
    expect(r.goal).toBeNull();
    expect(r.time).toBeNull();
    expect(r.experience).toBeNull();
  });

  it('readResult parses a fully-populated URL', () => {
    const params = new URLSearchParams(
      'body=knees,back&pain=7&context=athletic&goal=mobility&time=15-30&experience=some',
    );
    const r = readResult(params);
    expect(r.body).toEqual(['knees', 'back']);
    expect(r.pain).toBe(7);
    expect(r.context).toBe('athletic');
    expect(r.goal).toBe('mobility');
    expect(r.time).toBe('15-30');
    expect(r.experience).toBe('some');
  });

  it('readResult rejects garbage body areas + clamps pain out of range', () => {
    const r = readResult(new URLSearchParams('body=knees,robot&pain=99'));
    expect(r.body).toEqual(['knees']); // "robot" filtered out
    expect(r.pain).toBe(0); // out of [1,10]
  });

  it('readResult rejects unknown enum values for context/goal/time/experience', () => {
    const r = readResult(new URLSearchParams('context=hacker&goal=fly'));
    expect(r.context).toBeNull();
    expect(r.goal).toBeNull();
  });

  it('isComplete — false when any required field is missing', () => {
    const base = {
      body: ['knees' as const],
      pain: 5,
      context: 'athletic' as const,
      goal: 'mobility' as const,
      time: '15-30' as const,
      experience: 'some' as const,
    };
    expect(isComplete(base)).toBe(true);
    expect(isComplete({...base, body: []})).toBe(false);
    expect(isComplete({...base, pain: 0})).toBe(false);
    expect(isComplete({...base, pain: 11})).toBe(false);
    expect(isComplete({...base, context: null})).toBe(false);
    expect(isComplete({...base, goal: null})).toBe(false);
    expect(isComplete({...base, time: null})).toBe(false);
    expect(isComplete({...base, experience: null})).toBe(false);
  });
});
