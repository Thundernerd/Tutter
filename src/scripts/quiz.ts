/**
 * Hydrates `.quiz` blocks rendered by the remark quiz plugin and records
 * attempts in the progress store.
 */
import type { Quiz } from '../lib/remark/quiz';
import { getProgress } from '../lib/progress';
import { isCorrect } from '../lib/quiz-check';

function hydrate(root: HTMLElement) {
  const quiz = JSON.parse(root.dataset.quiz!) as Quiz;
  const form = root.querySelector<HTMLFormElement>('.quiz-form')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const retry = form.querySelector<HTMLButtonElement>('.quiz-retry')!;
  const hintButton = form.querySelector<HTMLButtonElement>('.quiz-hint-btn');
  const hint = form.querySelector<HTMLElement>('.quiz-hint');
  const feedback = form.querySelector<HTMLElement>('.quiz-feedback')!;
  const status = root.querySelector<HTMLElement>('.quiz-status')!;
  const reveal = root.querySelector<HTMLDetailsElement>('.quiz-reveal')!;
  const inputs = [...form.querySelectorAll<HTMLInputElement>('input')];
  const store = getProgress();

  root.classList.add('is-hydrated');
  reveal.hidden = true;
  if (hintButton && hint) {
    hintButton.hidden = false;
    hintButton.addEventListener('click', () => {
      hint.hidden = false;
      hintButton.hidden = true;
    });
  }

  const readAnswer = (): number | number[] | string | null => {
    if (quiz.type === 'text') {
      const value = inputs[0]!.value;
      return value.trim() ? value : null;
    }
    const checked = inputs.filter((i) => i.checked).map((i) => Number(i.value));
    if (quiz.type === 'single') return checked[0] ?? null;
    return checked.length ? checked : null;
  };

  const showStatus = () => {
    const saved = store.getQuiz(quiz.id);
    status.hidden = !saved;
    if (saved) {
      status.textContent = saved.correct ? '✓ Solved' : `${saved.attempts} attempt${saved.attempts === 1 ? '' : 's'}`;
      status.classList.toggle('is-correct', saved.correct);
    }
  };

  const reset = () => {
    root.classList.remove('is-correct', 'is-wrong');
    feedback.replaceChildren();
    for (const input of inputs) {
      input.disabled = false;
      input.closest('li')?.classList.remove('opt-correct', 'opt-wrong', 'opt-missed');
    }
    retry.hidden = true;
    submit.hidden = false;
    submit.disabled = readAnswer() === null;
  };

  form.addEventListener('input', () => {
    submit.disabled = readAnswer() === null;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = readAnswer();
    if (answer === null) return;
    const correct = isCorrect(quiz, answer);
    store.recordQuizAttempt(quiz.id, correct, answer);

    root.classList.toggle('is-correct', correct);
    root.classList.toggle('is-wrong', !correct);
    for (const input of inputs) input.disabled = true;

    if (quiz.type !== 'text') {
      const right = new Set(Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer]);
      for (const input of inputs) {
        const li = input.closest('li')!;
        const i = Number(input.value);
        // Only reveal which options were right once the learner got it.
        if (input.checked) li.classList.add(right.has(i) ? 'opt-correct' : 'opt-wrong');
        else if (correct && right.has(i)) li.classList.add('opt-missed');
      }
    }

    const message = document.createElement('p');
    message.className = 'quiz-message';
    message.textContent = correct ? 'Correct!' : 'Not quite.';
    feedback.replaceChildren(message);
    if (correct) {
      // The rendered explanation lives in the reveal block; show it inline.
      const explanation = reveal.querySelectorAll('p')[1];
      if (explanation) feedback.append(explanation.cloneNode(true));
    }

    submit.hidden = true;
    retry.hidden = correct;
    reveal.hidden = correct;
    showStatus();
  });

  retry.addEventListener('click', () => {
    if (quiz.type !== 'text') for (const input of inputs) input.checked = false;
    reset();
    (inputs[0] as HTMLElement | undefined)?.focus();
  });

  showStatus();
}

for (const el of document.querySelectorAll<HTMLElement>('.quiz:not(.is-hydrated)')) hydrate(el);
