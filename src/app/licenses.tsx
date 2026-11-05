import { Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/ui/card';
import { ListGroup } from '@/components/ui/list-group';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import {
  type Credit,
  DATA_CREDITS,
  FONT_CREDITS,
  LIBRARY_CREDITS,
} from '@/features/about/licenses';

function CreditList({ title, credits }: { title: string; credits: Credit[] }) {
  return (
    <Section title={title}>
      <ListGroup>
        {credits.map((credit) => (
          <ListRow
            key={credit.name}
            title={credit.name}
            details={[credit.author, credit.license]}
            onPress={() => Linking.openURL(credit.url)}
            accessibilityLabel={`${credit.name}, ${credit.license}. Ouvrir la page du projet`}
            flat
          />
        ))}
      </ListGroup>
    </Section>
  );
}

export default function LicensesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text className="text-sm text-muted">
        Repso repose sur ces données, polices et logiciels libres. Touche une ligne pour ouvrir la
        page du projet et le texte complet de sa licence.
      </Text>
      <CreditList title="Données" credits={DATA_CREDITS} />
      <CreditList title="Polices et icônes" credits={FONT_CREDITS} />
      <CreditList title="Bibliothèques" credits={LIBRARY_CREDITS} />
    </ScrollView>
  );
}
