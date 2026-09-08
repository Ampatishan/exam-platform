import { describe, it, expect } from 'vitest';
import { parseAndValidate } from '@/lib/modules/test-ingestion';
import { toStudentQuestion } from '@/lib/modules/test-ingestion';

const validTest = {
  subject: 'Mathematics',
  title: 'Algebra Mid-Term',
  duration_minutes: 60,
  sections: [
    {
      name: 'Quadratic Equations',
      questions: [
        {
          type: 'mcq',
          text: 'What is the solution to $$x^2 - 5x + 6 = 0$$?',
          marks: 2,
          difficulty: 'medium',
          options: ['x=2,3', 'x=1,6', 'x=-2,-3', 'x=0,5'],
          answer: 'x=2,3',
        },
        {
          type: 'written',
          text: 'Explain the quadratic formula.',
          marks: 5,
          difficulty: 'hard',
        },
      ],
    },
  ],
};

describe('parseAndValidate', () => {
  it('accepts valid test JSON', () => {
    expect(() => parseAndValidate(validTest)).not.toThrow();
  });

  it('rejects negative duration', () => {
    expect(() => parseAndValidate({ ...validTest, duration_minutes: -1 })).toThrow();
  });

  it('rejects empty sections', () => {
    expect(() => parseAndValidate({ ...validTest, sections: [] })).toThrow();
  });

  it('rejects mcq without options', () => {
    const bad = {
      ...validTest,
      sections: [{ name: 'S', questions: [{ type: 'mcq', text: 'Q', marks: 1, difficulty: 'easy' }] }],
    };
    expect(() => parseAndValidate(bad)).toThrow();
  });

  it('accepts written question without answer field', () => {
    const written = {
      ...validTest,
      sections: [{ name: 'S', questions: [{ type: 'written', text: 'Essay', marks: 5, difficulty: 'hard' }] }],
    };
    expect(() => parseAndValidate(written)).not.toThrow();
  });
});

describe('toStudentQuestion', () => {
  it('strips answerJson, acceptedJson, tolerance from a question record', () => {
    const q = {
      id: '1',
      sectionId: 's1',
      type: 'mcq' as any,
      text: 'What?',
      marks: 2,
      difficulty: 'easy' as any,
      optionsJson: ['A', 'B'],
      answerJson: 'A',
      acceptedJson: null,
      tolerance: null,
      order: 0,
    };
    const stripped = toStudentQuestion(q);
    expect(stripped).not.toHaveProperty('answerJson');
    expect(stripped).not.toHaveProperty('acceptedJson');
    expect(stripped).not.toHaveProperty('tolerance');
    expect(stripped).toHaveProperty('id');
    expect(stripped).toHaveProperty('optionsJson');
  });
});
