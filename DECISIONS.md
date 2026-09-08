# Exam Platform — Design Decisions

A running record of all decisions made during requirements gathering.

---

## Platform Scope

- **Single teacher** with their own students (not a multi-tenant platform)
- Can expand to multi-teacher later if needed

## User Roles

- **Teacher**: one account, manages everything
- **Students**: accounts created by the teacher (username + temporary password)
- No self-registration for students

## Authentication

- **NextAuth.js** with credentials provider
- Teacher creates student accounts manually
- Deployed on **Render**

## Tech Stack

- **Next.js** (React) — frontend + API routes in one codebase
- **PostgreSQL** — relational database
- **Prisma ORM** — type-safe queries + migrations
- **NextAuth.js** — authentication
- **Render** — deployment

---

## Test Format

- Tests are uploaded as a **single combined JSON file** (questions + answers together)
- The system strips answers before sending questions to students
- LLM-generated JSON is the primary authoring workflow

### JSON Schema

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
        }
      ]
    }
  ]
}
```

### Question Types

| Type | `type` value | Auto-graded |
|---|---|---|
| Multiple choice (single) | `mcq` | Yes |
| Multiple choice (multi) | `multi_select` | Yes |
| Short / one-word answer | `short_answer` | Yes |
| Fill in the blank | `fill_blank` | Yes |
| Numeric / math | `numeric` | Yes |
| Written / long-form | `written` | No — teacher grades manually |

### Per-question Fields

- `marks` — marks awarded for correct answer
- `difficulty` — `easy`, `medium`, or `hard`
- `accepted` — optional list of accepted answer variants (case-insensitive)
- `tolerance` — for `numeric` type, acceptable margin of error (default: 0)
- LaTeX supported in question text: wrap in `$$...$$`

---

## Test Availability

- Teacher sets an optional **availability window** (`available_from` / `available_until`)
- Outside the window, students can see the test listed but cannot start it
- All published tests are visible to **all students** (no per-student assignment)

## Timer

- Countdown timer visible throughout the test
- Warnings at **10 minutes** and **1 minute** remaining
- Test **auto-submits** at 0:00 with whatever answers are filled in

## Attempts

- **One attempt per test** — no retakes
- Once submitted (or auto-submitted), student sees results immediately

## Grading

- Auto-graded question results shown **immediately** after submission
- Written answers show a **"pending"** flag until teacher manually grades them
- Teacher assigns marks (up to `marks` value) per written answer
- Final score published once all written answers are graded

### Grading Rules

- **mcq**: Full marks for correct option, 0 for wrong
- **multi_select**: Full marks only if all correct selected and no incorrect ones
- **short_answer / fill_blank**: Case-insensitive match against `answer` + `accepted` list
- **numeric**: Correct if `|student_answer - answer| <= tolerance`
- **written**: Teacher scores manually after submission

---

## Student Dashboard

- Overall cumulative score across all subjects
- Per-subject score breakdown
- Per-section score breakdown within each subject
- Per-difficulty breakdown (easy / medium / hard)
- Test history: date, score, status (graded / pending)

## Practice Mode

- Student can drill questions they previously answered **wrong**
- Untimed, ungraded
- Immediate feedback per answer ("Correct!" / "Wrong — the answer was X")
- Filtered by subject or section
- Only wrong answers shown (not unattempted questions)

---

## Teacher Dashboard

- Per-student scores across all tests
- Class averages per subject and section
- Question-level analytics: which questions had the lowest correct-answer rate
- Manual grading queue for written answers

---

## Still To Decide

- Test availability window: confirm whether teacher sets this at upload time or can change it later
