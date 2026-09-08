import { z } from 'zod';

// Define Zod schemas for test data structures
const QuestionSchema = z.object({
  type: z.enum(['mcq', 'multi_select', 'short_answer', 'fill_blank', 'numeric', 'written']),
  text: z.string(),
  marks: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z.array(z.string()).optional(), // For mcq and multi_select
  answer: z.string().optional(), // For all except written
  answers: z.array(z.string()).optional(), // For multi_select
  accepted: z.array(z.string()).optional(), // For short_answer and fill_blank
  tolerance: z.number().optional(), // For numeric
});

const SectionSchema = z.object({
  name: z.string(),
  questions: z.array(QuestionSchema),
});

const TestSchema = z.object({
  subject: z.string(),
  title: z.string(),
  duration_minutes: z.number().int().positive(),
  sections: z.array(SectionSchema),
});

export type Test = z.infer<typeof TestSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Section = z.infer<typeof SectionSchema>;

export { TestSchema };