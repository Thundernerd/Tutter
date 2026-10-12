/**
 * Builds the ordered Tutorial → Chapter → Page tree from raw content entries.
 *
 * Pure (no `astro:content` import) so it can be unit tested; `content.ts`
 * feeds it the real collections.
 */
import { RESERVED_SLUGS, humanize, parseSegment, pageUrl } from './slug';

/** Minimal shape of a content collection entry; `id` is the path without `.md`. */
export interface RawEntry<D> {
  id: string;
  data: D;
}

export interface TutorialData {
  title: string;
  description: string;
  engine?: string | undefined;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | undefined;
  tags: string[];
  order?: number | undefined;
  cover?: unknown;
}
export interface ChapterData {
  title: string;
  summary?: string | undefined;
  order?: number | undefined;
}
export interface PageData {
  title: string;
  description?: string | undefined;
  estimatedMinutes?: number | undefined;
  order?: number | undefined;
}

export interface Page<PE = unknown> {
  /** Stable progress id and URL path: `tutorial/chapter/page`. */
  id: string;
  slug: string;
  url: string;
  title: string;
  data: PageData;
  entry: PE;
}
export interface Chapter<CE = unknown, PE = unknown> {
  slug: string;
  url: string;
  title: string;
  data: ChapterData;
  /** The chapter.md entry, if the chapter has one. */
  entry: CE | undefined;
  pages: Page<PE>[];
}
export interface Tutorial<TE = unknown, CE = unknown, PE = unknown> {
  slug: string;
  url: string;
  data: TutorialData;
  entry: TE;
  chapters: Chapter<CE, PE>[];
  /** All pages in reading order. */
  pages: Page<PE>[];
}

export interface PageNav<TE = unknown, CE = unknown, PE = unknown> {
  tutorial: Tutorial<TE, CE, PE>;
  chapter: Chapter<CE, PE>;
  page: Page<PE>;
  prev: Page<PE> | undefined;
  next: Page<PE> | undefined;
}

interface Sortable {
  order: number | undefined;
  name: string;
}

function compareSortable(a: Sortable, b: Sortable): number {
  const ao = a.order ?? Number.POSITIVE_INFINITY;
  const bo = b.order ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao < bo ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function sortBy<T>(items: T[], key: (item: T) => Sortable): T[] {
  return [...items].sort((a, b) => compareSortable(key(a), key(b)));
}

export class CatalogError extends Error {}

export function buildCatalog<
  TE extends RawEntry<TutorialData>,
  CE extends RawEntry<ChapterData>,
  PE extends RawEntry<PageData>,
>(tutorials: TE[], chapters: CE[], pages: PE[]): Tutorial<TE, CE, PE>[] {

  const tutorialDirs = new Map<string, TE>();
  for (const t of tutorials) tutorialDirs.set(t.id.split('/')[0]!, t);

  const chapterEntries = new Map<string, CE>();
  for (const c of chapters) {
    const [tDir, cDir] = c.id.split('/');
    chapterEntries.set(`${tDir}/${cDir}`, c);
  }

  // Group pages by tutorial dir → chapter dir.
  const grouped = new Map<string, Map<string, PE[]>>();
  for (const p of pages) {
    const [tDir, cDir] = p.id.split('/') as [string, string];
    if (!tutorialDirs.has(tDir)) {
      throw new CatalogError(`Page "${p.id}.md" belongs to "${tDir}", which has no tutorial.md`);
    }
    const byChapter = grouped.get(tDir) ?? new Map<string, PE[]>();
    grouped.set(tDir, byChapter);
    const list = byChapter.get(cDir) ?? [];
    list.push(p);
    byChapter.set(cDir, list);
  }

  const seenTutorialSlugs = new Map<string, string>();
  const result: Tutorial<TE, CE, PE>[] = [];

  for (const [tDir, tEntry] of tutorialDirs) {
    const tSeg = parseSegment(tDir);
    if (RESERVED_SLUGS.has(tSeg.slug)) {
      throw new CatalogError(`Tutorial folder "${tDir}" uses reserved slug "${tSeg.slug}"`);
    }
    const clash = seenTutorialSlugs.get(tSeg.slug);
    if (clash) throw new CatalogError(`Tutorial folders "${clash}" and "${tDir}" share slug "${tSeg.slug}"`);
    seenTutorialSlugs.set(tSeg.slug, tDir);

    const byChapter = grouped.get(tDir) ?? new Map<string, PE[]>();
    // Chapters exist if they have a chapter.md or at least one page.
    const chapterDirs = new Set(byChapter.keys());
    for (const key of chapterEntries.keys()) {
      const [ct, cd] = key.split('/') as [string, string];
      if (ct === tDir) chapterDirs.add(cd);
    }

    const chapterList: { dir: string; chapter: Chapter<CE, PE> }[] = [];
    const seenChapterSlugs = new Set<string>();
    for (const cDir of chapterDirs) {
      const cSeg = parseSegment(cDir);
      if (seenChapterSlugs.has(cSeg.slug)) {
        throw new CatalogError(`Tutorial "${tDir}" has two chapters with slug "${cSeg.slug}"`);
      }
      seenChapterSlugs.add(cSeg.slug);
      const cEntry = chapterEntries.get(`${tDir}/${cDir}`);
      const cData: ChapterData = cEntry?.data ?? { title: humanize(cDir) };

      const seenPageSlugs = new Set<string>();
      const pageList = (byChapter.get(cDir) ?? []).map((p) => {
        const pSeg = parseSegment(p.id.split('/')[2]!);
        if (seenPageSlugs.has(pSeg.slug)) {
          throw new CatalogError(`Chapter "${tDir}/${cDir}" has two pages with slug "${pSeg.slug}"`);
        }
        seenPageSlugs.add(pSeg.slug);
        const id = `${tSeg.slug}/${cSeg.slug}/${pSeg.slug}`;
        const page: Page<PE> = { id, slug: pSeg.slug, url: pageUrl(id), title: p.data.title, data: p.data, entry: p };
        return { order: p.data.order ?? pSeg.order, page };
      });

      const chapter: Chapter<CE, PE> = {
        slug: cSeg.slug,
        url: `/${tSeg.slug}/${cSeg.slug}/`,
        title: cData.title,
        data: cData,
        entry: cEntry,
        pages: sortBy(pageList, ({ order, page }) => ({ order, name: page.slug })).map(({ page }) => page),
      };
      chapterList.push({ dir: cDir, chapter });
    }

    const sortedChapters = sortBy(chapterList, ({ dir, chapter }) => ({
      order: chapter.data.order ?? parseSegment(dir).order,
      name: chapter.slug,
    })).map(({ chapter }) => chapter);

    result.push({
      slug: tSeg.slug,
      url: `/${tSeg.slug}/`,
      data: tEntry.data,
      entry: tEntry,
      chapters: sortedChapters,
      pages: sortedChapters.flatMap((c) => c.pages),
    });
  }

  return sortBy(result, (t) => ({ order: t.data.order, name: t.data.title }));
}

export function findPageNav<TE, CE, PE>(
  catalog: Tutorial<TE, CE, PE>[],
  pageId: string,
): PageNav<TE, CE, PE> | undefined {
  for (const tutorial of catalog) {
    const index = tutorial.pages.findIndex((p) => p.id === pageId);
    if (index === -1) continue;
    const page = tutorial.pages[index]!;
    const chapter = tutorial.chapters.find((c) => c.pages.includes(page))!;
    return {
      tutorial,
      chapter,
      page,
      prev: tutorial.pages[index - 1],
      next: tutorial.pages[index + 1],
    };
  }
  return undefined;
}
