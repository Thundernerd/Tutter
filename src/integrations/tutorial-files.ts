/**
 * Serves every non-markdown file under `tutorials/` at `/files/<path>`:
 * via middleware in dev, copied into the output directory on build.
 * The `remarkTutorialLinks` plugin rewrites relative links to these URLs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

const MIME: Record<string, string> = {
  '.zip': 'application/zip',
  '.gd': 'text/plain; charset=utf-8',
  '.cs': 'text/plain; charset=utf-8',
  '.cpp': 'text/plain; charset=utf-8',
  '.h': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (!entry.name.endsWith('.md')) yield full;
  }
}

export function tutorialFiles({ tutorialsDir }: { tutorialsDir: string }): AstroIntegration {
  return {
    name: 'tutter:tutorial-files',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use('/files', (req, res, next) => {
          const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]!);
          const abs = path.join(tutorialsDir, urlPath);
          if (!abs.startsWith(tutorialsDir + path.sep) || abs.endsWith('.md') || !fs.existsSync(abs)) {
            return next();
          }
          if (!fs.statSync(abs).isFile()) return next();
          res.setHeader('Content-Type', MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream');
          fs.createReadStream(abs).pipe(res);
        });
      },
      'astro:build:done': ({ dir, logger }) => {
        const outDir = path.join(fileURLToPath(dir), 'files');
        let count = 0;
        for (const file of walk(tutorialsDir)) {
          const dest = path.join(outDir, path.relative(tutorialsDir, file));
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(file, dest);
          count += 1;
        }
        logger.info(`Copied ${count} tutorial file(s) to /files`);
      },
    },
  };
}
