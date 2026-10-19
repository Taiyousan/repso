import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

export default function HistoryScreen() {
  return (
    <Screen title="Historique">
      <EmptyState title="Aucune séance" description="Tes séances terminées apparaîtront ici." />
    </Screen>
  );
}
