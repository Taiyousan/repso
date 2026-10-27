import { useState } from 'react';
import { Text, View } from 'react-native';

import { BarChart } from '@/components/ui/bar-chart';
import { Card, Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SECONDARY_MUSCLE_SHARE, weeklyTotals, weekStreak } from '@/domain/stats';
import { formatVolume } from '@/domain/volume';
import { type SessionSummary, useSessionHistory } from '@/features/sessions/queries';
import { MuscleBreakdown } from '@/features/stats/components/muscle-breakdown';
import { TrainingCalendar } from '@/features/stats/components/training-calendar';
import { useMuscleSets } from '@/features/stats/queries';
import { formatCompact, formatNumber } from '@/lib/chart';
import { formatShortDay, monthKey } from '@/lib/dates';

const WEEK_COUNT = 12;
/** Every fourth week is labelled, counting back from the current one. */
const WEEK_LABEL_EVERY = 4;

const WEEK_METRICS = [
  { value: 'volume', label: 'Volume' },
  { value: 'sessions', label: 'Séances' },
] as const;
type WeekMetric = (typeof WEEK_METRICS)[number]['value'];

const MUSCLE_PERIODS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '90 jours' },
] as const;
type MusclePeriod = (typeof MUSCLE_PERIODS)[number]['value'];

export default function StatsScreen() {
  const sessions = useSessionHistory();

  return (
    <Screen title="Stats">
      {sessions.length === 0 ? (
        <EmptyState
          title="Pas encore de stats"
          description="Termine une séance pour suivre ta régularité et ta progression."
        />
      ) : (
        <>
          <Overview sessions={sessions} />
          <Section title="Régularité">
            <Card>
              <TrainingCalendar sessions={sessions} />
            </Card>
          </Section>
          <WeeklyChart sessions={sessions} />
          <Muscles />
        </>
      )}
    </Screen>
  );
}

function Overview({ sessions }: { sessions: SessionSummary[] }) {
  const now = new Date();
  const streak = weekStreak(
    sessions.map((session) => session.startedAt),
    now,
  );
  const thisMonth = sessions.filter(
    (session) => monthKey(session.startedAt) === monthKey(now),
  ).length;

  return (
    <View className="flex-row gap-3">
      <Tile value={String(streak)} label={streak > 1 ? 'semaines de suite' : 'semaine de suite'} />
      <Tile value={String(thisMonth)} label="séances ce mois" />
      <Tile value={String(sessions.length)} label="séances en tout" />
    </View>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl border border-border bg-surface p-3">
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function WeeklyChart({ sessions }: { sessions: SessionSummary[] }) {
  const [metric, setMetric] = useState<WeekMetric>('volume');
  const [selected, setSelected] = useState(WEEK_COUNT - 1);
  const weeks = weeklyTotals(sessions, WEEK_COUNT);
  const week = weeks[selected];
  const value = (entry: (typeof weeks)[number]) =>
    metric === 'volume' ? entry.volume : entry.sessions;

  return (
    <Section title="Par semaine">
      <Card>
        <SegmentedControl options={WEEK_METRICS} value={metric} onChange={setMetric} />
        <View>
          <Text className="text-2xl font-bold text-foreground">
            {metric === 'volume'
              ? formatVolume(week.volume)
              : `${week.sessions} séance${week.sessions > 1 ? 's' : ''}`}
          </Text>
          <Text className="text-sm text-muted">
            {selected === WEEK_COUNT - 1
              ? 'Cette semaine'
              : `Semaine du ${formatShortDay(week.start)}`}
          </Text>
        </View>
        <BarChart
          bars={weeks.map((entry, index) => ({
            key: String(entry.start.getTime()),
            value: value(entry),
            label:
              (WEEK_COUNT - 1 - index) % WEEK_LABEL_EVERY === 0
                ? formatShortDay(entry.start)
                : undefined,
          }))}
          selected={selected}
          onSelect={setSelected}
          formatTick={formatCompact}
          minStep={metric === 'sessions' ? 1 : 0}
          accessibilityLabel={`${metric === 'volume' ? 'Volume' : 'Séances'} des ${WEEK_COUNT} dernières semaines`}
        />
      </Card>
    </Section>
  );
}

function Muscles() {
  const [period, setPeriod] = useState<MusclePeriod>('30');
  const muscles = useMuscleSets(Number(period));

  return (
    <Section title="Séries par muscle">
      <Card>
        <SegmentedControl options={MUSCLE_PERIODS} value={period} onChange={setPeriod} />
        {muscles.length > 0 ? (
          <MuscleBreakdown muscles={muscles} />
        ) : (
          <Text className="py-6 text-center text-muted">Aucune série sur cette période.</Text>
        )}
        <Text className="text-xs text-muted">
          Séries de travail, échauffements exclus. Un muscle secondaire compte pour{' '}
          {formatNumber(SECONDARY_MUSCLE_SHARE)} série.
        </Text>
      </Card>
    </Section>
  );
}
