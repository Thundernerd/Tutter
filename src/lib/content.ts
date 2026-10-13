import { getCollection, type CollectionEntry } from 'astro:content';
import { buildCatalog, CatalogError, type PageNav } from './catalog';

let cached: ReturnType<typeof load> | undefined;

async function load() {
  const [tutorials, chapters, pages] = await Promise.all([
    getCollection('tutorials'),
    getCollection('chapters'),
    getCollection('pages'),
  ]);

  // The glob loader only logs markdown errors (e.g. an invalid quiz) and keeps
  // the entry without HTML, which would publish a silently empty page. It only
  // logs when it renders: an unchanged file reuses the cached failed entry.
  const broken = [...chapters, ...pages].filter((e) => !e.rendered).map((e) => e.filePath ?? e.id);
  if (broken.length > 0) {
    throw new CatalogError(
      `Failed to render ${broken.join(', ')}. See the [glob-loader] error above for details. ` +
        'If there is none, the failure was cached by an earlier build: run `npx astro build --force` to see it.',
    );
  }

  return buildCatalog(tutorials, chapters, pages);
}

export type Catalog = Awaited<ReturnType<typeof load>>;
export type CatalogTutorial = Catalog[number];
export type CatalogPageNav = PageNav<CollectionEntry<'tutorials'>, CollectionEntry<'chapters'>, CollectionEntry<'pages'>>;

/** All tutorials, ordered. Cached for the duration of a build. */
export function getTutorials(): Promise<Catalog> {
  // Re-read in dev so edits to markdown show up without a restart.
  if (import.meta.env.DEV) return load();
  cached ??= load();
  return cached;
}
