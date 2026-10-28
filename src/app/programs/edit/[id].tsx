import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/card';
import { EditModeBanner } from '@/components/ui/edit-mode-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderButton } from '@/components/ui/header-button';
import { ListRow } from '@/components/ui/list-row';
import { DragHandle, SortableList } from '@/components/ui/sortable-list';
import { TextField } from '@/components/ui/text-field';
import {
  createDraftWorkoutTemplate,
  deleteProgram,
  reorderWorkoutTemplates,
  updateProgram,
} from '@/features/programs/mutations';
import { type ProgramDetail, useProgram } from '@/features/programs/queries';
import { useThemeColors } from '@/lib/theme';

export default function EditProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = useProgram(Number(id));

  if (!program) {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState title="Programme introuvable" />
      </View>
    );
  }

  return <ProgramEditor key={program.id} program={program} />;
}

/** Edit mode of a program: every change is saved as it is made. */
function ProgramEditor({ program }: { program: ProgramDetail }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? '');

  const save = () => {
    const trimmed = name.trim();
    // A program keeps a name: emptying it goes back to the saved one.
    if (!trimmed) setName(program.name);
    updateProgram(program.id, {
      name: trimmed || program.name,
      description: description.trim() || null,
    });
  };

  const done = () => {
    // "Terminé" can be tapped while a field is still being typed.
    save();
    router.back();
  };

  const addWorkout = () => {
    const workoutId = createDraftWorkoutTemplate(program.id);
    router.push({ pathname: '/workouts/new/[id]', params: { id: workoutId } });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer ce programme ?',
      'Ses séances seront supprimées. Ton historique d’entraînements est conservé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteProgram(program.id);
            router.dismissTo('/programs');
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{ headerRight: () => <HeaderButton label="Terminé" onPress={done} primary /> }}
      />
      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        <EditModeBanner />
        <TextField
          label="Nom"
          value={name}
          onChangeText={setName}
          onEndEditing={save}
          placeholder="Ex. PPL, Full body, Force 5×5"
          returnKeyType="done"
        />
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          onEndEditing={save}
          placeholder="Optionnel : objectif, fréquence, notes…"
          multiline
        />

        <Section title="Séances">
          {program.workouts.length === 0 ? (
            <EmptyState
              title="Aucune séance"
              description="Ajoute les séances de ce programme, par exemple Push, Pull et Legs."
            />
          ) : (
            <SortableList
              data={program.workouts}
              keyExtractor={(workout) => String(workout.id)}
              onReorder={(keys) => reorderWorkoutTemplates(keys.map(Number))}
              scrollableRef={scrollRef}
              renderItem={(workout) => (
                <View className="flex-row items-center gap-1">
                  <DragHandle label={`Déplacer ${workout.name}`} />
                  <View className="flex-1">
                    <ListRow
                      title={workout.name}
                      details={[
                        `${workout.exerciseCount} exercice${workout.exerciseCount > 1 ? 's' : ''}`,
                      ]}
                      onPress={() =>
                        router.push({ pathname: '/workouts/edit/[id]', params: { id: workout.id } })
                      }
                      accessibilityLabel={`Modifier ${workout.name}`}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </Section>
        <Button label="+ Ajouter une séance" onPress={addWorkout} variant="secondary" />

        <View className="pt-6">
          <Button label="Supprimer le programme" onPress={confirmDelete} variant="danger" />
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}
