import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

import type { ProgramInput } from '../mutations';

type ProgramFormProps = {
  initialValue?: ProgramInput;
  submitLabel: string;
  onSubmit: (value: ProgramInput) => void;
  onDelete?: () => void;
};

export function ProgramForm({ initialValue, submitLabel, onSubmit, onDelete }: ProgramFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialValue?.name ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const isValid = name.trim().length > 0;

  const submit = () => {
    if (!isValid) return;
    onSubmit({ name: name.trim(), description: description.trim() || null });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled">
      <TextField
        label="Nom"
        value={name}
        onChangeText={setName}
        placeholder="Ex. PPL, Full body, Force 5×5"
        autoFocus={!initialValue}
        returnKeyType="next"
      />
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Optionnel : objectif, fréquence, notes…"
        multiline
      />
      <View className="gap-3">
        <Button label={submitLabel} onPress={submit} disabled={!isValid} />
        {onDelete ? (
          <Button label="Supprimer le programme" onPress={onDelete} variant="danger" />
        ) : null}
      </View>
    </ScrollView>
  );
}
