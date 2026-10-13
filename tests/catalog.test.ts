import { describe, expect, it } from 'vitest';
import { buildCatalog, CatalogError, findPageNav } from '../src/lib/catalog';
import { classifyContentPath, humanize, parseSegment } from '../src/lib/slug';

const tutorial = (id: string, extra: Record<string, unknown> = {}) => ({
  id: `${id}/tutorial`,
  data: { title: id, description: '', tags: [], ...extra },
});
const chapter = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
  id: `${id}/chapter`,
  data: { title, ...extra },
});
const page = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: { title: id.split('/').pop()!, ...extra },
});

describe('slug helpers', () => {
  it('strips numeric prefixes and keeps the order', () => {
    expect(parseSegment('01-install-godot.md')).toEqual({ slug: 'install-godot', order: 1 });
    expect(parseSegment('10_paddles')).toEqual({ slug: 'paddles', order: 10 });
    expect(parseSegment('no-prefix')).toEqual({ slug: 'no-prefix', order: undefined });
  });

  it('humanizes folder names', () => {
    expect(humanize('02-game-loop')).toBe('Game loop');
  });

  it('classifies content paths', () => {
    expect(classifyContentPath('godot-pong/tutorial.md')).toEqual({ kind: 'tutorial', tutorial: 'godot-pong' });
    expect(classifyContentPath('godot-pong/01-setup/chapter.md')).toEqual({
      kind: 'chapter',
      tutorial: 'godot-pong',
      chapter: 'setup',
    });
    expect(classifyContentPath('godot-pong/01-setup/02-new.md')).toMatchObject({
      kind: 'page',
      pageId: 'godot-pong/setup/new',
    });
    expect(classifyContentPath('godot-pong/01-setup/files/readme.md')).toBeUndefined();
  });
});

describe('buildCatalog', () => {
  it('orders chapters and pages by prefix, frontmatter order overriding', () => {
    const [t] = buildCatalog(
      [tutorial('pong')],
      [chapter('pong/02-ball', 'Ball'), chapter('pong/01-setup', 'Setup')],
      [
        page('pong/01-setup/02-second'),
        page('pong/01-setup/01-first'),
        page('pong/01-setup/03-moved', { order: 0 }),
        page('pong/02-ball/01-bounce'),
      ],
    );
    expect(t!.chapters.map((c) => c.title)).toEqual(['Setup', 'Ball']);
    expect(t!.pages.map((p) => p.id)).toEqual([
      'pong/setup/moved',
      'pong/setup/first',
      'pong/setup/second',
      'pong/ball/bounce',
    ]);
    expect(t!.pages[0]!.url).toBe('/pong/setup/moved/');
  });

  it('derives a chapter title when chapter.md is missing', () => {
    const [t] = buildCatalog([tutorial('pong')], [], [page('pong/03-game-over/01-score')]);
    expect(t!.chapters[0]).toMatchObject({ slug: 'game-over', title: 'Game over', entry: undefined });
  });

  it('sorts tutorials by order, then title', () => {
    const list = buildCatalog(
      [tutorial('b-tetris', { title: 'Tetris' }), tutorial('a-pong', { title: 'Pong', order: 2 }), tutorial('breakout', { title: 'Breakout', order: 1 })],
      [],
      [],
    );
    expect(list.map((t) => t.data.title)).toEqual(['Breakout', 'Pong', 'Tetris']);
  });

  it('rejects pages without a tutorial.md', () => {
    expect(() => buildCatalog([], [], [page('orphan/01-a/01-b')])).toThrow(CatalogError);
  });

  it('rejects duplicate slugs and reserved names', () => {
    expect(() => buildCatalog([tutorial('pong')], [], [page('pong/01-a/01-x'), page('pong/01-a/02-x')])).toThrow(
      /two pages with slug "x"/,
    );
    expect(() => buildCatalog([tutorial('progress')], [], [])).toThrow(/reserved/);
    expect(() => buildCatalog([tutorial('01-pong'), tutorial('02-pong')], [], [])).toThrow(/share slug/);
  });
});

describe('findPageNav', () => {
  const catalog = buildCatalog(
    [tutorial('pong')],
    [],
    [page('pong/01-a/01-one'), page('pong/01-a/02-two'), page('pong/02-b/01-three')],
  );

  it('links prev/next across chapter boundaries', () => {
    const nav = findPageNav(catalog, 'pong/a/two')!;
    expect(nav.prev?.id).toBe('pong/a/one');
    expect(nav.next?.id).toBe('pong/b/three');
    expect(nav.chapter.slug).toBe('a');
  });

  it('has no prev on the first page and no next on the last', () => {
    expect(findPageNav(catalog, 'pong/a/one')!.prev).toBeUndefined();
    expect(findPageNav(catalog, 'pong/b/three')!.next).toBeUndefined();
    expect(findPageNav(catalog, 'nope')).toBeUndefined();
  });
});
