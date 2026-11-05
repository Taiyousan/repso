import { DEPENDENCY_CREDITS, LIBRARY_CREDITS } from './licenses';
import packageJson from '../../../package.json';

describe('LIBRARY_CREDITS', () => {
  it('credits every runtime dependency', () => {
    const names = new Set(LIBRARY_CREDITS.map((credit) => credit.name));
    const missing = Object.keys(packageJson.dependencies).filter((dependency) => {
      if (dependency === 'expo' || dependency.startsWith('expo-')) {
        return !names.has('Expo et ses modules');
      }
      return !names.has(DEPENDENCY_CREDITS[dependency]);
    });
    expect(missing).toEqual([]);
  });
});
