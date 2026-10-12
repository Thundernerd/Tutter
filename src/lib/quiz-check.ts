import type { Quiz } from './remark/quiz';

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function isCorrect(quiz: Quiz, answer: number | number[] | string): boolean {
  switch (quiz.type) {
    case 'single':
      return answer === quiz.answer;
    case 'multiple': {
      const picked = [...(answer as number[])].sort((a, b) => a - b);
      return picked.length === quiz.answer.length && picked.every((v, i) => v === quiz.answer[i]);
    }
    case 'text':
      return quiz.answer.some((a) => normalize(a) === normalize(String(answer)));
  }
}
