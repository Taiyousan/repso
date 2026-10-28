import { shareEqual } from './share-equal';

describe('shareEqual', () => {
  it('returns the previous value when nothing changed', () => {
    const previous = { id: 1, at: new Date(1000), sets: [{ reps: 8 }, { reps: 6 }] };
    const next = { id: 1, at: new Date(1000), sets: [{ reps: 8 }, { reps: 6 }] };
    expect(shareEqual(previous, next)).toBe(previous);
  });

  it('keeps the unchanged parts of a changed value', () => {
    const previous = {
      exercises: [
        { id: 1, sets: [{ reps: 8 }] },
        { id: 2, sets: [{ reps: 5 }] },
      ],
    };
    const next = {
      exercises: [
        { id: 1, sets: [{ reps: 8 }] },
        { id: 2, sets: [{ reps: 6 }] },
      ],
    };
    const shared = shareEqual(previous, next);
    expect(shared).not.toBe(previous);
    expect(shared).toEqual(next);
    expect(shared.exercises[0]).toBe(previous.exercises[0]);
    expect(shared.exercises[1]).not.toBe(previous.exercises[1]);
  });

  it('sees added, removed and reordered items', () => {
    const previous = [{ id: 1 }, { id: 2 }];
    expect(shareEqual(previous, [{ id: 1 }, { id: 2 }, { id: 3 }])).not.toBe(previous);
    expect(shareEqual(previous, [{ id: 1 }])).not.toBe(previous);
    const reordered = shareEqual(previous, [{ id: 2 }, { id: 1 }]);
    expect(reordered).toEqual([{ id: 2 }, { id: 1 }]);
  });

  it('sees a key added with an undefined value', () => {
    const previous: Record<string, unknown> = { a: 1 };
    expect(shareEqual(previous, { a: 1, b: undefined })).not.toBe(previous);
  });

  it('compares dates by time', () => {
    const previous = { at: new Date(1000) };
    expect(shareEqual(previous, { at: new Date(1000) })).toBe(previous);
    expect(shareEqual(previous, { at: new Date(2000) }).at.getTime()).toBe(2000);
  });

  it('compares maps and sets by reference only', () => {
    const previous = { ids: new Set([1]) };
    const next = { ids: new Set([1]) };
    expect(shareEqual(previous, next).ids).toBe(next.ids);
  });
});
