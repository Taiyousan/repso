import { router, Stack, useNavigation, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { EditModeBanner } from '@/components/ui/edit-mode-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { KeyboardScrollView } from '@/components/ui/keyboard-scroll-view';
import { MonthCalendar } from '@/components/ui/month-calendar';
import { SortableList } from '@/components/ui/sortable-list';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { parseInteger } from '@/features/programs/sets';
import { formatLongDay, formatTime } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';

import { MAX_LOGGED_MINUTES, parseTimeOfDay, sessionTiming } from '../logic';
import {
  closeSessionEdit,
  discardSession,
  renameSession,
  reorderSessionExercises,
  setSessionTiming,
} from '../mutations';
import type { SessionDetail } from '../queries';
import { SessionExerciseCard } from './session-exercise-card';

/** Deleting after the screen has left avoids flashing a "not found" state while it animates out. */
function afterTransition(action: () => void) {
  setTimeout(action, 500);
}

// No rest to start after a set: the workout is over.
const noRest = () => {};

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

/**
 * Changes a finished workout, or fills in one logged afterwards. Every change is saved at once;
 * leaving drops the sets left unvalidated, as finishing a workout does.
 */
export function SessionEditor({ session }: { session: SessionDetail }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const endedAt = session.endedAt!;
  const savedMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60_000),
  );
  const [name, setName] = useState(session.name);
  const [startTime, setStartTime] = useState(formatTime(session.startedAt));
  const [duration, setDuration] = useState(String(savedMinutes));
  const [leaving, setLeaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const allSets = session.exercises.flatMap((item) => item.sets);
  const doneCount = allSets.filter((set) => set.completedAt != null).length;
  const pendingCount = allSets.length - doneCount;
  const year =
    session.startedAt.getFullYear() === new Date().getFullYear()
      ? ''
      : ` ${session.startedAt.getFullYear()}`;

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== session.name) renameSession(session.id, trimmed);
    else setName(session.name);
  };

  /** Saves the typed start time and duration on that day, or brings back the saved ones. */
  const saveTiming = (day = session.startedAt) => {
    const typedLength = parseInteger(duration);
    const length =
      typedLength != null && typedLength > 0 && typedLength <= MAX_LOGGED_MINUTES
        ? typedLength
        : savedMinutes;
    const timing = sessionTiming(
      day,
      parseTimeOfDay(startTime) ?? minutesOfDay(session.startedAt),
      length,
    );
    setStartTime(formatTime(timing.startedAt));
    setDuration(String(length));
    if (
      timing.startedAt.getTime() !== session.startedAt.getTime() ||
      timing.endedAt.getTime() !== endedAt.getTime()
    ) {
      setSessionTiming(session.id, timing.startedAt, timing.endedAt);
    }
  };

  const pickDay = (day: Date) => {
    saveTiming(day);
    setCalendarOpen(false);
  };

  usePreventRemove(!leaving, ({ repeat }) => {
    // "Terminé" can be tapped while a field is still being typed.
    saveName();
    saveTiming();
    if (doneCount > 0) {
      setLeaving(true);
      repeat();
      afterTransition(() => closeSessionEdit(session.id));
      return;
    }
    Alert.alert('Aucune série validée', 'Valide au moins une série, ou supprime l’entraînement.', [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          // Opened from the workout's recap, leaves it too: it would show a deleted workout.
          const below = navigation.getState()?.routes.at(-2)?.name;
          setLeaving(true);
          repeat();
          if (below === 'session/[id]') router.back();
          afterTransition(() => discardSession(session.id));
        },
      },
    ]);
  });

  const addExercises = () =>
    router.push({ pathname: '/session/add-exercises/[id]', params: { id: session.id } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderButton label="Terminé" onPress={() => router.back()} primary />,
        }}
      />
      <KeyboardScrollView
        scrollRef={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        <EditModeBanner />

        <Card>
          <TextField
            label="Nom"
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            maxLength={60}
          />
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-foreground">Date</Text>
            <Pressable
              onPress={() => setCalendarOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: calendarOpen }}
              accessibilityHint="Ouvre le calendrier"
              style={{ borderWidth: 1 }}
              className="flex-row items-center gap-2 rounded-xl border-edge bg-surface px-3 py-2.5 active:opacity-70">
              <Text className="flex-1 text-base text-foreground">
                {formatLongDay(session.startedAt)}
                {year}
              </Text>
              <Icon
                name={{ ios: 'calendar', android: 'calendar_month' }}
                size={18}
                color={colors.foreground}
              />
            </Pressable>
            {calendarOpen ? (
              <MonthCalendar value={session.startedAt} onChange={pickDay} max={new Date()} />
            ) : null}
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Début"
                value={startTime}
                onChangeText={setStartTime}
                onEndEditing={() => saveTiming()}
                keyboardType="numbers-and-punctuation"
                placeholder="18:30"
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Durée (min)"
                value={duration}
                onChangeText={setDuration}
                onEndEditing={() => saveTiming()}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </Card>

        <Section title="Exercices">
          {session.exercises.length === 0 ? (
            <EmptyState
              title="Aucun exercice"
              description="Ajoute les exercices que tu as faits, puis valide leurs séries."
            />
          ) : (
            <SortableList
              data={session.exercises}
              keyExtractor={(item) => String(item.id)}
              renderItem={(item) => (
                <SessionExerciseCard item={item} editing onSetCompleted={noRest} />
              )}
              gap={8}
              onReorder={(keys) => reorderSessionExercises(keys.map(Number))}
              scrollableRef={scrollRef}
            />
          )}
          {pendingCount > 0 ? (
            <Text className="text-sm text-muted">
              Les séries non validées seront retirées en quittant.
            </Text>
          ) : null}
        </Section>

        <Button label="+ Ajouter des exercices" variant="secondary" onPress={addExercises} />
      </KeyboardScrollView>
    </View>
  );
}
