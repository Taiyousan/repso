import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';

import { DEFAULT_REST_SECONDS, formatDuration, REST_PRESETS } from '../sets';

type RestSelectorProps = {
  restSeconds: number | null;
  onChange: (restSeconds: number | null) => void;
};

/** "Repos : 1:30" summary that expands into presets. */
export function RestSelector({ restSeconds, onChange }: RestSelectorProps) {
  const [open, setOpen] = useState(false);

  const select = (value: number | null) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        hitSlop={6}
        className="self-start">
        <Text className="text-sm text-muted">
          Repos :{' '}
          <Text className="font-semibold text-foreground">
            {formatDuration(restSeconds ?? DEFAULT_REST_SECONDS)}
          </Text>
          {restSeconds == null ? ' (par défaut)' : ''}
          <Text className="text-primary"> · {open ? 'Fermer' : 'Modifier'}</Text>
        </Text>
      </Pressable>
      {open ? (
        <View className="flex-row flex-wrap gap-2">
          <Chip
            label={`Par défaut (${formatDuration(DEFAULT_REST_SECONDS)})`}
            selected={restSeconds == null}
            onPress={() => select(null)}
          />
          {REST_PRESETS.map((seconds) => (
            <Chip
              key={seconds}
              label={formatDuration(seconds)}
              selected={restSeconds === seconds}
              onPress={() => select(seconds)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
