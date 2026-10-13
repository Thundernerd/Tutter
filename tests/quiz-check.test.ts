import { describe, expect, it } from 'vitest';
import { isCorrect } from '../src/lib/quiz-check';
import type { Quiz } from '../src/lib/remark/quiz';

describe('isCorrect', () => {
  const single: Quiz = { id: 's', type: 'single', question: '', options: ['a', 'b'], answer: 1 };
  const multiple: Quiz = { id: 'm', type: 'multiple', question: '', options: ['a', 'b', 'c'], answer: [0, 2] };
  const text: Quiz = { id: 't', type: 'text', question: '', answer: ['move_and_slide', 'move_and_slide()'] };

  it('checks single choice', () => {
    expect(isCorrect(single, 1)).toBe(true);
    expect(isCorrect(single, 0)).toBe(false);
  });

  it('requires exactly the right set for multiple choice', () => {
    expect(isCorrect(multiple, [2, 0])).toBe(true);
    expect(isCorrect(multiple, [0])).toBe(false);
    expect(isCorrect(multiple, [0, 1, 2])).toBe(false);
  });

  it('compares text answers case- and whitespace-insensitively', () => {
    expect(isCorrect(text, '  Move_And_Slide() ')).toBe(true);
    expect(isCorrect(text, 'move')).toBe(false);
  });
});
