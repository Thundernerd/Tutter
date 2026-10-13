/**
 * Turns ```quiz fenced blocks (YAML inside) into interactive quiz markup.
 * Hydrated on the client by `src/scripts/quiz.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Code, Html, Root } from 'mdast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';
import { z } from 'astro/zod';
import { classifyContentPath } from '../slug';
import { escapeHtml, inlineMarkdown } from './html';

const quizSchema = z
  .object({
    id: z.string().optional(),
    question: z.string(),
    type: z.enum(['single', 'multiple', 'text']).default('single'),
    options: z.array(z.coerce.string()).optional(),
    answer: z.union([z.number().int(), z.array(z.number().int()), z.string(), z.array(z.string())]),
    explain: z.string().optional(),
    hint: z.string().optional(),
  })
  .strict();

export type QuizSpec = z.infer<typeof quizSchema>;

/** The resolved quiz, as serialized into `data-quiz` for the client. */
export type Quiz =
  | { id: string; type: 'single'; question: string; options: string[]; answer: number; explain?: string; hint?: string }
  | { id: string; type: 'multiple'; question: string; options: string[]; answer: number[]; explain?: string; hint?: string }
  | { id: string; type: 'text'; question: string; answer: string[]; explain?: string; hint?: string };

export class QuizError extends Error {}

/** Validate one quiz block. Throws `QuizError` with a human readable reason. */
export function parseQuiz(source: string, defaultId: string): Quiz {
  let raw: unknown;
  try {
    raw = parseYaml(source);
  } catch (err) {
    throw new QuizError(`invalid YAML: ${(err as Error).message}`);
  }
  const result = quizSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new QuizError(issues.join('; '));
  }
  const spec = result.data;
  const base = {
    id: spec.id ?? defaultId,
    question: spec.question,
    ...(spec.explain !== undefined && { explain: spec.explain }),
    ...(spec.hint !== undefined && { hint: spec.hint }),
  };

  if (spec.type === 'text') {
    const answers = (Array.isArray(spec.answer) ? spec.answer : [spec.answer]).map(String);
    if (answers.length === 0) throw new QuizError('text quiz needs at least one accepted answer');
    return { ...base, type: 'text', answer: answers };
  }

  const options = spec.options ?? [];
  if (options.length < 2) throw new QuizError(`${spec.type} quiz needs at least two options`);
  const inRange = (n: unknown): n is number => typeof n === 'number' && n >= 0 && n < options.length;

  if (spec.type === 'single') {
    if (!inRange(spec.answer)) {
      throw new QuizError(`answer must be an option index between 0 and ${options.length - 1}`);
    }
    return { ...base, type: 'single', options, answer: spec.answer };
  }

  const answer = Array.isArray(spec.answer) ? spec.answer : [spec.answer];
  if (answer.length === 0 || !answer.every(inRange)) {
    throw new QuizError(`answer must be a list of option indexes between 0 and ${options.length - 1}`);
  }
  return { ...base, type: 'multiple', options, answer: [...new Set(answer as number[])].sort((a, b) => a - b) };
}

export function renderQuiz(quiz: Quiz): string {
  const name = `quiz-${quiz.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const input =
    quiz.type === 'text'
      ? `<input class="quiz-text" type="text" name="${name}" autocomplete="off" spellcheck="false" aria-label="Your answer">`
      : `<ul class="quiz-options">${quiz.options
          .map(
            (opt, i) =>
              `<li><label><input type="${quiz.type === 'single' ? 'radio' : 'checkbox'}" name="${name}" value="${i}"> <span>${inlineMarkdown(opt)}</span></label></li>`,
          )
          .join('')}</ul>`;

  const answerText =
    quiz.type === 'text'
      ? quiz.answer.map((a) => `<code>${escapeHtml(a)}</code>`).join(' or ')
      : (Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer])
          .map((i) => inlineMarkdown(quiz.options[i]!))
          .join(', ');

  const kindLabel = { single: 'Pick one', multiple: 'Pick all that apply', text: 'Type your answer' }[quiz.type];

  return [
    `<div class="quiz" data-quiz-id="${escapeHtml(quiz.id)}" data-quiz="${escapeHtml(JSON.stringify(quiz))}">`,
    `<div class="quiz-header"><span class="quiz-badge">Quiz</span><span class="quiz-kind">${kindLabel}</span><span class="quiz-status" hidden></span></div>`,
    `<p class="quiz-question">${inlineMarkdown(quiz.question)}</p>`,
    `<form class="quiz-form">${input}`,
    `<div class="quiz-actions"><button type="submit" class="btn btn-primary" disabled>Check</button>`,
    quiz.hint ? `<button type="button" class="btn quiz-hint-btn" hidden>Hint</button>` : '',
    `<button type="button" class="btn quiz-retry" hidden>Try again</button></div>`,
    quiz.hint ? `<p class="quiz-hint" hidden>${inlineMarkdown(quiz.hint)}</p>` : '',
    `<div class="quiz-feedback" role="status" aria-live="polite"></div>`,
    `</form>`,
    `<details class="quiz-reveal"><summary>Show answer</summary><p><strong>Answer:</strong> ${answerText}</p>`,
    quiz.explain ? `<p>${inlineMarkdown(quiz.explain)}</p>` : '',
    `</details></div>`,
  ].join('');
}

export interface RemarkQuizOptions {
  /** Absolute path of the tutorials directory, used to derive page ids. */
  tutorialsDir: string;
}

/**
 * Astro renders only the markdown body, so node positions start after the
 * frontmatter. Returns how many lines of the file on disk precede the body.
 */
function bodyLineOffset(file: VFile): number {
  if (!file.path) return 0;
  let source: string;
  try {
    source = fs.readFileSync(file.path, 'utf8');
  } catch {
    return 0;
  }
  const at = source.indexOf(String(file.value));
  return at > 0 ? source.slice(0, at).split('\n').length - 1 : 0;
}

export function remarkQuiz({ tutorialsDir }: RemarkQuizOptions) {
  return (tree: Root, file: VFile) => {
    const rel = file.path ? path.relative(tutorialsDir, file.path) : '';
    const info = classifyContentPath(rel);
    const pageId = info?.kind === 'page' ? info.pageId : rel.replace(/\.md$/, '') || 'quiz';
    const seenIds = new Set<string>();
    let n = 0;

    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== 'quiz' || !parent || index === undefined) return;
      n += 1;
      let quiz: Quiz;
      try {
        quiz = parseQuiz(node.value, `${pageId}#${n}`);
      } catch (err) {
        if (!(err instanceof QuizError)) throw err;
        const where = file.path ? path.relative(process.cwd(), file.path) : 'markdown';
        const line = node.position ? ` (line ${node.position.start.line + bodyLineOffset(file)})` : '';
        file.fail(`Quiz #${n} in ${where}${line}: ${err.message}`, node);
      }
      if (seenIds.has(quiz.id)) file.fail(`Duplicate quiz id "${quiz.id}"`, node);
      seenIds.add(quiz.id);
      const html: Html = { type: 'html', value: renderQuiz(quiz) };
      parent.children[index] = html;
    });
  };
}
