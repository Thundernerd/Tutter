/**
 * Path conventions shared by the catalog (routes) and the remark plugins.
 *
 * Content lives under `tutorials/<tutorial>/<chapter>/<page>.md`. Every path
 * segment may carry a numeric ordering prefix (`01-setup`) that is stripped
 * from the URL slug.
 */
import path from 'node:path';

export const TUTORIALS_DIR = 'tutorials';
export const TUTORIAL_FILE = 'tutorial.md';
export const CHAPTER_FILE = 'chapter.md';

/** Top-level routes that a tutorial slug must not shadow. */
export const RESERVED_SLUGS = new Set(['files', 'progress', '_astro']);

export interface Segment {
  slug: string;
  /** Numeric prefix, or `undefined` when the segment has none. */
  order: number | undefined;
}

const PREFIX = /^(\d+)[-_.\s]+(.+)$/;

export function parseSegment(segment: string): Segment {
  const name = segment.replace(/\.md$/, '');
  const match = PREFIX.exec(name);
  if (!match) return { slug: name, order: undefined };
  return { slug: match[2]!, order: Number(match[1]) };
}

/** "01-install-godot" -> "Install godot" (fallback titles for missing chapter.md). */
export function humanize(segment: string): string {
  const words = parseSegment(segment).slug.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export type ContentFile =
  | { kind: 'tutorial'; tutorial: string }
  | { kind: 'chapter'; tutorial: string; chapter: string }
  | { kind: 'page'; tutorial: string; chapter: string; page: string; pageId: string };

/**
 * Classify a markdown file by its path relative to the tutorials directory
 * (e.g. `godot-pong/01-setup/01-install.md`). Slugs have prefixes stripped.
 */
export function classifyContentPath(relPath: string): ContentFile | undefined {
  const parts = relPath.split(/[\\/]/).filter(Boolean);
  if (parts.length === 2 && parts[1] === TUTORIAL_FILE) {
    return { kind: 'tutorial', tutorial: parseSegment(parts[0]!).slug };
  }
  if (parts.length !== 3 || !parts[2]!.endsWith('.md')) return undefined;
  const tutorial = parseSegment(parts[0]!).slug;
  const chapter = parseSegment(parts[1]!).slug;
  if (parts[2] === CHAPTER_FILE) return { kind: 'chapter', tutorial, chapter };
  const page = parseSegment(parts[2]!).slug;
  return { kind: 'page', tutorial, chapter, page, pageId: `${tutorial}/${chapter}/${page}` };
}

/** Absolute path of the tutorials directory for a given project root. */
export function tutorialsRoot(projectRoot: string): string {
  return path.resolve(projectRoot, TUTORIALS_DIR);
}

/** URL for a page id / chapter / tutorial (always with trailing slash). */
export function pageUrl(pageId: string): string {
  return `/${pageId}/`;
}

/** Public URL a downloadable file under `tutorials/` is served from. */
export function fileUrl(relPathFromTutorials: string): string {
  return '/files/' + relPathFromTutorials.split(path.sep).join('/');
}
