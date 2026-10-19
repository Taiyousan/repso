import { View } from 'react-native';

import { Chip } from '@/components/ui/chip';

import { DEFAULT_REST_SECONDS, formatDuration, REST_PRESETS } from '../sets';

type RestPresetsProps = {
  restSeconds: number | null;
  onChange: (restSeconds: number | null) => void;
};

/** Rest time choices; `null` is the default rest time. */
export function RestPresets({ restSeconds, onChange }: RestPresetsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Chip
        label={`Par défaut (${formatDuration(DEFAULT_REST_SECONDS)})`}
        selected={restSeconds == null}
        onPress={() => onChange(null)}
      />
      {REST_PRESETS.map((seconds) => (
        <Chip
          key={seconds}
          label={formatDuration(seconds)}
          selected={restSeconds === seconds}
          onPress={() => onChange(seconds)}
        />
      ))}
    </View>
  );
}
