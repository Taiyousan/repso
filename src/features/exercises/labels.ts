import type { TrackingType } from '@/db/schema';

/** Muscle identifiers (from free-exercise-db), in display order. */
export const MUSCLES = [
  'chest',
  'shoulders',
  'triceps',
  'biceps',
  'forearms',
  'lats',
  'middle back',
  'traps',
  'lower back',
  'abdominals',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'abductors',
  'neck',
] as const;
export type Muscle = (typeof MUSCLES)[number];

const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Pectoraux',
  shoulders: 'Épaules',
  triceps: 'Triceps',
  biceps: 'Biceps',
  forearms: 'Avant-bras',
  lats: 'Dorsaux',
  'middle back': 'Milieu du dos',
  traps: 'Trapèzes',
  'lower back': 'Lombaires',
  abdominals: 'Abdominaux',
  quadriceps: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers',
  calves: 'Mollets',
  adductors: 'Adducteurs',
  abductors: 'Abducteurs',
  neck: 'Cou',
};

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'body only',
  'kettlebells',
  'bands',
  'e-z curl bar',
  'medicine ball',
  'exercise ball',
  'foam roll',
  'other',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  machine: 'Machine',
  cable: 'Poulie',
  'body only': 'Poids du corps',
  kettlebells: 'Kettlebell',
  bands: 'Élastiques',
  'e-z curl bar': 'Barre EZ',
  'medicine ball': 'Médecine-ball',
  'exercise ball': 'Swiss ball',
  'foam roll': 'Rouleau',
  other: 'Autre',
};

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Musculation',
  stretching: 'Étirement',
  plyometrics: 'Pliométrie',
  strongman: 'Strongman',
  powerlifting: 'Powerlifting',
  cardio: 'Cardio',
  'olympic weightlifting': 'Haltérophilie',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  expert: 'Expert',
};

const MECHANIC_LABELS: Record<string, string> = {
  compound: 'Polyarticulaire',
  isolation: 'Isolation',
};

/** How a set is logged: name, typical exercises, and a set as the workout shows it. */
export const TRACKING_TYPE_DETAILS: Record<
  TrackingType,
  { label: string; examples: string; set: string }
> = {
  weight_reps: { label: 'Charge × reps', examples: 'Barre, haltères, machine', set: '80 kg × 8' },
  bodyweight_reps: { label: 'Poids du corps', examples: 'Pompes, crunchs, fentes', set: '× 12' },
  weighted_bodyweight: {
    label: 'Poids du corps + lest',
    examples: 'Tractions, dips, lest facultatif',
    set: '+10 kg × 6',
  },
  assisted_reps: {
    label: 'Poids du corps assisté',
    examples: 'Machine ou élastique qui aide',
    set: '−20 kg × 8',
  },
  duration: { label: 'Durée', examples: 'Gainage, étirements, cardio', set: '45 s' },
  // Logged as a duration so far: no longer offered, kept for the exercises that use it.
  distance: { label: 'Distance (durée)', examples: 'Temps sur une distance', set: '45 s' },
};

export const muscleLabel = (muscle: string) => MUSCLE_LABELS[muscle as Muscle] ?? muscle;
export const equipmentLabel = (equipment: string) =>
  EQUIPMENT_LABELS[equipment as Equipment] ?? equipment;
export const categoryLabel = (category: string) => CATEGORY_LABELS[category] ?? category;
export const levelLabel = (level: string) => LEVEL_LABELS[level] ?? level;
export const mechanicLabel = (mechanic: string) => MECHANIC_LABELS[mechanic] ?? mechanic;
