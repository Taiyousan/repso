import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { usePrograms } from '@/features/programs/queries';
import { exportFormatGuide, importProgramFile } from '@/features/programs/transfer/actions';

export default function ProgramsScreen() {
  const programs = usePrograms();

  return (
    <Screen title="Programmes">
      {programs.length === 0 ? (
        <EmptyState
          title="Aucun programme"
          description="Crée ton premier programme, par exemple « PPL » avec ses séances Push, Pull et Legs, ou importe-le."
        />
      ) : (
        programs.map((program) => (
          <Link
            key={program.id}
            href={{ pathname: '/programs/[id]', params: { id: program.id } }}
            asChild>
            <Pressable className="gap-1 rounded-2xl border border-border bg-surface p-4 active:opacity-80">
              <Text className="text-lg font-semibold text-foreground">{program.name}</Text>
              {program.description ? (
                <Text className="text-muted" numberOfLines={2}>
                  {program.description}
                </Text>
              ) : null}
              <Text className="text-sm text-muted">
                {program.workoutCount} séance{program.workoutCount > 1 ? 's' : ''}
              </Text>
            </Pressable>
          </Link>
        ))
      )}
      <View className="pt-2">
        <Button label="Nouveau programme" onPress={() => router.push('/programs/new')} />
      </View>
      <Section title="Import / export">
        <Button label="Importer un programme" variant="secondary" onPress={importProgramFile} />
        <Button
          label="Exporter un programme"
          variant="secondary"
          onPress={() => router.push('/programs/export')}
          disabled={programs.length === 0}
        />
        <Button label="Exporter le format" variant="secondary" onPress={exportFormatGuide} />
        <Text className="text-sm text-muted">
          Le format décrit les fichiers de programme et liste les exercices de l’app : donne-le à
          une IA pour convertir ou créer un programme, puis importe le fichier qu’elle produit.
        </Text>
      </Section>
    </Screen>
  );
}
