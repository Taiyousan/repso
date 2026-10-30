import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ExportDialog } from '@/features/programs/components/export-dialog';
import type { ExportFile } from '@/features/programs/transfer/actions';
import { formatShortDay } from '@/lib/dates';

import { backupExportFile, hasSafetyCopy, restoreFromFile, undoRestore } from '../actions';
import { markBackupDone, useLastBackup } from '../data';

export function BackupCard() {
  const lastBackup = useLastBackup();
  const [file, setFile] = useState<ExportFile | null>(null);
  const [canUndo, setCanUndo] = useState(hasSafetyCopy);
  const onRestored = () => setCanUndo(true);

  return (
    <Card>
      <Text className="text-base font-semibold text-foreground">Sauvegarde</Text>
      <Text className="text-muted">
        Tes données ne sont que sur ce téléphone. Un fichier de sauvegarde permet de les retrouver
        après une panne ou un changement d’appareil.
      </Text>
      <Text className="text-sm text-muted">
        {lastBackup
          ? `Dernière sauvegarde : ${formatShortDay(lastBackup)}`
          : 'Aucune sauvegarde pour l’instant'}
      </Text>
      <Button label="Sauvegarder mes données" onPress={() => setFile(backupExportFile())} />
      <Button
        label="Restaurer une sauvegarde"
        variant="secondary"
        onPress={() => restoreFromFile(onRestored)}
      />
      {canUndo ? (
        <Button
          label="Annuler la dernière restauration"
          variant="secondary"
          onPress={() => undoRestore(onRestored)}
        />
      ) : null}
      <ExportDialog file={file} onClose={() => setFile(null)} onDone={markBackupDone} />
    </Card>
  );
}
