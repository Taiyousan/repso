import { isWorkingSet, type LoggedSet, totalVolume } from '@/domain/volume';

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export type SessionTotals = { durationMs: number; volume: number; setCount: number };

export function sessionTotals(
  startedAt: Date,
  endedAt: Date,
  exercises: { sets: LoggedSet[] }[],
): SessionTotals {
  const sets = exercises.flatMap((item) => item.sets);
  return {
    durationMs: endedAt.getTime() - startedAt.getTime(),
    volume: totalVolume(sets),
    setCount: sets.filter(isWorkingSet).length,
  };
}

/** 4250.5 -> "4 251 kg" (narrow no-break space between thousands) */
export function formatVolume(volume: number): string {
  return `${String(Math.round(volume)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kg`;
}

/** "+120", "−3", "=" — `format` renders the absolute value. */
export function formatDelta(delta: number, format: (value: number) => string = String): string {
  if (delta === 0) return '=';
  return `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`;
}

/** Perceived effort scale shown next to the selected value. */
export function effortLabel(effort: number): string {
  if (effort <= 2) return 'Très facile';
  if (effort <= 4) return 'Facile';
  if (effort <= 6) return 'Modéré';
  if (effort <= 8) return 'Difficile';
  if (effort === 9) return 'Très difficile';
  return 'Maximal';
}

/** Muscles of the session: primary ones of any exercise win over secondary ones. */
export function workedMuscles(
  exercises: { primaryMuscles: string[]; secondaryMuscles: string[] }[],
) {
  const primary = new Set(exercises.flatMap((exercise) => exercise.primaryMuscles));
  const secondary = new Set(
    exercises.flatMap((exercise) => exercise.secondaryMuscles).filter((m) => !primary.has(m)),
  );
  return { primaryMuscles: [...primary], secondaryMuscles: [...secondary] };
}

// ---------------------------------------------------------------------------
// Session vs template diff
// ---------------------------------------------------------------------------

export type TemplateItem = { id: number; exerciseId: number; restSeconds: number | null };

export type SessionItem = {
  id: number;
  exerciseId: number;
  sourceTemplateExerciseId: number | null;
  restSeconds: number | null;
};

export type TemplateChange =
  | { key: string; kind: 'added'; exerciseId: number }
  | { key: string; kind: 'removed'; exerciseId: number }
  | {
      key: string;
      kind: 'rest';
      exerciseId: number;
      from: number | null;
      to: number | null;
    }
  | { key: string; kind: 'order' };

/**
 * Template item each session item comes from. An exercise removed then added back during the
 * session lost its link: it is matched again by exercise.
 */
function matchItems(template: TemplateItem[], session: SessionItem[]): (TemplateItem | null)[] {
  const byId = new Map(template.map((item) => [item.id, item]));
  const used = new Set<number>();
  const matches = session.map((item) => {
    const source =
      item.sourceTemplateExerciseId == null ? undefined : byId.get(item.sourceTemplateExerciseId);
    if (!source || used.has(source.id)) return null;
    used.add(source.id);
    return source;
  });
  return matches.map((match, index) => {
    if (match) return match;
    const fallback = template.find(
      (item) => !used.has(item.id) && item.exerciseId === session[index].exerciseId,
    );
    if (!fallback) return null;
    used.add(fallback.id);
    return fallback;
  });
}

/** What changed between a template (in order) and a session started from it (in order). */
export function templateChanges(
  template: TemplateItem[],
  session: SessionItem[],
): TemplateChange[] {
  const matches = matchItems(template, session);
  const changes: TemplateChange[] = [];

  session.forEach((item, index) => {
    const match = matches[index];
    if (!match) {
      changes.push({ key: `added-${item.id}`, kind: 'added', exerciseId: item.exerciseId });
    } else if (match.restSeconds !== item.restSeconds) {
      changes.push({
        key: `rest-${match.id}`,
        kind: 'rest',
        exerciseId: item.exerciseId,
        from: match.restSeconds,
        to: item.restSeconds,
      });
    }
  });

  const matched = new Set(matches.flatMap((match) => (match ? [match.id] : [])));
  for (const item of template) {
    if (!matched.has(item.id)) {
      changes.push({ key: `removed-${item.id}`, kind: 'removed', exerciseId: item.exerciseId });
    }
  }

  const positions = new Map(template.map((item, index) => [item.id, index]));
  const order = matches.flatMap((match) => (match ? [positions.get(match.id)!] : []));
  if (order.some((position, index) => index > 0 && position < order[index - 1])) {
    changes.push({ key: 'order', kind: 'order' });
  }
  return changes;
}

export type PlannedItem = {
  /** Template item kept, null for a new one. */
  templateExerciseId: number | null;
  /** Session item it comes from, linked to the new template item. */
  sessionExerciseId: number | null;
  exerciseId: number;
  restSeconds: number | null;
};

/** New content of the template once the accepted changes (by key) are applied. */
export function planTemplateUpdate(
  template: TemplateItem[],
  session: SessionItem[],
  accepted: ReadonlySet<string>,
): PlannedItem[] {
  const matches = matchItems(template, session);
  const planned = new Map<TemplateItem | SessionItem, PlannedItem>();

  for (const item of template) {
    const index = matches.indexOf(item);
    const sessionItem = index === -1 ? undefined : session[index];
    if (!sessionItem && accepted.has(`removed-${item.id}`)) continue;
    planned.set(item, {
      templateExerciseId: item.id,
      sessionExerciseId: sessionItem?.id ?? null,
      exerciseId: item.exerciseId,
      restSeconds:
        sessionItem && accepted.has(`rest-${item.id}`) ? sessionItem.restSeconds : item.restSeconds,
    });
  }
  session.forEach((item, index) => {
    if (matches[index] || !accepted.has(`added-${item.id}`)) return;
    planned.set(item, {
      templateExerciseId: null,
      sessionExerciseId: item.id,
      exerciseId: item.exerciseId,
      restSeconds: item.restSeconds,
    });
  });

  // One order is followed, items only known to the other one go right after their predecessor.
  const sessionOrder = session.map((item, index) => matches[index] ?? item);
  const [base, other] = accepted.has('order') ? [sessionOrder, template] : [template, sessionOrder];

  const result = base.flatMap((item) => planned.get(item) ?? []);
  let anchor = -1;
  for (const item of other) {
    const value = planned.get(item);
    if (!value) continue;
    const position = result.indexOf(value);
    if (position === -1) {
      result.splice(anchor + 1, 0, value);
      anchor += 1;
    } else {
      anchor = position;
    }
  }
  return result;
}
