import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

export default function WorkoutScreen() {
  return (
    <Screen title="Séance">
      <EmptyState
        title="Aucune séance en cours"
        description="Démarre une séance depuis un programme ou en séance libre."
      />
    </Screen>
  );
}
