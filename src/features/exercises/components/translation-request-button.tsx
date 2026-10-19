import { Pressable, Text } from 'react-native';

import { setTranslationRequested, useTranslationRequested } from '../translation-requests';

export function TranslationRequestButton({ exerciseId }: { exerciseId: number }) {
  const requested = useTranslationRequested(exerciseId);

  return (
    <Pressable
      onPress={() => setTranslationRequested(exerciseId, !requested)}
      accessibilityRole="button"
      hitSlop={8}
      className="self-start py-1">
      <Text className="text-sm text-muted">
        {requested ? (
          <>
            ✓ Traduction demandée · <Text className="text-primary">Annuler</Text>
          </>
        ) : (
          <Text className="text-primary">Demander la traduction</Text>
        )}
      </Text>
    </Pressable>
  );
}
