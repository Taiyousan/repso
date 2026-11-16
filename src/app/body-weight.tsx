import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { KeyboardScrollView } from '@/components/ui/keyboard-scroll-view';
import { MonthCalendar } from '@/components/ui/month-calendar';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { addWeighIn, deleteWeighIn, useBodyWeights } from '@/features/body-weight/data';
import { formatDecimal, parseDecimal } from '@/features/programs/sets';
import { formatDay, formatLongDay } from '@/lib/dates';
import { useThemeColors } from '@/lib/theme';

/** Beyond, it's a typo. */
const MAX_BODY_WEIGHT = 400;

export default function BodyWeightScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const weighIns = useBodyWeights();
  const [weight, setWeight] = useState('');
  const [day, setDay] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const parsed = parseDecimal(weight);
  const isValid = parsed != null && parsed > 0 && parsed <= MAX_BODY_WEIGHT;
  const year = day.getFullYear() === new Date().getFullYear() ? '' : ` ${day.getFullYear()}`;

  const save = () => {
    if (!isValid) return;
    addWeighIn(parsed, day);
    setWeight('');
    setDay(new Date());
    setCalendarOpen(false);
  };

  return (
    <KeyboardScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled">
      <Text className="text-sm text-muted">
        Sert à calculer la charge effective des exercices au poids du corps lestés ou assistés.
        Chaque entraînement utilise la dernière pesée faite avant lui.
      </Text>

      <Card>
        <TextField
          label="Poids (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder={weighIns[0] ? formatDecimal(weighIns[0].weight) : '75'}
          onSubmitEditing={save}
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
              {formatLongDay(day)}
              {year}
            </Text>
            <Icon
              name={{ ios: 'calendar', android: 'calendar_month' }}
              size={18}
              color={colors.foreground}
            />
          </Pressable>
          {calendarOpen ? (
            <MonthCalendar
              value={day}
              onChange={(picked) => {
                setDay(picked);
                setCalendarOpen(false);
              }}
              max={new Date()}
            />
          ) : null}
        </View>
        <Button label="Enregistrer la pesée" onPress={save} disabled={!isValid} />
      </Card>

      {weighIns.length > 0 ? (
        <Section title="Historique">
          <View className="overflow-hidden rounded-2xl border border-outline bg-surface">
            {weighIns.map((weighIn, index) => (
              <View
                key={weighIn.id}
                className={`flex-row items-center gap-3 px-4 py-2 ${
                  index > 0 ? 'border-t border-border' : ''
                }`}>
                <Text className="flex-1 text-base text-foreground">
                  {formatDay(weighIn.measuredAt)}
                </Text>
                <Text
                  className="text-base font-extrabold text-foreground"
                  style={{ fontVariant: ['tabular-nums'] }}>
                  {formatDecimal(weighIn.weight)} kg
                </Text>
                <IconButton
                  icon={{ ios: 'trash', android: 'delete' }}
                  label={`Supprimer la pesée du ${formatDay(weighIn.measuredAt)}`}
                  onPress={() => deleteWeighIn(weighIn.id)}
                />
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </KeyboardScrollView>
  );
}
