// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import expressiveCode from 'astro-expressive-code';
import remarkDirective from 'remark-directive';
import { remarkCallouts } from './src/lib/remark/callouts.ts';
import { remarkQuiz } from './src/lib/remark/quiz.ts';
import { remarkTutorialLinks } from './src/lib/remark/links.ts';
import { tutorialFiles } from './src/integrations/tutorial-files.ts';

const tutorialsDir = fileURLToPath(new URL('./tutorials', import.meta.url));

export default defineConfig({
  trailingSlash: 'always',
  integrations: [
    expressiveCode({
      themes: ['github-dark', 'github-light'],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
      styleOverrides: { borderRadius: '0.5rem', codeFontSize: '0.875rem' },
    }),
    tutorialFiles({ tutorialsDir }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkDirective,
        remarkCallouts,
        [remarkQuiz, { tutorialsDir }],
        [remarkTutorialLinks, { tutorialsDir }],
      ],
    }),
  },
});
