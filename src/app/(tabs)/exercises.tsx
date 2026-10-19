import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

export default function ExercisesScreen() {
  return (
    <Screen title="Exercices">
      <EmptyState
        title="Bibliothèque vide"
        description="La bibliothèque d'exercices arrive bientôt."
      />
    </Screen>
  );
}
