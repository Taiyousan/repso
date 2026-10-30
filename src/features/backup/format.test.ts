import {
  type BackupData,
  describeBackup,
  isBackupDue,
  parseBackup,
  serializeBackup,
} from './format';

const at = new Date('2026-10-30T10:00:00.000Z');

const data: BackupData = {
  exercises: [
    {
      slug: 'barbell-squat',
      name: 'Squat',
      nameEn: 'Barbell Squat',
      primaryMuscles: ['quadriceps'],
      secondaryMuscles: [],
      equipment: 'barbell',
      category: 'strength',
      force: 'push',
      level: 'intermediate',
      mechanic: 'compound',
      instructions: ['Descends.'],
      instructionsLanguage: 'fr',
      images: ['Barbell_Squat/0.jpg'],
      trackingType: 'weight_reps',
      isEssential: true,
      isCustom: false,
      createdAt: at,
    },
  ],
  programs: [
    { id: 3, name: 'PPL', description: null, createdAt: at, updatedAt: null, archivedAt: null },
  ],
  workoutTemplates: [{ id: 5, programId: 3, name: 'Jambes', position: 0, notes: null }],
  templateExercises: [
    {
      id: 7,
      templateId: 5,
      exerciseSlug: 'barbell-squat',
      position: 0,
      restSeconds: 120,
      target: '4 × 8',
      notes: null,
    },
  ],
  workoutSessions: [
    {
      id: 9,
      templateId: 5,
      name: 'Jambes',
      startedAt: at,
      endedAt: at,
      perceivedEffort: 8,
      notes: 'Bien',
    },
    {
      id: 10,
      templateId: null,
      name: 'Entraînement libre',
      startedAt: at,
      endedAt: at,
      perceivedEffort: null,
      notes: null,
    },
  ],
  sessionExercises: [
    {
      id: 11,
      sessionId: 9,
      exerciseSlug: 'barbell-squat',
      sourceTemplateExerciseId: 7,
      position: 0,
      restSeconds: null,
      notes: null,
    },
  ],
  sessionSets: [
    {
      id: 13,
      sessionExerciseId: 11,
      position: 0,
      type: 'normal',
      weight: 82.5,
      reps: 8,
      durationSeconds: null,
      distanceMeters: null,
      rpe: null,
      completedAt: at,
    },
  ],
  tags: [{ id: 15, name: 'Fatigué', color: null }],
  sessionTags: [{ sessionId: 9, tagId: 15 }],
};

const fileWith = (changes: object) => JSON.stringify({ ...JSON.parse(text()), ...changes });
const text = () => serializeBackup(data, at);

const errorOf = (file: string) => {
  const result = parseBackup(file);
  return result.ok ? null : result.error;
};

describe('parseBackup', () => {
  it('reads back an exported file, dates included', () => {
    expect(parseBackup(text())).toEqual({ ok: true, backup: { exportedAt: at, data } });
  });

  it('reads back an empty backup', () => {
    const empty: BackupData = {
      exercises: [],
      programs: [],
      workoutTemplates: [],
      templateExercises: [],
      workoutSessions: [],
      sessionExercises: [],
      sessionSets: [],
      tags: [],
      sessionTags: [],
    };
    expect(parseBackup(serializeBackup(empty, at))).toEqual({
      ok: true,
      backup: { exportedAt: at, data: empty },
    });
  });

  it('refuses what is not a backup', () => {
    const notBackup = 'Ce fichier n’est pas une sauvegarde Workout Planner.';
    expect(errorOf('pas du json')).toBe(notBackup);
    expect(errorOf('[]')).toBe(notBackup);
    expect(errorOf(fileWith({ format: 'workout-planner.program' }))).toBe(notBackup);
  });

  it('refuses a backup from a newer version', () => {
    expect(errorOf(fileWith({ version: 99 }))).toContain('mets l’application à jour');
  });

  it('refuses a missing table', () => {
    const { tags: _tags, ...withoutTags } = data;
    expect(errorOf(fileWith({ data: withoutTags }))).toContain('(tags)');
  });

  it('refuses a wrong value and says where', () => {
    const sessionSets = [{ ...data.sessionSets[0], type: 'inconnu' }];
    expect(errorOf(fileWith({ data: { ...data, sessionSets } }))).toContain(
      'sessionSets, ligne 1, type',
    );
  });

  it('refuses an invalid date', () => {
    const programs = [{ ...data.programs[0], createdAt: 'hier' }];
    expect(errorOf(fileWith({ data: { ...data, programs } }))).toContain('createdAt');
  });

  it('refuses an unfinished workout', () => {
    const workoutSessions = [{ ...data.workoutSessions[1], endedAt: null }];
    expect(errorOf(fileWith({ data: { ...data, workoutSessions } }))).toContain('endedAt');
  });

  it('refuses a row pointing to nothing', () => {
    const sessionTags = [{ sessionId: 9, tagId: 404 }];
    expect(errorOf(fileWith({ data: { ...data, sessionTags } }))).toContain('sessionTags');
    const sessionExercises = [{ ...data.sessionExercises[0], exerciseSlug: 'inconnu' }];
    expect(errorOf(fileWith({ data: { ...data, sessionExercises } }))).toContain('exerciseSlug');
  });

  it('accepts a null optional reference', () => {
    const sessionExercises = [{ ...data.sessionExercises[0], sourceTemplateExerciseId: null }];
    expect(parseBackup(fileWith({ data: { ...data, sessionExercises } })).ok).toBe(true);
  });

  it('drops unknown fields', () => {
    const tags = [{ ...data.tags[0], extra: 'x' }];
    const result = parseBackup(fileWith({ data: { ...data, tags } }));
    expect(result.ok && result.backup.data.tags).toEqual(data.tags);
  });
});

describe('describeBackup', () => {
  it('counts workouts and programs', () => {
    expect(describeBackup(data)).toBe('2 entraînements, 1 programme');
  });
});

describe('isBackupDue', () => {
  const now = new Date('2026-10-30T10:00:00Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it('never asks without any workout', () => {
    expect(isBackupDue(null, null, now)).toBe(false);
  });

  it('asks when workouts were never backed up', () => {
    expect(isBackupDue(null, daysAgo(1), now)).toBe(true);
  });

  it('waits two weeks after a backup', () => {
    expect(isBackupDue(daysAgo(13), daysAgo(1), now)).toBe(false);
    expect(isBackupDue(daysAgo(14), daysAgo(1), now)).toBe(true);
  });

  it('never asks when nothing happened since the backup', () => {
    expect(isBackupDue(daysAgo(30), daysAgo(31), now)).toBe(false);
  });
});
