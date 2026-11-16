import libraryJson from '../../src/data/exercise-library.json';
import type { LibraryExercise } from '../../src/features/exercises/library-format';

/** The exercise library of the app (src/data/exercise-library.json). */
export const library = libraryJson as LibraryExercise[];

export const sortedLibrary = [...library].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
