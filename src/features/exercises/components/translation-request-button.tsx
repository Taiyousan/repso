import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';

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
            ✓ Traduction demandée ·{' '}
            <Text className="font-bold text-foreground underline">Annuler</Text>
          </>
        ) : (
          <Text className="font-bold text-foreground underline">Demander la traduction</Text>
        )}
      </Text>
    </Pressable>
  );
}
