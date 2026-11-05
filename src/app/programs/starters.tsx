import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  addStarterProgram,
  readStarterExerciseNames,
  STARTER_PROGRAMS,
} from '@/features/programs/starters';

export default function StarterProgramsScreen() {
  const insets = useSafeAreaInsets();
  const names = useMemo(() => readStarterExerciseNames(), []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: insets.bottom + 16 }}>
      <Text className="text-sm text-muted">
        Ajoute un programme pour démarrer tout de suite. Tu pourras ensuite le modifier comme tu
        veux.
      </Text>
      {STARTER_PROGRAMS.map((program) => (
        <Card key={program.name}>
          <View className="gap-1">
            <Text className="font-display text-lg font-bold text-foreground">{program.name}</Text>
            <Text className="text-sm text-muted">{program.description}</Text>
          </View>
          {program.workouts.map((workout) => (
            <View key={workout.name} className="gap-0.5">
              <Text className="text-[13px] font-extrabold text-foreground">{workout.name}</Text>
              <Text className="text-sm text-muted">
                {workout.exercises.flatMap((entry) => names.get(entry.slug ?? '') ?? []).join(', ')}
              </Text>
            </View>
          ))}
          <Button
            label="Ajouter ce programme"
            variant="secondary"
            onPress={() => {
              const id = addStarterProgram(program);
              router.replace({ pathname: '/programs/[id]', params: { id } });
            }}
          />
        </Card>
      ))}
    </ScrollView>
  );
}
