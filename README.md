# Exam Platform

An online examination platform with teacher and student roles.

## Test JSON Format

Each test is uploaded as a single JSON file. The system separates answers from the student-facing questions internally.

### Schema

```json
{
  "subject": "Mathematics",
  "title": "Algebra Mid-Term",
  "duration_minutes": 60,
  "sections": [
    {
      "name": "Quadratic Equations",
      "questions": [
        {
          "type": "mcq",
          "text": "What is the solution to x² - 5x + 6 = 0?",
          "marks": 2,
          "difficulty": "medium",
          "options": ["x=2,3", "x=1,6", "x=-2,-3", "x=0,5"],
          "answer": "x=2,3"
        },
        {
          "type": "multi_select",
          "text": "Which of the following are prime numbers?",
          "marks": 2,
          "difficulty": "easy",
          "options": ["2", "4", "7", "9"],
          "answers": ["2", "7"]
        },
        {
          "type": "short_answer",
          "text": "What is the capital of France?",
          "marks": 1,
          "difficulty": "easy",
          "answer": "Paris",
          "accepted": ["paris", "PARIS"]
        },
        {
          "type": "fill_blank",
          "text": "The speed of light is approximately ___ km/s.",
          "marks": 1,
          "difficulty": "medium",
          "answer": "300000",
          "accepted": ["3×10^5", "3x10^5", "300,000"]
        },
        {
          "type": "numeric",
          "text": "Solve: 3x = 9. Enter the value of x.",
          "marks": 2,
          "difficulty": "easy",
          "answer": 3,
          "tolerance": 0
        },
        {
          "type": "written",
          "text": "Explain Newton's second law of motion and give an example.",
          "marks": 5,
          "difficulty": "hard"
        }
      ]
    }
  ]
}
```

### Question Types

| Type | `type` value | Auto-graded | Notes |
|---|---|---|---|
| Multiple choice (single) | `mcq` | Yes | One correct option from `options` list |
| Multiple choice (multi) | `multi_select` | Yes | Multiple correct options in `answers` list |
| Short / one-word answer | `short_answer` | Yes | Case-insensitive match; add synonyms in `accepted` |
| Fill in the blank | `fill_blank` | Yes | Case-insensitive; add variants in `accepted` |
| Numeric / math | `numeric` | Yes | Numeric comparison with optional `tolerance` (default 0) |
| Written / long-form | `written` | No — teacher grades manually | No `answer` field; teacher scores after submission |

### Field Reference

| Field | Required | Description |
|---|---|---|
| `subject` | Yes | Subject name (e.g., "Mathematics", "Physics") |
| `title` | Yes | Test title |
| `duration_minutes` | Yes | Total time allowed; test auto-submits at expiry |
| `sections[].name` | Yes | Section/topic name within the subject |
| `questions[].type` | Yes | One of: `mcq`, `multi_select`, `short_answer`, `fill_blank`, `numeric`, `written` |
| `questions[].text` | Yes | Question text (supports LaTeX for math: wrap in `$$...$$`) |
| `questions[].marks` | Yes | Marks awarded for a correct answer |
| `questions[].difficulty` | Yes | One of: `easy`, `medium`, `hard` |
| `questions[].options` | For `mcq`, `multi_select` | List of answer choices |
| `questions[].answer` | For all except `written` | The correct answer |
| `questions[].answers` | For `multi_select` | List of all correct answers |
| `questions[].accepted` | Optional | Additional accepted answer variants (case-insensitive) |
| `questions[].tolerance` | For `numeric` | Acceptable margin of error (default: `0`) |

### LaTeX in Questions

Wrap math expressions in `$$...$$` for inline rendering:

```json
{
  "type": "numeric",
  "text": "Solve: $$3x^2 - 5x + 2 = 0$$. Enter the smaller root.",
  "marks": 3,
  "difficulty": "hard",
  "answer": 0.667,
  "tolerance": 0.01
}
```

### Grading Rules

- **mcq**: Full marks for correct option, 0 for wrong.
- **multi_select**: Full marks only if all correct options selected and no incorrect ones.
- **short_answer / fill_blank**: Case-insensitive exact match against `answer` and `accepted` list.
- **numeric**: Correct if `|student_answer - answer| <= tolerance`.
- **written**: Held as pending; teacher assigns marks up to `marks` value manually.

### Timer Behaviour

- Countdown timer is visible throughout the test.
- Warnings shown at 10 minutes and 1 minute remaining.
- Test auto-submits at 0:00 with whatever answers are filled in.
