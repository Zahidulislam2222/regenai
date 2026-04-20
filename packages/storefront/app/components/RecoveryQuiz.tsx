import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';
import {ChevronLeft, ChevronRight, Check} from 'lucide-react';
import {BodyAreaSelector, BODY_AREAS, type BodyArea} from './BodyAreaSelector';
import {cn} from '~/lib/utils';

/**
 * RecoveryQuiz — 6-step intake flow that writes a customer profile to
 * a metafield + emits a `quiz_complete` analytics event. State machine
 * is vanilla (no xstate) to keep the bundle tight.
 *
 * State lives in URL searchParams so progress is shareable, back-button
 * compatible, and survives page reload. No PII is stored.
 *
 * Metafield write: `regenai.quiz_result` (JSON blob). Full Storefront
 * API customer write lands Day 20+ once customer-account auth is wired.
 * Until then we cache in localStorage under `regenai:quiz_result:pending`
 * and flush on next authenticated session.
 */

const STEPS = ['body', 'pain', 'context', 'goal', 'time', 'experience'] as const;
type Step = (typeof STEPS)[number];

const ACTIVITY_CONTEXTS = [
  {id: 'desk-work', label: 'Desk work / sedentary'},
  {id: 'athletic', label: 'Athletic / training regularly'},
  {id: 'daily-living', label: 'Active daily living'},
  {id: 'post-injury', label: 'Post-injury recovery'},
] as const;
type ActivityContext = (typeof ACTIVITY_CONTEXTS)[number]['id'];

const GOALS = [
  {id: 'mobility', label: 'Mobility + flexibility'},
  {id: 'strength', label: 'Strength + stability'},
  {id: 'pain-reduction', label: 'Pain reduction'},
  {id: 'sleep', label: 'Sleep + recovery quality'},
] as const;
type Goal = (typeof GOALS)[number]['id'];

const TIMES = [
  {id: '<=15', label: '≤ 15 minutes / day'},
  {id: '15-30', label: '15–30 minutes / day'},
  {id: '30-60', label: '30–60 minutes / day'},
  {id: '60+', label: '60+ minutes / day'},
] as const;
type TimeBudget = (typeof TIMES)[number]['id'];

const EXPERIENCES = [
  {id: 'none', label: 'New to recovery tools'},
  {id: 'some', label: 'Some experience'},
  {id: 'extensive', label: 'Extensive — clinical / athletic background'},
] as const;
type Experience = (typeof EXPERIENCES)[number]['id'];

export interface QuizResult {
  body: BodyArea[];
  pain: number; // 1-10
  context: ActivityContext | null;
  goal: Goal | null;
  time: TimeBudget | null;
  experience: Experience | null;
}

const LS_KEY = 'regenai:quiz_result:pending';

function isComplete(r: QuizResult): boolean {
  return (
    r.body.length > 0 &&
    r.pain >= 1 &&
    r.pain <= 10 &&
    r.context !== null &&
    r.goal !== null &&
    r.time !== null &&
    r.experience !== null
  );
}

function parseStep(raw: string | null): Step {
  return (STEPS as readonly string[]).includes(raw ?? '') ? (raw as Step) : 'body';
}

function readResult(params: URLSearchParams): QuizResult {
  const body = (params.get('body') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is BodyArea =>
      (BODY_AREAS as readonly string[]).includes(s),
    );
  const pain = Number(params.get('pain') ?? '0');
  return {
    body,
    pain: Number.isFinite(pain) && pain >= 1 && pain <= 10 ? pain : 0,
    context: (ACTIVITY_CONTEXTS.find((c) => c.id === params.get('context'))?.id ?? null) as ActivityContext | null,
    goal: (GOALS.find((g) => g.id === params.get('goal'))?.id ?? null) as Goal | null,
    time: (TIMES.find((t) => t.id === params.get('time'))?.id ?? null) as TimeBudget | null,
    experience: (EXPERIENCES.find((e) => e.id === params.get('experience'))?.id ?? null) as Experience | null,
  };
}

