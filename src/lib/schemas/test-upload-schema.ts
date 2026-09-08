import { z } from 'zod';

// Normalise correct_answer → answer so LLM-generated JSONs work with either field name
const normaliseAnswer = (q: unknown) => {
  if (q && typeof q === 'object' && 'correct_answer' in q && !('answer' in q)) {
    const { correct_answer, ...rest } = q as Record<string, unknown>;
    return { ...rest, answer: correct_answer };
  }
  return q;
};

const QuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('mcq'),
    text: z.string().min(1),
    marks: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    options: z.array(z.string()).min(2),
    answer: z.string(),
    accepted: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('multi_select'),
    text: z.string().min(1),
    marks: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    options: z.array(z.string()).min(2),
    answer: z.array(z.string()),
    accepted: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('short_answer'),
    text: z.string().min(1),
    marks: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    answer: z.string(),
    accepted: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('fill_blank'),
    text: z.string().min(1),
    marks: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    answer: z.string(),
    accepted: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('numeric'),
    text: z.string().min(1),
    marks: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    answer: z.number(),
    tolerance: z.number().min(0).default(0),
  }),
  z.object({
    type: z.literal('written'),
    text: z.string().min(1),
    marks: z.number().int().positive(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }),
]);

const SectionSchema = z.object({
  name: z.string().min(1),
  questions: z.array(z.preprocess(normaliseAnswer, QuestionSchema)).min(1),
});

export const TestUploadSchema = z.object({
  subject: z.string().min(1),
  title: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  available_from: z.string().datetime().optional(),
  available_until: z.string().datetime().optional(),
  sections: z.array(SectionSchema).min(1),
});

export type TestUploadInput = z.infer<typeof TestUploadSchema>;
