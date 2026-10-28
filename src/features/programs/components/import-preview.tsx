import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { useExerciseList } from '@/features/exercises/queries';

import { type ImportRef, refKey, type Resolution } from '../transfer/plan';
import { useImportStore } from '../transfer/store';

type ImportPreviewProps = {
  onImport: () => void;
  onCancel: () => void;
};

/** Analysed program: how each exercise was matched, editable, then the import button. */
export function ImportPreview({ onImport, onCancel }: ImportPreviewProps) {
  const draft = useImportStore((state) => state.draft);
  const { data: catalog } = useExerciseList();
  const names = useMemo(
    () => new Map(catalog.map((exercise) => [exercise.id, exercise.name])),
    [catalog],
  );
  if (!draft) return null;

  const { program, refs, resolutions } = draft;
  const refsByKey = new Map(refs.map((ref) => [ref.key, ref]));
  const toCheck = refs.filter((ref) => isToCheck(resolutions[ref.key])).length;
  const toCreate = refs.filter((ref) => resolutions[ref.key]?.kind === 'create').length;

  const exerciseName = (ref: ImportRef) => {
    const resolution = resolutions[ref.key];
    if (resolution?.kind === 'library') return names.get(resolution.exerciseId) ?? ref.label;
    return resolution?.kind === 'create' ? ref.label : null;
  };

  return (
    <View className="gap-6">
      <Card>
        <Text className="text-lg font-semibold text-foreground">{program.name}</Text>
        {program.description ? <Text className="text-muted">{program.description}</Text> : null}
        <Text className="text-sm text-muted">
          {plural(program.workouts.length, 'séance')} · {plural(refs.length, 'exercice')}
        </Text>
      </Card>

      <Section title="Exercices">
        <Text className="text-muted">
          {toCheck > 0
            ? `${plural(toCheck, 'correspondance')} à vérifier. `
            : 'Tous les exercices ont été reconnus ou seront créés. '}
          Touche un exercice pour le changer.
          {toCreate === 1 ? ' 1 exercice perso sera créé.' : ''}
          {toCreate > 1 ? ` ${toCreate} exercices perso seront créés.` : ''}
        </Text>
        {refs.map((ref) => (
          <RefRow
            key={ref.key}
            label={ref.label}
            resolution={resolutions[ref.key]}
            resolvedName={exerciseName(ref)}
            onPress={() =>
              router.push({ pathname: '/programs/import-exercise', params: { key: ref.key } })
            }
          />
        ))}
      </Section>

      <Section title="Séances">
        {program.workouts.map((workout, index) => {
          const exercises = workout.exercises.flatMap((entry) => {
            const ref = refsByKey.get(refKey(entry));
            const name = ref ? exerciseName(ref) : null;
            return name ? [name] : [];
          });
          return (
            <Card key={index}>
              <Text className="text-base font-semibold text-foreground">{workout.name}</Text>
              <Text className="text-sm text-muted">
                {exercises.length > 0 ? exercises.join(' · ') : 'Aucun exercice'}
              </Text>
            </Card>
          );
        })}
      </Section>

      <View className="gap-3">
        <Button label="Importer le programme" onPress={onImport} />
        <Button label="Annuler" variant="secondary" onPress={onCancel} />
      </View>
    </View>
  );
}

const isToCheck = (resolution: Resolution | undefined) =>
  resolution?.kind === 'library' && !!resolution.toCheck;

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

type RefRowProps = {
  label: string;
  resolution: Resolution | undefined;
  resolvedName: string | null;
  onPress: () => void;
};

function RefRow({ label, resolution, resolvedName, onPress }: RefRowProps) {
  const status =
    resolution?.kind === 'skip'
      ? { text: 'Retiré du programme', className: 'text-muted' }
      : resolution?.kind === 'create'
        ? { text: 'Nouvel exercice perso', className: 'text-muted' }
        : isToCheck(resolution)
          ? { text: `À vérifier : ${resolvedName}`, className: 'font-semibold text-primary' }
          : { text: `✓ ${resolvedName}`, className: 'text-success' };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="gap-0.5 rounded-2xl border border-border bg-surface px-4 py-3 active:opacity-80">
      <Text
        className={`text-base text-foreground ${resolution?.kind === 'skip' ? 'line-through' : ''}`}>
        {label}
      </Text>
      <Text className={`text-sm ${status.className}`} numberOfLines={1}>
        {status.text}
      </Text>
    </Pressable>
  );
}
