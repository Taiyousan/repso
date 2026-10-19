import { router, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SortableList } from '@/components/ui/sortable-list';
import { TextField } from '@/components/ui/text-field';
import { useThemeColors } from '@/lib/theme';

import {
  deleteWorkoutTemplate,
  publishWorkoutTemplate,
  renameWorkoutTemplate,
  reorderTemplateExercises,
} from '../mutations';
import type { WorkoutTemplateDetail } from '../queries';
import { TemplateExerciseCard } from './template-exercise-card';

/** Deleting after the screen has left avoids flashing a "not found" state while it animates out. */
function afterTransition(action: () => void) {
  setTimeout(action, 500);
}

type WorkoutEditorProps = {
  workout: WorkoutTemplateDetail;
  /**
   * create: a draft, added to the program only when validated (leaving discards it).
   * edit: every change is saved immediately.
   */
  mode: 'create' | 'edit';
};

export function WorkoutEditor({ workout, mode }: WorkoutEditorProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const [name, setName] = useState(workout.name);
  const [leaving, setLeaving] = useState(false);
  const isCreating = mode === 'create';

  const allowLeaving = usePreventRemove(isCreating && !leaving, ({ repeat }) => {
    const discard = () => {
      setLeaving(true);
      repeat();
      afterTransition(() => deleteWorkoutTemplate(workout.id));
    };
    if (name.trim() === '' && workout.exercises.length === 0) {
      discard();
      return;
    }
    Alert.alert('Abandonner cette séance ?', 'Elle ne sera pas ajoutée au programme.', [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Abandonner', style: 'destructive', onPress: discard },
    ]);
  });

  const saveName = () => {
    if (isCreating) return; // saved on validation
    const trimmed = name.trim();
    if (trimmed && trimmed !== workout.name) renameWorkoutTemplate(workout.id, trimmed);
    else setName(workout.name);
  };

  const create = () => {
    publishWorkoutTemplate(workout.id, name.trim());
    allowLeaving();
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer cette séance ?',
      'Elle sera retirée du programme. Ton historique de séances est conservé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            router.back();
            afterTransition(() => deleteWorkoutTemplate(workout.id));
          },
        },
      ],
    );
  };

  const addExercises = () =>
    router.push({ pathname: '/workouts/add-exercises/[id]', params: { id: workout.id } });

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 16,
          padding: 16,
          paddingBottom: isCreating ? 16 : insets.bottom + 16,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <TextField
            label="Nom de la séance"
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            placeholder="Ex. Push, Haut du corps, Séance A"
            autoFocus={isCreating}
            returnKeyType="done"
          />
          <Text className="text-sm text-muted">Programme : {workout.programName}</Text>
        </View>

        {workout.exercises.length === 0 ? (
          <EmptyState
            title="Aucun exercice"
            description="Ajoute les exercices de cette séance depuis la bibliothèque."
          />
        ) : (
          <SortableList
            data={workout.exercises}
            keyExtractor={(item) => String(item.id)}
            renderItem={(item) => <TemplateExerciseCard item={item} />}
            onReorder={(keys) => reorderTemplateExercises(keys.map(Number))}
            scrollableRef={scrollRef}
          />
        )}

        <Button label="Ajouter des exercices" onPress={addExercises} variant="secondary" />
        {!isCreating ? (
          <Button label="Supprimer la séance" onPress={confirmDelete} variant="danger" />
        ) : null}
      </Animated.ScrollView>

      {isCreating ? (
        <View
          className="gap-2 border-t border-border bg-surface px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          <Button label="Créer la séance" onPress={create} disabled={name.trim() === ''} />
          {name.trim() === '' ? (
            <Text className="text-center text-sm text-muted">Donne un nom à la séance</Text>
          ) : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
