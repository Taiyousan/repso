import { router } from 'expo-router';

import { ProgramForm } from '@/features/programs/components/program-form';
import { createProgram } from '@/features/programs/mutations';

export default function NewProgramScreen() {
  return (
    <ProgramForm
      submitLabel="Créer le programme"
      onSubmit={(value) => {
        const id = createProgram(value);
        // Straight to edit mode, to add its workouts.
        router.replace({ pathname: '/programs/edit/[id]', params: { id } });
      }}
    />
  );
}
