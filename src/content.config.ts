import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CHAPTER_FILE, TUTORIAL_FILE, TUTORIALS_DIR } from './lib/slug';

// Entry ids are the file path without `.md` (prefixes kept); the catalog
// derives URL slugs from them.
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const tutorials = defineCollection({
  loader: glob({ base: `./${TUTORIALS_DIR}`, pattern: `*/${TUTORIAL_FILE}`, generateId }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      engine: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      tags: z.array(z.string()).default([]),
      order: z.number().optional(),
      cover: image().optional(),
    }),
});

const chapters = defineCollection({
  loader: glob({ base: `./${TUTORIALS_DIR}`, pattern: `*/*/${CHAPTER_FILE}`, generateId }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    order: z.number().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({
    base: `./${TUTORIALS_DIR}`,
    pattern: ['*/*/*.md', `!*/*/${CHAPTER_FILE}`],
    generateId,
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    estimatedMinutes: z.number().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { tutorials, chapters, pages };
