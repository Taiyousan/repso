import {
  effortLabel,
  formatDelta,
  formatVolume,
  planTemplateUpdate,
  type SessionItem,
  sessionTotals,
  type TemplateItem,
  templateChanges,
  workedMuscles,
} from './recap';

// Template items 1, 2, 3 for exercises 10, 20, 30.
const template: TemplateItem[] = [
  { id: 1, exerciseId: 10, restSeconds: 90 },
  { id: 2, exerciseId: 20, restSeconds: null },
  { id: 3, exerciseId: 30, restSeconds: 60 },
];

const fromTemplate = (item: TemplateItem, id = item.id + 100): SessionItem => ({
  id,
  exerciseId: item.exerciseId,
  sourceTemplateExerciseId: item.id,
  restSeconds: item.restSeconds,
});

const added = (id: number, exerciseId: number): SessionItem => ({
  id,
  exerciseId,
  sourceTemplateExerciseId: null,
  restSeconds: null,
});

const asIs = template.map((item) => fromTemplate(item));

const exerciseIds = (plan: ReturnType<typeof planTemplateUpdate>) =>
  plan.map((item) => item.exerciseId);

describe('templateChanges', () => {
  it('finds nothing when the session followed the template', () => {
    expect(templateChanges(template, asIs)).toEqual([]);
  });

  it('lists added, removed and rest changes', () => {
    const session = [{ ...asIs[0], restSeconds: 120 }, asIs[1], added(200, 40)];
    expect(templateChanges(template, session)).toEqual([
      { key: 'rest-1', kind: 'rest', exerciseId: 10, from: 90, to: 120 },
      { key: 'added-200', kind: 'added', exerciseId: 40 },
      { key: 'removed-3', kind: 'removed', exerciseId: 30 },
    ]);
  });

  it('detects a new order', () => {
    expect(templateChanges(template, [asIs[1], asIs[0], asIs[2]])).toEqual([
      { key: 'order', kind: 'order' },
    ]);
  });

  it('matches an exercise removed then added back', () => {
    expect(templateChanges(template, [asIs[0], asIs[1], added(200, 30)])).toEqual([
      { key: 'rest-3', kind: 'rest', exerciseId: 30, from: 60, to: null },
    ]);
  });
});

describe('planTemplateUpdate', () => {
  const session = [asIs[2], added(200, 40), asIs[0]]; // 30, new 40, 10 — 20 skipped
  const all = new Set(templateChanges(template, session).map((change) => change.key));

  it('copies the session when every change is accepted', () => {
    const plan = planTemplateUpdate(template, session, all);
    expect(exerciseIds(plan)).toEqual([30, 40, 10]);
    expect(plan[1]).toEqual({
      templateExerciseId: null,
      sessionExerciseId: 200,
      exerciseId: 40,
      restSeconds: null,
    });
  });

  it('keeps the template when nothing is accepted', () => {
    expect(exerciseIds(planTemplateUpdate(template, session, new Set()))).toEqual([10, 20, 30]);
  });

  it('keeps a skipped exercise after its predecessor in the new order', () => {
    const plan = planTemplateUpdate(template, session, new Set(['order', 'added-200']));
    expect(exerciseIds(plan)).toEqual([30, 40, 10, 20]);
  });

  it('inserts an addition after its predecessor in the template order', () => {
    const plan = planTemplateUpdate(template, session, new Set(['added-200']));
    expect(exerciseIds(plan)).toEqual([10, 20, 30, 40]);
  });

  it('inserts an addition at the start when it came first', () => {
    const plan = planTemplateUpdate(template, [added(200, 40), ...asIs], new Set(['added-200']));
    expect(exerciseIds(plan)).toEqual([40, 10, 20, 30]);
  });

  it('applies accepted rest changes only', () => {
    const changed = [{ ...asIs[0], restSeconds: 120 }, { ...asIs[1], restSeconds: 45 }, asIs[2]];
    const plan = planTemplateUpdate(template, changed, new Set(['rest-1']));
    expect(plan.map((item) => item.restSeconds)).toEqual([120, null, 60]);
  });
});

describe('sessionTotals', () => {
  it('counts working sets only', () => {
    const totals = sessionTotals(new Date(0), new Date(3_000_000), [
      {
        sets: [
          { type: 'warmup', weight: 40, reps: 10 },
          { type: 'normal', weight: 80, reps: 8 },
        ],
      },
      { sets: [{ type: 'normal', weight: null, reps: 12 }] },
    ]);
    expect(totals).toEqual({ durationMs: 3_000_000, volume: 640, setCount: 2 });
  });
});

describe('formatting', () => {
  it('formats volumes and deltas', () => {
    expect(formatVolume(4250.6)).toBe('4 251 kg');
    expect(formatVolume(980)).toBe('980 kg');
    expect(formatDelta(120)).toBe('+120');
    expect(formatDelta(-3)).toBe('−3');
    expect(formatDelta(0)).toBe('=');
  });

  it('labels the effort scale', () => {
    expect(effortLabel(1)).toBe('Très facile');
    expect(effortLabel(7)).toBe('Difficile');
    expect(effortLabel(10)).toBe('Maximal');
  });
});

describe('workedMuscles', () => {
  it('lets primary muscles win', () => {
    expect(
      workedMuscles([
        { primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'] },
        { primaryMuscles: ['triceps'], secondaryMuscles: [] },
      ]),
    ).toEqual({ primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['shoulders'] });
  });
});
