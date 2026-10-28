import { normalizeText, slugify } from '@/lib/text';

import type { ProgramFileExercise } from './format';

export type CatalogExercise = {
  id: number;
  slug: string;
  name: string;
  nameEn: string | null;
  isEssential: boolean;
};

export type ExerciseMatch =
  /** Same slug, or same French or English name. */
  | { kind: 'exact'; exerciseId: number }
  /** Closest name, to be checked by the user. */
  | { kind: 'suggested'; exerciseId: number }
  | { kind: 'none' };

/** Words ignored when comparing names. "Medium grip" is the default grip. */
// prettier-ignore
const STOP_WORDS = new Set([
  'a', 'au', 'aux', 'avec', 'd', 'de', 'des', 'du', 'en', 'et', 'l', 'la', 'le', 'les', 'sur',
  'the', 'with', 'on', 'and', 'of', 'to', 'medium', 'grip',
]);

/**
 * Equipment words, compared apart: "Dumbbell Lateral Raise" should find "Side Lateral Raise"
 * rather than "Dumbbell Raise", but not "Lateral Raise - With Bands".
 */
// prettier-ignore
const EQUIPMENT_WORDS = new Set([
  'barbell', 'dumbbell', 'cable', 'rope', 'machine', 'band', 'kettlebell', 'ez', 'bar', 'smith',
  'sled', 'barre', 'haltere', 'poulie', 'corde', 'elastique', 'traineau',
]);

/** Words that change the exercise: both names must have them or not ("incline" vs flat press). */
const VARIANT_WORDS = ['incline', 'decline', 'lying', 'allonge', 'reverse', 'inverse'];

const MIN_SUGGESTION_SCORE = 0.5;

function words(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

/** "curl" ~ "curls", "press" ~ "presses": a plural ending is tolerated. */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.length >= 3 && long.startsWith(short) && long.length - short.length <= 2;
}

/** Dice coefficient over words: 1 when both names have the same words, 0 when none shared. */
function dice(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const shared = a.filter((word) => b.some((other) => sameWord(word, other))).length;
  return (2 * shared) / (a.length + b.length);
}

const hasWord = (name: string[], word: string) => name.some((other) => sameWord(word, other));

const EQUIPMENT_MISMATCH_PENALTY = 0.4;

const isEquipment = (word: string) => EQUIPMENT_WORDS.has(word.replace(/s$/, ''));

/**
 * Compares the words saying what the exercise is, then penalizes a different equipment. 0 when
 * a variant word ("incline", "lying"…) is on one side only.
 */
function similarity(a: string[], b: string[]): number {
  if (VARIANT_WORDS.some((word) => hasWord(a, word) !== hasWord(b, word))) return 0;
  const core = (name: string[]) => {
    const kept = name.filter((word) => !isEquipment(word));
    return kept.length > 0 ? kept : name;
  };
  const equipmentA = a.filter(isEquipment);
  const equipmentB = b.filter(isEquipment);
  const mismatch =
    equipmentA.length > 0 &&
    equipmentB.length > 0 &&
    !equipmentA.some((word) => hasWord(equipmentB, word));
  return dice(core(a), core(b)) + dice(a, b) / 100 - (mismatch ? EQUIPMENT_MISMATCH_PENALTY : 0);
}

/**
 * Builds a matcher over the exercise catalog (library and custom exercises). Matching order:
 * slug, then exact name (French or English, accents and punctuation ignored), then the closest
 * name as a suggestion. Essentials win ties, being the usual pick.
 */
export function createExerciseMatcher(catalog: CatalogExercise[]) {
  const bySlug = new Map(catalog.map((exercise) => [exercise.slug, exercise.id]));
  const byName = new Map<string, number>();
  // Essentials first, so they own a name shared with an obscure variant.
  const ordered = [...catalog].sort((a, b) => Number(b.isEssential) - Number(a.isEssential));
  for (const exercise of ordered) {
    for (const name of [exercise.name, exercise.nameEn]) {
      const key = name ? slugify(name) : '';
      if (key && !byName.has(key)) byName.set(key, exercise.id);
    }
  }
  const indexed = ordered.map((exercise) => ({
    id: exercise.id,
    names: [exercise.name, exercise.nameEn].filter((name): name is string => !!name).map(words),
  }));

  return (entry: Pick<ProgramFileExercise, 'slug' | 'name'>): ExerciseMatch => {
    if (entry.slug) {
      // Also accepts the upstream spelling, e.g. "Barbell_Squat" for "barbell-squat".
      const id = bySlug.get(entry.slug) ?? bySlug.get(slugify(entry.slug));
      if (id !== undefined) return { kind: 'exact', exerciseId: id };
    }
    if (!entry.name) return { kind: 'none' };

    const exactId = byName.get(slugify(entry.name));
    if (exactId !== undefined) return { kind: 'exact', exerciseId: exactId };

    const target = words(entry.name);
    let best: { id: number; score: number } | null = null;
    for (const exercise of indexed) {
      const score = Math.max(...exercise.names.map((name) => similarity(target, name)));
      if (score > (best?.score ?? 0)) best = { id: exercise.id, score };
    }
    return best && best.score >= MIN_SUGGESTION_SCORE
      ? { kind: 'suggested', exerciseId: best.id }
      : { kind: 'none' };
  };
}
