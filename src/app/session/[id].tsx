import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderMenu } from '@/components/ui/header-menu';
import { IconButton } from '@/components/ui/icon-button';
import { SortableList } from '@/components/ui/sortable-list';
import { Text } from '@/components/ui/text';
import { DEFAULT_REST_SECONDS } from '@/features/programs/sets';
import { SessionExerciseCard } from '@/features/sessions/components/session-exercise-card';
import { SessionRecap } from '@/features/sessions/components/session-recap';
import { TimerBar } from '@/features/sessions/components/timer-bar';
import { formatElapsed, isExerciseComplete } from '@/features/sessions/logic';
import {
  discardSession,
  finishSession,
  reorderSessionExercises,
} from '@/features/sessions/mutations';
import {
  readNextPendingExercise,
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
        <EmptyState title="Entraînement introuvable" />
      </View>
    );
  }

  if (session.endedAt) return <SessionRecap session={session} justFinished={openedLive} />;

  return <LiveSession session={session} />;
}

/** On its own so the ticking clock doesn't re-render the exercise cards every second. */
function SessionClock({ startedAt }: { startedAt: Date }) {
  // Paused under a pushed screen (exercise sheet, timer).
  const now = useNow(1000, useIsFocused());
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

  return (
    <Text
      className="font-display text-xl font-bold text-foreground"
      style={{ fontVariant: ['tabular-nums'] }}>
      {formatElapsed(elapsedSeconds)}
    </Text>
  );
}

function LiveSession({ session }: { session: SessionDetail }) {
  useKeepAwake();
  const colors = useThemeColors();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const allSets = session.exercises.flatMap((item) => item.sets);
  const doneCount = allSets.filter((set) => set.completedAt != null).length;
  const pendingCount = allSets.length - doneCount;
  const exerciseCount = session.exercises.length;
  const completedExercises = session.exercises.filter((item) =>
    isExerciseComplete(item.sets),
  ).length;

  // Read from the database (the set is already saved), so this handler stays the same from one
  // render to the next and the memoized cards that didn't change aren't rendered again.
  const sessionId = session.id;
  const startRest = (item: SessionExerciseDetail) => {
    const next = readNextPendingExercise(sessionId, item.position);
    if (!next) return; // nothing left to do: no rest needed
    useTimer.getState().startRest(item.restSeconds ?? DEFAULT_REST_SECONDS, next.name);
  };

  const addExercises = () =>
    router.push({ pathname: '/session/add-exercises/[id]', params: { id: session.id } });

  const leave = (action: () => void) => {
    useTimer.getState().stop();
    router.back();
    // After the screen left, so it doesn't flash an empty state while animating out.
    setTimeout(action, 500);
  };

  const confirmDiscard = () => {
    Alert.alert('Abandonner l’entraînement ?', 'Rien ne sera enregistré.', [
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
      Alert.alert(
        'Aucune série validée',
        'Valide au moins une série, ou abandonne l’entraînement.',
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Abandonner',
            style: 'destructive',
            onPress: () => leave(() => discardSession(session.id)),
          },
        ],
      );
      return;
    }
    Alert.alert(
      'Terminer l’entraînement ?',
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

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: session.name,
          // Leaving keeps the workout running: the tabs show it until it is finished.
          headerLeft: () => (
            <View className="mr-3">
              <IconButton
                icon={{ ios: 'chevron.down', android: 'keyboard_arrow_down' }}
                label="Réduire, l’entraînement continue"
                onPress={() => router.back()}
              />
            </View>
          ),
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <IconButton
                icon={{ ios: 'timer', android: 'timer' }}
                label="Minuteur"
                onPress={() => router.push('/timer')}
              />
              <HeaderMenu
                items={[
                  { label: 'Ajouter des exercices', onPress: addExercises },
                  {
                    label: 'Abandonner l’entraînement',
                    onPress: confirmDiscard,
                    destructive: true,
                  },
                ]}
              />
            </View>
          ),
        }}
      />

      <View className="flex-row items-center gap-2 px-4 pb-1.5">
        <SessionClock startedAt={session.startedAt} />
        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
          <View
            className="h-full bg-success"
            style={{ width: `${allSets.length === 0 ? 0 : (doneCount / allSets.length) * 100}%` }}
          />
        </View>
        <Text className="text-sm font-bold text-muted">
          {completedExercises}/{exerciseCount} exos · {doneCount}/{allSets.length} séries
        </Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
        keyboardShouldPersistTaps="handled">
        {session.exercises.length === 0 ? (
          <EmptyState
            title="Entraînement vide"
            description="Ajoute des exercices pour commencer à enregistrer tes séries."
          />
        ) : (
          <SortableList
            data={session.exercises}
            keyExtractor={(item) => String(item.id)}
            renderItem={(item) => <SessionExerciseCard item={item} onSetCompleted={startRest} />}
            gap={8}
            onReorder={(keys) => reorderSessionExercises(keys.map(Number))}
            scrollableRef={scrollRef}
          />
        )}

        <Button label="+ Ajouter des exercices" variant="secondary" onPress={addExercises} />
      </Animated.ScrollView>

      <ActionBar>
        <TimerBar />
        <Button label="Terminer l’entraînement" onPress={confirmFinish} />
      </ActionBar>
    </KeyboardAvoidingView>
  );
}
