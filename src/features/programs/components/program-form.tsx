import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { KeyboardScrollView } from '@/components/ui/keyboard-scroll-view';
import { TextField } from '@/components/ui/text-field';
import { useThemeColors } from '@/lib/theme';

import type { ProgramInput } from '../mutations';

type ProgramFormProps = {
  initialValue?: ProgramInput;
  submitLabel: string;
  onSubmit: (value: ProgramInput) => void;
};

/** Creation of a program; once created, it is edited in place (programs/edit). */
export function ProgramForm({ initialValue, submitLabel, onSubmit }: ProgramFormProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [name, setName] = useState(initialValue?.name ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const isValid = name.trim().length > 0;

  const submit = () => {
    if (!isValid) return;
    onSubmit({ name: name.trim(), description: description.trim() || null });
  };

  return (
    <KeyboardScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: insets.bottom + 16 }}>
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
      <Button label={submitLabel} onPress={submit} disabled={!isValid} />
    </KeyboardScrollView>
  );
}