function persistToLocalStorage(result: QuizResult) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({result, queuedAt: Date.now()}),
    );
  } catch {
    // Quota or disabled storage — swallow.
  }
}

export function RecoveryQuiz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const step: Step = parseStep(searchParams.get('step'));
  const result = useMemo(() => readResult(searchParams), [searchParams]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const analytics = useAnalytics();

  const stepIndex = STEPS.indexOf(step);
  const canAdvance = useMemo(() => {
    switch (step) {
      case 'body':       return result.body.length > 0;
      case 'pain':       return result.pain >= 1 && result.pain <= 10;
      case 'context':    return result.context !== null;
      case 'goal':       return result.goal !== null;
      case 'time':       return result.time !== null;
      case 'experience': return result.experience !== null;
    }
  }, [step, result]);

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (curr) => {
          const copy = new URLSearchParams(curr);
          copy.set(key, value);
          return copy;
        },
        {preventScrollReset: true, replace: false},
      );
    },
    [setSearchParams],
  );

  const go = useCallback(
    (direction: 1 | -1) => {
      const next = Math.max(0, Math.min(STEPS.length - 1, stepIndex + direction));
      setParam('step', STEPS[next]);
    },
    [stepIndex, setParam],
  );

  const submit = useCallback(async () => {
    if (!isComplete(result)) return;
    setSubmitting(true);
    persistToLocalStorage(result);

    // Phase 1 — emit the analytics event. Customer-account write lands Day 20+.
    try {
      analytics?.publish?.('custom_quiz_complete', {
        body: result.body,
        pain: result.pain,
        context: result.context,
        goal: result.goal,
        time: result.time,
        experience: result.experience,
      });
    } catch {
      // Never break submit on analytics failure.
    }

    setSubmitted(true);
    setSubmitting(false);
  }, [result, analytics]);

  // Auto-initialise pain to 5 when entering pain step and unset.
  useEffect(() => {
    if (step === 'pain' && result.pain === 0) {
      setParam('pain', '5');
    }
  }, [step, result.pain, setParam]);

  if (submitted) {
    return <QuizSuccess result={result} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProgressBar stepIndex={stepIndex} total={STEPS.length} />

      <div
        role="region"
        aria-labelledby="quiz-step-title"
        className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)]"
      >
        {step === 'body'       && <BodyStep />}
        {step === 'pain'       && <PainStep pain={result.pain} onChange={(v) => setParam('pain', String(v))} />}
        {step === 'context'    && <ContextStep value={result.context} onChange={(v) => setParam('context', v)} />}
        {step === 'goal'       && <GoalStep value={result.goal} onChange={(v) => setParam('goal', v)} />}
        {step === 'time'       && <TimeStep value={result.time} onChange={(v) => setParam('time', v)} />}
        {step === 'experience' && <ExperienceStep value={result.experience} onChange={(v) => setParam('experience', v)} />}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={stepIndex === 0}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-default)] px-4 py-2 text-sm',
            'hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canAdvance}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white',
              'hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void submit();
            }}
            disabled={!canAdvance || submitting}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white',
              'hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {submitting ? 'Submitting…' : 'Finish quiz'}
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Sub-components — each step
// -----------------------------------------------------------------------

function ProgressBar({stepIndex, total}: {stepIndex: number; total: number}) {
  const pct = ((stepIndex + 1) / total) * 100;
  return (
    <div>
      <div
        className="flex items-center justify-between text-xs text-[var(--text-subtle)]"
        aria-hidden="true"
      >
        <span>Step {stepIndex + 1} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Quiz progress"
        className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--color-bone-muted)]"
      >
        <div
          className="h-full bg-[var(--color-primary)] transition-[width] duration-300"
          style={{width: `${pct}%`}}
        />
      </div>
    </div>
  );
}

function BodyStep() {
  return (
    <>
      <h2 id="quiz-step-title" className="text-xl font-semibold text-[var(--text-primary)]">
        Where do you need help?
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Pick one or more body areas. Your recommendations will focus here.
      </p>
      <div className="mt-5">
        <BodyAreaSelector />
      </div>
    </>
  );
}

