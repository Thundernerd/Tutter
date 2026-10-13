import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { VFile } from 'vfile';
import { parseQuiz, QuizError, remarkQuiz } from '../src/lib/remark/quiz';
import { remarkCallouts } from '../src/lib/remark/callouts';
import { remarkTutorialLinks } from '../src/lib/remark/links';

const tutorialsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tutter-'));
const pageDir = path.join(tutorialsDir, 'pong', '01-setup');
fs.mkdirSync(path.join(pageDir, 'files'), { recursive: true });
fs.mkdirSync(path.join(tutorialsDir, 'pong', '02-ball'), { recursive: true });
fs.writeFileSync(path.join(pageDir, 'files', 'project.zip'), 'zipdata');
fs.writeFileSync(path.join(tutorialsDir, 'pong', '02-ball', '01-bounce.md'), '# hi');
afterAll(() => fs.rmSync(tutorialsDir, { recursive: true, force: true }));

async function render(markdown: string, file = path.join(pageDir, '02-new-project.md')) {
  const out = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCallouts)
    .use(remarkQuiz, { tutorialsDir })
    .use(remarkTutorialLinks, { tutorialsDir })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(new VFile({ value: markdown, path: file }));
  return String(out);
}

describe('parseQuiz', () => {
  it('parses a single-choice quiz with defaults', () => {
    const quiz = parseQuiz('question: Q?\noptions: [a, b]\nanswer: 1', 'p#1');
    expect(quiz).toEqual({ id: 'p#1', type: 'single', question: 'Q?', options: ['a', 'b'], answer: 1 });
  });

  it('normalizes multiple-choice and text answers', () => {
    expect(parseQuiz('type: multiple\nquestion: Q\noptions: [a, b, c]\nanswer: [2, 0, 2]', 'x')).toMatchObject({
      answer: [0, 2],
    });
    expect(parseQuiz('type: text\nquestion: Q\nanswer: move_and_slide', 'x')).toMatchObject({
      answer: ['move_and_slide'],
    });
  });

  it.each([
    ['invalid YAML', 'question: [unclosed', /invalid YAML/],
    ['missing question', 'options: [a, b]\nanswer: 0', /question/],
    ['answer out of range', 'question: Q\noptions: [a, b]\nanswer: 5', /between 0 and 1/],
    ['too few options', 'question: Q\noptions: [a]\nanswer: 0', /at least two options/],
    ['unknown field', 'question: Q\noptions: [a, b]\nanswer: 0\nanswr: 1', /answr/],
  ])('rejects %s', (_name, source, message) => {
    expect(() => parseQuiz(source, 'x')).toThrow(QuizError);
    expect(() => parseQuiz(source, 'x')).toThrow(message);
  });
});

describe('remarkQuiz', () => {
  it('renders quiz markup with page-derived ids', async () => {
    const html = await render('```quiz\nquestion: Pick `b`\noptions: [a, b]\nanswer: 1\nexplain: Because.\n```\n\n```quiz\nid: custom\ntype: text\nquestion: Q\nanswer: yes\n```');
    expect(html).toContain('data-quiz-id="pong/setup/new-project#1"');
    expect(html).toContain('data-quiz-id="custom"');
    expect(html).toContain('<p class="quiz-question">Pick <code>b</code></p>');
    expect(html).toContain('type="radio"');
    expect(html).toContain('<details class="quiz-reveal">');
  });

  it('fails with the quiz number and line for malformed blocks', async () => {
    await expect(render('# Title\n\n```quiz\nquestion: Q\noptions: [a, b]\nanswer: 9\n```')).rejects.toThrow(
      /Quiz #1 in .*02-new-project\.md \(line 3\): answer must be/,
    );
  });

  it('rejects duplicate quiz ids', async () => {
    const block = '```quiz\nid: same\nquestion: Q\noptions: [a, b]\nanswer: 0\n```\n\n';
    await expect(render(block + block)).rejects.toThrow(/Duplicate quiz id "same"/);
  });

  it('leaves other code blocks alone', async () => {
    expect(await render('```gdscript\nfunc _ready(): pass\n```')).toContain('language-gdscript');
  });
});

describe('remarkCallouts', () => {
  it('renders known directives as asides with default or custom titles', async () => {
    const html = await render(':::tip\nDo this.\n:::\n\n:::warning[Careful now]\nNot that.\n:::');
    expect(html).toContain('<aside class="callout callout-tip"><p class="callout-title">Tip</p>');
    expect(html).toContain('<aside class="callout callout-warning"><p class="callout-title">Careful now</p><p>Not that.</p></aside>');
  });

  it('keeps prose that merely looks like a directive', async () => {
    const html = await render('Meet at 12:30 or see Note:this.');
    expect(html).toContain('Meet at 12:30 or see Note:this.');
  });
});

describe('remarkTutorialLinks', () => {
  it('rewrites file links to /files and marks them as downloads', async () => {
    const html = await render('[Project](./files/project.zip)');
    expect(html).toContain('href="/files/pong/01-setup/files/project.zip"');
    expect(html).toContain('class="download"');
    expect(html).toContain('download="project.zip"');
    expect(html).toContain('data-size="7 B"');
  });

  it('rewrites markdown links to page urls and keeps the hash', async () => {
    const html = await render('[next](../02-ball/01-bounce.md#walls)');
    expect(html).toContain('href="/pong/ball/bounce/#walls"');
  });

  it('leaves external and anchor links alone', async () => {
    const html = await render('[a](https://godotengine.org) [b](#top) [c](/progress/)');
    expect(html).toContain('href="https://godotengine.org"');
    expect(html).toContain('href="#top"');
    expect(html).toContain('href="/progress/"');
  });

  it('fails on missing targets', async () => {
    await expect(render('[gone](./files/missing.zip)')).rejects.toThrow(/does not exist/);
  });
});
