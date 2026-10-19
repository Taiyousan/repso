import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

export default function ProgramsScreen() {
  return (
    <Screen title="Programmes">
      <EmptyState
        title="Aucun programme"
        description="Crée ton premier programme ou importe-en un."
      />
    </Screen>
  );
}
