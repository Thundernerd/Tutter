/**
 * Client-side learning progress, persisted in localStorage.
 *
 * `createProgressStore` takes a storage backend so it can be unit tested;
 * browser code uses the shared `progress` instance.
 */

export const STORAGE_KEY = 'tutter:progress:v1';
export const CHANGE_EVENT = 'tutter:progress-change';

export interface PageProgress {
  completedAt: string;
}
export interface QuizProgress {
  correct: boolean;
  attempts: number;
  lastAnswer: unknown;
  updatedAt: string;
}
export interface LastVisited {
  pageId: string;
  url: string;
  title: string;
  at: string;
}
export interface ProgressData {
  version: 1;
  pages: Record<string, PageProgress>;
  quizzes: Record<string, QuizProgress>;
  lastVisited: LastVisited | null;
}

export interface TutorialStats {
  completed: number;
  total: number;
  percent: number;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function emptyProgress(): ProgressData {
  return { version: 1, pages: {}, quizzes: {}, lastVisited: null };
}

export class ProgressImportError extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/** Validate untrusted JSON (from storage or an import file). Drops malformed entries. */
export function parseProgress(input: unknown): ProgressData {
  if (!isObject(input) || input.version !== 1) {
    throw new ProgressImportError('Not a Tutter progress file (expected "version": 1).');
  }
  const data = emptyProgress();
  if (isObject(input.pages)) {
    for (const [id, p] of Object.entries(input.pages)) {
      if (isObject(p) && isIsoDate(p.completedAt)) data.pages[id] = { completedAt: p.completedAt };
    }
  }
  if (isObject(input.quizzes)) {
    for (const [id, q] of Object.entries(input.quizzes)) {
      if (isObject(q) && typeof q.correct === 'boolean' && typeof q.attempts === 'number' && isIsoDate(q.updatedAt)) {
        data.quizzes[id] = { correct: q.correct, attempts: q.attempts, lastAnswer: q.lastAnswer ?? null, updatedAt: q.updatedAt };
      }
    }
  }
  const lv = input.lastVisited;
  if (isObject(lv) && typeof lv.pageId === 'string' && typeof lv.url === 'string' && typeof lv.title === 'string' && isIsoDate(lv.at)) {
    data.lastVisited = { pageId: lv.pageId, url: lv.url, title: lv.title, at: lv.at };
  }
  return data;
}

const newer = (a: string, b: string) => Date.parse(a) >= Date.parse(b);

/** Union of two progress snapshots; on conflicts the more recent entry wins. */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const out = emptyProgress();
  out.pages = { ...a.pages };
  for (const [id, p] of Object.entries(b.pages)) {
    const existing = out.pages[id];
    if (!existing || newer(p.completedAt, existing.completedAt)) out.pages[id] = p;
  }
  out.quizzes = { ...a.quizzes };
  for (const [id, q] of Object.entries(b.quizzes)) {
    const existing = out.quizzes[id];
    if (!existing || newer(q.updatedAt, existing.updatedAt)) out.quizzes[id] = q;
  }
  const lvs = [a.lastVisited, b.lastVisited].filter((v): v is LastVisited => v !== null);
  out.lastVisited = lvs.sort((x, y) => Date.parse(y.at) - Date.parse(x.at))[0] ?? null;
  return out;
}

export function createProgressStore(
  storage: KeyValueStorage,
  options: { onChange?: (data: ProgressData) => void; now?: () => Date } = {},
) {
  const now = () => (options.now?.() ?? new Date()).toISOString();

  function read(): ProgressData {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? parseProgress(JSON.parse(raw)) : emptyProgress();
    } catch {
      return emptyProgress();
    }
  }

  function write(data: ProgressData) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (private mode): progress just won't persist.
    }
    options.onChange?.(data);
  }

  function update(fn: (data: ProgressData) => void) {
    const data = read();
    fn(data);
    write(data);
  }

  return {
    get: read,
    isComplete: (pageId: string) => pageId in read().pages,
    markComplete(pageId: string) {
      update((d) => {
        d.pages[pageId] ??= { completedAt: now() };
      });
    },
    markIncomplete(pageId: string) {
      update((d) => {
        delete d.pages[pageId];
      });
    },
    getQuiz: (quizId: string): QuizProgress | undefined => read().quizzes[quizId],
    recordQuizAttempt(quizId: string, correct: boolean, answer: unknown) {
      update((d) => {
        const prev = d.quizzes[quizId];
        d.quizzes[quizId] = {
          // Once answered correctly, a quiz stays "correct".
          correct: correct || (prev?.correct ?? false),
          attempts: (prev?.attempts ?? 0) + 1,
          lastAnswer: answer,
          updatedAt: now(),
        };
      });
    },
    setLastVisited(visit: Omit<LastVisited, 'at'>) {
      update((d) => {
        d.lastVisited = { ...visit, at: now() };
      });
    },
    stats(pageIds: string[]): TutorialStats {
      const pages = read().pages;
      const completed = pageIds.filter((id) => id in pages).length;
      const total = pageIds.length;
      return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
    },
    exportJSON: () => JSON.stringify(read(), null, 2),
    /** Merge an exported file into the current progress. Throws ProgressImportError. */
    importJSON(json: string) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new ProgressImportError('File is not valid JSON.');
      }
      const merged = mergeProgress(read(), parseProgress(parsed));
      write(merged);
      return merged;
    },
    reset() {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      options.onChange?.(emptyProgress());
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;

function browserStorage(): KeyValueStorage {
  try {
    const s = window.localStorage;
    s.getItem(STORAGE_KEY);
    return s;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    };
  }
}

let instance: ProgressStore | undefined;

/** Shared browser store. Dispatches `CHANGE_EVENT` on window after each write. */
export function getProgress(): ProgressStore {
  instance ??= createProgressStore(browserStorage(), {
    onChange: (data) => window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: data })),
  });
  return instance;
}

/** Run `fn` now and whenever progress changes (in this tab or another). */
export function onProgressChange(fn: () => void) {
  fn();
  window.addEventListener(CHANGE_EVENT, fn);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) fn();
  });
}
