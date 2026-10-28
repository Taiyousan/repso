import { Link, router, Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { formatRecord, RECORD_LABELS, sessionNewRecords } from '@/domain/records';
import { formatVolume, isWorkingSet } from '@/domain/volume';
import { MuscleMap } from '@/features/exercises/components/muscle-map';
import { formatDay, formatDurationLong, formatTime } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';

import { bestSet, compareSets, formatPerformance } from '../logic';
import { discardSession, setSessionEffort, setSessionNotes } from '../mutations';
import {
  readPreviousTemplateSession,
  type SessionDetail,
  type SessionExerciseDetail,
} from '../queries';
import { formatDelta, sessionTotals, workedMuscles } from '../recap';
import { EffortPicker } from './effort-picker';
import { SessionTags } from './tag-picker';
import { TemplateUpdateCard } from './template-update-card';

type SessionRecapProps = {
  session: SessionDetail;
  /** Opened live and just finished: welcomes the user and offers to update the template. */
  justFinished: boolean;
};

/** Summary of a finished session, also its page in the history. */
export function SessionRecap({ session, justFinished }: SessionRecapProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const endedAt = session.endedAt!;
  const totals = sessionTotals(session.startedAt, endedAt, session.exercises);
  const previous = useMemo(
    () =>
      session.templateId == null
        ? undefined
        : readPreviousTemplateSession(session.templateId, session.startedAt),
    [session.templateId, session.startedAt],
  );
  const previousDurationMs = previous
    ? previous.endedAt!.getTime() - previous.startedAt.getTime()
    : 0;
  const muscles = workedMuscles(session.exercises.map((item) => item.exercise));
  const newRecords = sessionNewRecords(session.exercises);

  const confirmDelete = () => {
    Alert.alert('Supprimer cette séance ?', 'Elle disparaîtra de ton historique.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          router.back();
          // After the screen left, so it doesn't flash an empty state while animating out.
          setTimeout(() => discardSession(session.id), 500);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: justFinished
            ? () => (
                <Pressable onPress={() => router.back()} hitSlop={8}>
                  <Text className="text-base font-bold text-foreground underline">OK</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <ScrollView
        contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          {justFinished ? (
            <Text className="text-2xl font-bold text-foreground">Séance terminée, bien joué !</Text>
          ) : null}
          <Text className="text-base text-muted">
            {formatDay(session.startedAt)} · {formatTime(session.startedAt)} – {formatTime(endedAt)}
          </Text>
        </View>

        <View className="gap-2">
          <View className="flex-row gap-2">
            <StatTile
              label="Durée"
              value={formatDurationLong(totals.durationMs)}
              delta={
                previous
                  ? formatDelta(
                      Math.round((totals.durationMs - previousDurationMs) / 60_000),
                      (minutes) => `${minutes} min`,
                    )
                  : undefined
              }
            />
            <StatTile
              label="Volume"
              value={formatVolume(totals.volume)}
              delta={
                previous
                  ? formatDelta(Math.round(totals.volume - previous.volume), formatVolume)
                  : undefined
              }
              better={previous ? totals.volume > previous.volume : false}
            />
            <StatTile
              label="Séries"
              value={String(totals.setCount)}
              delta={previous ? formatDelta(totals.setCount - previous.setCount) : undefined}
              better={previous ? totals.setCount > previous.setCount : false}
            />
          </View>
          {previous ? (
            <Text className="text-xs text-muted">
              Comparé à la dernière fois ({formatDay(previous.startedAt)}).
            </Text>
          ) : null}
        </View>

        {newRecords.length > 0 ? (
          <Section title={newRecords.length > 1 ? 'Records battus' : 'Record battu'}>
            <Card tone="success">
              {newRecords.map((record) => (
                <View
                  key={`${record.exerciseId}-${record.kind}`}
                  className="flex-row items-center gap-3">
                  <Icon
                    name={{ ios: 'trophy.fill', android: 'trophy' }}
                    size={20}
                    color={colors.success}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                      {record.exerciseName}
                    </Text>
                    <Text className="text-sm text-muted">{RECORD_LABELS[record.kind]}</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground">
                    {formatRecord(record.kind, record.value)}
                  </Text>
                </View>
              ))}
            </Card>
          </Section>
        ) : null}

        {justFinished ? <TemplateUpdateCard session={session} /> : null}

        <Section title="Exercices">
          <Card>
            {session.exercises.map((item, index) => (
              <View key={item.id} className={index > 0 ? 'border-t border-border pt-3' : ''}>
                <ExerciseSummary item={item} />
              </View>
            ))}
          </Card>
        </Section>

        {muscles.primaryMuscles.length > 0 ? (
          <Section title="Muscles travaillés">
            <MuscleMap {...muscles} />
          </Section>
        ) : null}

        <Section title="Effort ressenti">
          <EffortPicker
            value={session.perceivedEffort}
            onChange={(value) => setSessionEffort(session.id, value)}
          />
        </Section>

        <Section title="Tags">
          <SessionTags sessionId={session.id} selected={session.tags} />
        </Section>

        <Section title="Notes">
          <NotesField sessionId={session.id} initialValue={session.notes ?? ''} />
        </Section>

        <View className="gap-2">
          {/* Same as the header button, reached once the recap has been read. */}
          {justFinished ? <Button label="OK" onPress={() => router.back()} /> : null}
          <Button label="Supprimer la séance" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatTile({
  label,
  value,
  delta,
  better = false,
}: {
  label: string;
  value: string;
  delta?: string;
  /** Shows the delta as progress. */
  better?: boolean;
}) {
  return (
    <View
      style={{ borderWidth: 2 }}
      className="flex-1 gap-0.5 rounded-2xl border-ink bg-surface p-3">
      <Text className="text-xs text-muted">{label}</Text>
      <Text
        className="text-lg font-bold text-foreground"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      {delta ? (
        <Text
          className={`text-xs font-medium ${better ? 'text-success' : 'text-muted'}`}
          numberOfLines={1}>
          {delta}
        </Text>
      ) : null}
    </View>
  );
}

function ExerciseSummary({ item }: { item: SessionExerciseDetail }) {
  const { exercise } = item;
  const working = item.sets.filter(isWorkingSet);
  const warmups = item.sets.length - working.length;
  const best = bestSet(working, exercise.trackingType);
  const previousBest = bestSet(item.previous.filter(isWorkingSet), exercise.trackingType);
  const progressed =
    best != null &&
    previousBest != null &&
    compareSets(best, previousBest, exercise.trackingType) > 0;

  return (
    <View className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <Link href={{ pathname: '/exercises/[id]', params: { id: exercise.id } }} asChild>
          <Pressable className="shrink">
            <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
              {exercise.name}
            </Text>
          </Pressable>
        </Link>
        {best ? (
          <Text className="text-base font-semibold text-foreground">
            {formatPerformance(best, exercise.trackingType)}
          </Text>
        ) : null}
      </View>
      <Text className="text-sm text-muted">
        {working.map((set) => formatPerformance(set, exercise.trackingType)).join(' · ')}
        {warmups > 0 ? `${working.length > 0 ? ' · ' : ''}+${warmups} échauff.` : ''}
      </Text>
      {previousBest ? (
        <Text className={`text-sm ${progressed ? 'text-success' : 'text-muted'}`}>
          {progressed ? 'En progrès · avant ' : 'La dernière fois : '}
          {formatPerformance(previousBest, exercise.trackingType)}
        </Text>
      ) : (
        <Text className="text-sm text-muted">Première fois</Text>
      )}
    </View>
  );
}

/** Saved shortly after typing stops, and when leaving the screen. */
function NotesField({ sessionId, initialValue }: { sessionId: number; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const unsaved = useRef<string | null>(null);

  useEffect(() => {
    if (unsaved.current == null) return;
    const timeout = setTimeout(() => {
      setSessionNotes(sessionId, value);
      unsaved.current = null;
    }, 600);
    return () => clearTimeout(timeout);
  }, [sessionId, value]);

  useEffect(
    () => () => {
      if (unsaved.current != null) setSessionNotes(sessionId, unsaved.current);
    },
    [sessionId],
  );

  return (
    <TextField
      value={value}
      onChangeText={(text) => {
        unsaved.current = text;
        setValue(text);
      }}
      multiline
      placeholder="Sensations, réglages de machine, douleurs…"
    />
  );
}
