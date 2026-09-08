import { describe, it, expect } from 'vitest';
import { gradeQuestion } from '@/lib/modules/grading';
import { GradingStatus, QuestionType } from '@prisma/client';

describe('gradeQuestion', () => {
  describe('mcq', () => {
    it('awards full marks for correct option', () => {
      const r = gradeQuestion(QuestionType.mcq, 'B', 'B', null, null, 4);
      expect(r.marksAwarded).toBe(4);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_CORRECT);
    });

    it('awards 0 for wrong option', () => {
      const r = gradeQuestion(QuestionType.mcq, 'A', 'B', null, null, 4);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });
  });

  describe('multi_select', () => {
    it('awards full marks when all correct options selected and none wrong', () => {
      const r = gradeQuestion(QuestionType.multi_select, ['A', 'C'], ['A', 'C'], null, null, 3);
      expect(r.marksAwarded).toBe(3);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_CORRECT);
    });

    it('awards 0 when an incorrect option is included', () => {
      const r = gradeQuestion(QuestionType.multi_select, ['A', 'B', 'C'], ['A', 'C'], null, null, 3);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });

    it('awards 0 when a correct option is missing', () => {
      const r = gradeQuestion(QuestionType.multi_select, ['A'], ['A', 'C'], null, null, 3);
      expect(r.marksAwarded).toBe(0);
    });
  });

  describe('short_answer', () => {
    it('awards marks for exact case-insensitive match', () => {
      const r = gradeQuestion(QuestionType.short_answer, 'Paris', 'paris', [], null, 2);
      expect(r.marksAwarded).toBe(2);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_CORRECT);
    });

    it('awards marks for accepted variant', () => {
      const r = gradeQuestion(QuestionType.short_answer, 'france', 'paris', ['France', 'french capital'], null, 2);
      expect(r.marksAwarded).toBe(2);
    });

    it('awards 0 for wrong answer', () => {
      const r = gradeQuestion(QuestionType.short_answer, 'London', 'paris', [], null, 2);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });
  });

  describe('fill_blank', () => {
    it('matches case-insensitively', () => {
      const r = gradeQuestion(QuestionType.fill_blank, 'NEWTON', 'newton', null, null, 1);
      expect(r.marksAwarded).toBe(1);
    });
  });

  describe('numeric', () => {
    it('awards marks when within tolerance', () => {
      const r = gradeQuestion(QuestionType.numeric, 9.99, 10, null, 0.05, 5);
      expect(r.marksAwarded).toBe(5);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_CORRECT);
    });

    it('awards 0 when outside tolerance', () => {
      const r = gradeQuestion(QuestionType.numeric, 9.9, 10, null, 0.05, 5);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });

    it('awards marks for exact match with zero tolerance', () => {
      const r = gradeQuestion(QuestionType.numeric, 42, 42, null, 0, 5);
      expect(r.marksAwarded).toBe(5);
    });
  });

  describe('written', () => {
    it('marks as PENDING with 0 initial marks', () => {
      const r = gradeQuestion(QuestionType.written, 'some essay', null, null, null, 10);
      expect(r.gradingStatus).toBe(GradingStatus.PENDING);
      expect(r.marksAwarded).toBe(0);
    });
  });

  describe('empty / unanswered responses', () => {
    it('mcq: null response → AUTO_WRONG', () => {
      const r = gradeQuestion(QuestionType.mcq, null, 'B', null, null, 4);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });

    it('mcq: empty string → AUTO_WRONG', () => {
      const r = gradeQuestion(QuestionType.mcq, '', 'B', null, null, 4);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });

    it('multi_select: empty array → AUTO_WRONG', () => {
      const r = gradeQuestion(QuestionType.multi_select, [], ['A', 'C'], null, null, 3);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });

    it('short_answer: empty string → AUTO_WRONG', () => {
      const r = gradeQuestion(QuestionType.short_answer, '', 'paris', [], null, 2);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });

    it('numeric: null → AUTO_WRONG', () => {
      const r = gradeQuestion(QuestionType.numeric, null, 42, null, 0, 5);
      expect(r.marksAwarded).toBe(0);
      expect(r.gradingStatus).toBe(GradingStatus.AUTO_WRONG);
    });
  });
});
