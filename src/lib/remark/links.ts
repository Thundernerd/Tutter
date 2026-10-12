/**
 * Resolves relative links in tutorial markdown:
 *  - `[next](../02-paddles/01-move.md)` → the page's site URL
 *  - `[project](./files/pong.zip)`      → `/files/<path>` with a download style
 * Missing targets fail the build so broken links are caught early.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Link, Root } from 'mdast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import { classifyContentPath, fileUrl, pageUrl } from '../slug';

export interface RemarkLinksOptions {
  tutorialsDir: string;
}

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i;

export function remarkTutorialLinks({ tutorialsDir }: RemarkLinksOptions) {
  return (tree: Root, file: VFile) => {
    if (!file.path || !path.resolve(file.path).startsWith(tutorialsDir + path.sep)) return;
    const dir = path.dirname(file.path);

    visit(tree, 'link', (node: Link) => {
      if (EXTERNAL.test(node.url)) return;
      const [, target = '', hash = ''] = /^([^#?]*)(?:\?[^#]*)?(#.*)?$/.exec(node.url) ?? [];
      if (!target) return;
      const abs = path.resolve(dir, decodeURI(target));
      const rel = path.relative(tutorialsDir, abs);

      if (rel.startsWith('..') || !fs.existsSync(abs)) {
        file.fail(`Link target "${node.url}" does not exist (resolved to ${abs})`, node);
      }

      if (abs.endsWith('.md')) {
        const info = classifyContentPath(rel);
        if (info?.kind === 'page') node.url = pageUrl(info.pageId) + hash;
        else if (info?.kind === 'chapter') node.url = `/${info.tutorial}/${info.chapter}/` + hash;
        else if (info?.kind === 'tutorial') node.url = `/${info.tutorial}/` + hash;
        else file.fail(`Link "${node.url}" points to markdown outside the tutorial structure`, node);
        return;
      }

      const size = fs.statSync(abs).size;
      node.url = fileUrl(rel);
      node.data = {
        ...node.data,
        hProperties: {
          className: ['download'],
          download: path.basename(abs),
          'data-size': formatSize(size),
        },
      };
    });
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
