import { describe, expect, it, vi } from 'vitest';
import {
  createProgressStore,
  mergeProgress,
  parseProgress,
  ProgressImportError,
  STORAGE_KEY,
  type KeyValueStorage,
} from '../src/lib/progress';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function makeStore(start = '2026-01-01T00:00:00.000Z') {
  let time = new Date(start).getTime();
  const storage = memoryStorage();
  const onChange = vi.fn();
  const store = createProgressStore(storage, {
    onChange,
    now: () => new Date((time += 1000)),
  });
  return { store, storage, onChange };
}

describe('progress store', () => {
  it('marks pages complete and computes stats', () => {
    const { store, onChange } = makeStore();
    store.markComplete('t/a/one');
    store.markComplete('t/a/two');
    expect(store.isComplete('t/a/one')).toBe(true);
    expect(store.stats(['t/a/one', 't/a/two', 't/b/three'])).toEqual({ completed: 2, total: 3, percent: 67 });
    expect(store.stats([])).toEqual({ completed: 0, total: 0, percent: 0 });
    store.markIncomplete('t/a/one');
    expect(store.isComplete('t/a/one')).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('keeps the original completion time when marked twice', () => {
    const { store } = makeStore();
    store.markComplete('p');
    const first = store.get().pages.p!.completedAt;
    store.markComplete('p');
    expect(store.get().pages.p!.completedAt).toBe(first);
  });

  it('counts quiz attempts and keeps a quiz solved once correct', () => {
    const { store } = makeStore();
    store.recordQuizAttempt('q', false, 0);
    store.recordQuizAttempt('q', true, 1);
    store.recordQuizAttempt('q', false, 2);
    expect(store.getQuiz('q')).toMatchObject({ correct: true, attempts: 3, lastAnswer: 2 });
  });

  it('recovers from corrupt storage', () => {
    const { store, storage } = makeStore();
    storage.data.set(STORAGE_KEY, '{not json');
    expect(store.get().pages).toEqual({});
    store.markComplete('p');
    expect(store.isComplete('p')).toBe(true);
  });

  it('round-trips export and import, merging with existing progress', () => {
    const a = makeStore();
    a.store.markComplete('shared');
    a.store.markComplete('only-a');
    a.store.recordQuizAttempt('q', true, 1);
    a.store.setLastVisited({ pageId: 'only-a', url: '/a/', title: 'A' });
    const exported = a.store.exportJSON();

    const b = makeStore('2027-01-01T00:00:00.000Z');
    b.store.markComplete('only-b');
    b.store.recordQuizAttempt('q', false, 0);
    const merged = b.store.importJSON(exported);

    expect(Object.keys(merged.pages).sort()).toEqual(['only-a', 'only-b', 'shared']);
    // b's quiz attempt is newer, so it wins.
    expect(merged.quizzes.q).toMatchObject({ correct: false, attempts: 1 });
    expect(merged.lastVisited?.pageId).toBe('only-a');
    expect(b.store.isComplete('only-a')).toBe(true);
  });

  it('rejects files that are not progress exports', () => {
    const { store } = makeStore();
    expect(() => store.importJSON('nope')).toThrow(ProgressImportError);
    expect(() => store.importJSON('{"pages": {}}')).toThrow(/version/);
    expect(() => store.importJSON('[]')).toThrow(ProgressImportError);
  });

  it('reset clears everything', () => {
    const { store, storage } = makeStore();
    store.markComplete('p');
    store.reset();
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
    expect(store.get().pages).toEqual({});
  });
});

describe('parseProgress', () => {
  it('drops malformed entries instead of failing', () => {
    const data = parseProgress({
      version: 1,
      pages: { good: { completedAt: '2026-01-01T00:00:00Z' }, bad: { completedAt: 'yesterday' }, worse: 3 },
      quizzes: { q: { correct: 'yes', attempts: 1, updatedAt: '2026-01-01T00:00:00Z' } },
      lastVisited: { pageId: 1 },
    });
    expect(Object.keys(data.pages)).toEqual(['good']);
    expect(data.quizzes).toEqual({});
    expect(data.lastVisited).toBeNull();
  });
});

describe('mergeProgress', () => {
  it('prefers the most recent lastVisited', () => {
    const base = { version: 1 as const, pages: {}, quizzes: {} };
    const older = { ...base, lastVisited: { pageId: 'a', url: '/a/', title: 'A', at: '2026-01-01T00:00:00Z' } };
    const newer = { ...base, lastVisited: { pageId: 'b', url: '/b/', title: 'B', at: '2026-02-01T00:00:00Z' } };
    expect(mergeProgress(newer, older).lastVisited?.pageId).toBe('b');
    expect(mergeProgress(older, newer).lastVisited?.pageId).toBe('b');
  });
});