function PainStep({
  pain,
  onChange,
}: {
  pain: number;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <h2 id="quiz-step-title" className="text-xl font-semibold text-[var(--text-primary)]">
        How uncomfortable is it today?
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        1 = barely notice, 10 = can&rsquo;t function. This is a check-in, not a diagnosis.
      </p>
      <div className="mt-6">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={pain || 5}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Pain level, 1 to 10"
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="mt-2 flex justify-between text-xs text-[var(--text-subtle)]">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
        <p className="mt-4 text-center text-3xl font-semibold text-[var(--color-primary)]">
          {pain || 5}
        </p>
      </div>
    </>
  );
}

function ChoiceStep<T extends string>({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description: string;
  options: readonly {id: T; label: string}[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <>
      <h2 id="quiz-step-title" className="text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      <fieldset className="mt-5 space-y-2">
        <legend className="sr-only">{title}</legend>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors',
                selected
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border-default)] hover:bg-[var(--color-bone-muted)]',
              )}
            >
              <input
                type="radio"
                name="quiz-choice"
                value={opt.id}
                checked={selected}
                onChange={() => onChange(opt.id)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
            </label>
          );
        })}
      </fieldset>
    </>
  );
}

function ContextStep({value, onChange}: {value: ActivityContext | null; onChange: (v: ActivityContext) => void}) {
  return (
    <ChoiceStep
      title="What describes your daily activity?"
      description="We tune intensity + modality recommendations to this."
      options={ACTIVITY_CONTEXTS}
      value={value}
      onChange={onChange}
    />
  );
}

function GoalStep({value, onChange}: {value: Goal | null; onChange: (v: Goal) => void}) {
  return (
    <ChoiceStep
      title="What&rsquo;s your primary goal?"
      description="You can refine this later from your protocol tracker."
      options={GOALS}
      value={value}
      onChange={onChange}
    />
  );
}

function TimeStep({value, onChange}: {value: TimeBudget | null; onChange: (v: TimeBudget) => void}) {
  return (
    <ChoiceStep
      title="How much time can you give each day?"
      description="Protocols are sized to fit. Consistency beats intensity."
      options={TIMES}
      value={value}
      onChange={onChange}
    />
  );
}

function ExperienceStep({value, onChange}: {value: Experience | null; onChange: (v: Experience) => void}) {
  return (
    <ChoiceStep
      title="How familiar are you with recovery tools?"
      description="We&rsquo;ll pitch instructions at the right level."
      options={EXPERIENCES}
      value={value}
      onChange={onChange}
    />
  );
}

function QuizSuccess({result}: {result: QuizResult}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-2xl rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-8 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
        <Check className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-[var(--color-primary)]">
        Quiz saved
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
        We&rsquo;ll use your answers to recommend protocols and products. Log in next
        time to sync your profile across devices.
      </p>
      <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-x-4 gap-y-2 text-left text-xs">
        <dt className="text-[var(--text-subtle)]">Areas</dt>
        <dd className="font-medium">{result.body.join(', ')}</dd>
        <dt className="text-[var(--text-subtle)]">Pain</dt>
        <dd className="font-medium">{result.pain} / 10</dd>
        <dt className="text-[var(--text-subtle)]">Context</dt>
        <dd className="font-medium">{result.context}</dd>
        <dt className="text-[var(--text-subtle)]">Goal</dt>
        <dd className="font-medium">{result.goal}</dd>
        <dt className="text-[var(--text-subtle)]">Time / day</dt>
        <dd className="font-medium">{result.time}</dd>
        <dt className="text-[var(--text-subtle)]">Experience</dt>
        <dd className="font-medium">{result.experience}</dd>
      </dl>
    </div>
  );
}

// Exports for testing
export {
  STEPS,
  ACTIVITY_CONTEXTS,
  GOALS,
  TIMES,
  EXPERIENCES,
  isComplete,
  readResult,
  parseStep,
};
