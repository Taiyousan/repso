import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SortableList } from '@/components/ui/sortable-list';
import { DEFAULT_REST_SECONDS } from '@/features/programs/sets';
import { TimerBar } from '@/features/sessions/components/timer-bar';
import { SessionExerciseCard } from '@/features/sessions/components/session-exercise-card';
import { SessionRecap } from '@/features/sessions/components/session-recap';
import { formatElapsed, isExerciseComplete } from '@/features/sessions/logic';
import {
  discardSession,
  finishSession,
  reorderSessionExercises,
} from '@/features/sessions/mutations';
import {
  type SessionDetail,
  type SessionExerciseDetail,
  useSession,
} from '@/features/sessions/queries';
import { useTimer } from '@/features/sessions/timer';
import { useThemeColors } from '@/lib/theme';
import { useNow } from '@/lib/use-now';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession(Number(id));
  // A session finished on this screen turns into its recap.
  const [openedLive] = useState(() => session != null && session.endedAt == null);

  if (!session) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title="Séance introuvable" />
      </View>
    );
  }

  if (session.endedAt) return <SessionRecap session={session} justFinished={openedLive} />;

  return <LiveSession session={session} />;
}

function LiveSession({ session }: { session: SessionDetail }) {
  useKeepAwake();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const now = useNow(1000);

  const allSets = session.exercises.flatMap((item) => item.sets);
  const doneCount = allSets.filter((set) => set.completedAt != null).length;
  const pendingCount = allSets.length - doneCount;
  const exerciseCount = session.exercises.length;
  const completedExercises = session.exercises.filter((item) =>
    isExerciseComplete(item.sets),
  ).length;

  const startRest = (item: SessionExerciseDetail) => {
    // The set just validated is still pending in this render.
    const pendingHere = item.sets.filter((set) => set.completedAt == null).length - 1;
    const next =
      pendingHere > 0
        ? item
        : session.exercises.find(
            (other) =>
              other.position > item.position && other.sets.some((set) => set.completedAt == null),
          );
    if (!next) return; // nothing left to do: no rest needed
    useTimer.getState().startRest(item.restSeconds ?? DEFAULT_REST_SECONDS, next.exercise.name);
  };

  const leave = (action: () => void) => {
    useTimer.getState().stop();
    router.back();
    // After the screen left, so it doesn't flash an empty state while animating out.
    setTimeout(action, 500);
  };

  const confirmDiscard = () => {
    Alert.alert('Abandonner la séance ?', 'Rien ne sera enregistré.', [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Abandonner',
        style: 'destructive',
        onPress: () => leave(() => discardSession(session.id)),
      },
    ]);
  };

  const confirmFinish = () => {
    if (doneCount === 0) {
      Alert.alert('Aucune série validée', 'Valide au moins une série, ou abandonne la séance.', [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: () => leave(() => discardSession(session.id)),
        },
      ]);
      return;
    }
    Alert.alert(
      'Terminer la séance ?',
      pendingCount > 0
        ? `${pendingCount} série${pendingCount > 1 ? 's' : ''} non validée${pendingCount > 1 ? 's' : ''} ${pendingCount > 1 ? 'seront retirées' : 'sera retirée'}.`
        : 'Toutes les séries sont validées. Bien joué !',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: () => {
            useTimer.getState().stop();
            finishSession(session.id); // the screen shows the recap from now on
          },
        },
      ],
    );
  };

  const elapsedSeconds = Math.max(0, Math.floor((now - session.startedAt.getTime()) / 1000));

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => router.push('/timer')}
                accessibilityRole="button"
                accessibilityLabel="Minuteur"
                hitSlop={8}>
                <Icon name={{ ios: 'timer', android: 'timer' }} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={confirmFinish} hitSlop={8}>
                <Text className="text-base font-semibold text-primary">Terminer</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <View className="flex-row items-center justify-between border-b border-border px-4 pb-3">
        <Text
          className="text-2xl font-bold text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}>
          {formatElapsed(elapsedSeconds)}
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="items-end">
            <Text className="text-sm font-medium text-foreground">Exercices</Text>
            <Text className="text-xs text-muted">
              {doneCount} / {allSets.length} série{allSets.length > 1 ? 's' : ''}
            </Text>
          </View>
          <ProgressRing
            progress={exerciseCount === 0 ? 0 : completedExercises / exerciseCount}
            size={52}>
            <Text className="text-sm font-bold text-foreground">
              {completedExercises}/{exerciseCount}
            </Text>
          </ProgressRing>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        {session.exercises.length === 0 ? (
          <EmptyState
            title="Séance vide"
            description="Ajoute des exercices pour commencer à enregistrer tes séries."
          />
        ) : (
          <SortableList
            data={session.exercises}
            keyExtractor={(item) => String(item.id)}
            renderItem={(item) => <SessionExerciseCard item={item} onSetCompleted={startRest} />}
            onReorder={(keys) => reorderSessionExercises(keys.map(Number))}
            scrollableRef={scrollRef}
          />
        )}

        <Button
          label="Ajouter des exercices"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/session/add-exercises/[id]', params: { id: session.id } })
          }
        />
        <Button label="Abandonner la séance" variant="danger" onPress={confirmDiscard} />
      </Animated.ScrollView>

      <TimerBar />
    </KeyboardAvoidingView>
  );
}
