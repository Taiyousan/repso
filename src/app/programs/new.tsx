import { router } from 'expo-router';

import { ProgramForm } from '@/features/programs/components/program-form';
import { createProgram } from '@/features/programs/mutations';

export default function NewProgramScreen() {
  return (
    <ProgramForm
      submitLabel="Créer le programme"
      onSubmit={(value) => {
        const id = createProgram(value);
        router.replace({ pathname: '/programs/[id]', params: { id } });
      }}
    />
  );
}
