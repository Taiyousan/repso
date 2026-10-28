import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DEFAULT_REST_SECONDS, formatDuration } from '@/features/programs/sets';
import { useThemeColors } from '@/lib/theme';

import { updateTemplateFromSession } from '../mutations';
import { readTemplateForUpdate, type SessionDetail } from '../queries';
import { planTemplateUpdate, type TemplateChange, templateChanges } from '../recap';

const restLabel = (seconds: number | null) =>
  seconds == null ? `${formatDuration(DEFAULT_REST_SECONDS)} (défaut)` : formatDuration(seconds);

function describe(change: TemplateChange, nameOf: (exerciseId: number) => string) {
  switch (change.kind) {
    case 'added':
      return { title: `Ajouter ${nameOf(change.exerciseId)}` };
    case 'removed':
      return { title: `Retirer ${nameOf(change.exerciseId)}`, detail: 'Pas fait cette fois-ci' };
    case 'rest':
      return {
        title: `Repos de ${nameOf(change.exerciseId)}`,
        detail: `${restLabel(change.from)} → ${restLabel(change.to)}`,
      };
    case 'order':
      return { title: 'Garder le nouvel ordre des exercices' };
  }
}

/**
 * Offered right after finishing a session that strayed from its workout template. The diff is
 * frozen when the card appears: the template is only rewritten if the user accepts.
 */
export function TemplateUpdateCard({ session }: { session: SessionDetail }) {
  const colors = useThemeColors();
  const [proposal] = useState(() => {
    const template =
      session.templateId == null ? undefined : readTemplateForUpdate(session.templateId);
    if (!template) return null;
    const changes = templateChanges(template.items, session.exercises);
    return changes.length > 0 ? { template, changes } : null;
  });
  const [accepted, setAccepted] = useState(
    () => new Set(proposal?.changes.map((change) => change.key)),
  );
  const [status, setStatus] = useState<'open' | 'updated' | 'dismissed'>('open');

  if (!proposal || status === 'dismissed') return null;
  const { template, changes } = proposal;

  if (status === 'updated') {
    return (
      <Card tone="success">
        <View className="flex-row items-center gap-2">
          <Icon
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }}
            color={colors.success}
          />
          <Text className="flex-1 text-base text-foreground">
            « {template.name} » est à jour pour la prochaine fois.
          </Text>
        </View>
      </Card>
    );
  }

  const names = new Map([
    ...template.items.map((item) => [item.exerciseId, item.name] as const),
    ...session.exercises.map((item) => [item.exerciseId, item.exercise.name] as const),
  ]);
  const nameOf = (exerciseId: number) => names.get(exerciseId) ?? 'Exercice';

  const toggle = (key: string) =>
    setAccepted((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const apply = () => {
    updateTemplateFromSession(
      template.id,
      planTemplateUpdate(template.items, session.exercises, accepted),
    );
    setStatus('updated');
  };

  return (
    <Card>
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground">
          Mettre à jour « {template.name} » ?
        </Text>
        <Text className="text-sm text-muted">
          Ton entraînement s&apos;est écarté de la séance prévue.
        </Text>
      </View>

      <View className="gap-1">
        {changes.map((change) => {
          const checked = accepted.has(change.key);
          const { title, detail } = describe(change, nameOf);
          return (
            <Pressable
              key={change.key}
              onPress={() => toggle(change.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              className="flex-row items-center gap-3 rounded-lg py-2 active:opacity-70">
              <Icon
                name={
                  checked
                    ? { ios: 'checkmark.square.fill', android: 'check_box' }
                    : { ios: 'square', android: 'check_box_outline_blank' }
                }
                color={checked ? colors.foreground : colors.muted}
              />
              <View className="flex-1">
                <Text className="text-base text-foreground">{title}</Text>
                {detail ? <Text className="text-sm text-muted">{detail}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2">
        <Button
          label="Mettre à jour la séance"
          variant="secondary"
          onPress={apply}
          disabled={accepted.size === 0}
        />
        <Button
          label="Ne rien changer"
          variant="secondary"
          onPress={() => setStatus('dismissed')}
        />
      </View>
    </Card>
  );
}
