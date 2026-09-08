'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KaTeXRenderer } from '@/components/KaTeXRenderer';
import { Timer } from '@/components/Timer';

interface Question {
  id: string;
  type: string;
  text: string;
  marks: number;
  difficulty: string;
  optionsJson?: string[];
}

interface Section {
  id: string;
  name: string;
  order: number;
  questions: Question[];
}

interface AttemptData {
  attemptId: string;
  startedAt: string;
  expiresAt: string;
  sections: Section[];
}

export default function TakeTestPage() {
  const { id: testId } = useParams<{ id: string }>();
  const router = useRouter();

  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submitCalled = useRef(false);

  useEffect(() => {
    async function start() {
      const startRes = await fetch(`/api/tests/${testId}/start`, { method: 'POST' });
      if (!startRes.ok) {
        const data = await startRes.json();
        setError(data.error ?? 'Cannot start test');
        return;
      }
      const { attemptId } = await startRes.json();

      const qRes = await fetch(`/api/attempts/${attemptId}/questions`);
      if (!qRes.ok) { setError('Failed to load questions'); return; }
      const data = await qRes.json();
      setAttemptData(data);
    }
    start();
  }, [testId]);

  const submit = useCallback(async (auto = false) => {
    if (submitCalled.current || !attemptData) return;
    submitCalled.current = true;
    setSubmitting(true);

    const payload = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
    const res = await fetch(`/api/attempts/${attemptData.attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: payload, autoSubmitted: auto }),
    });

    if (res.ok) {
      router.push(`/student/results/${attemptData.attemptId}`);
    } else {
      setSubmitting(false);
      submitCalled.current = false;
      setError('Submission failed. Please try again.');
    }
  }, [attemptData, answers, router]);

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((a) => ({ ...a, [questionId]: value }));
  }

  if (error) {
    return <div className="max-w-xl mx-auto mt-16 text-center text-red-600 text-lg">{error}</div>;
  }

  if (!attemptData) {
    return <div className="max-w-xl mx-auto mt-16 text-center text-gray-400">Starting test…</div>;
  }

  const sections = attemptData.sections;
  const section = sections[sectionIndex];
  const isLast = sectionIndex === sections.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Section {sectionIndex + 1} of {sections.length}: {section.name}</h1>
        <Timer expiresAt={attemptData.expiresAt} onExpire={() => submit(true)} />
      </div>

      <div className="space-y-6">
        {section.questions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Q{qi + 1} · {q.type.replace('_', ' ')} · {q.difficulty}</span>
              <span>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            </div>
            <p className="font-medium mb-3"><KaTeXRenderer text={q.text} /></p>
            <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          disabled={sectionIndex === 0}
          onClick={() => setSectionIndex((i) => i - 1)}
          className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-30"
        >
          Previous section
        </button>
        {isLast ? (
          <button
            disabled={submitting}
            onClick={() => submit(false)}
            className="bg-indigo-600 text-white px-6 py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit test'}
          </button>
        ) : (
          <button
            onClick={() => setSectionIndex((i) => i + 1)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Next section
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange }: { q: Question; value: unknown; onChange: (v: unknown) => void }) {
  if (q.type === 'mcq') {
    return (
      <div className="space-y-2">
        {(q.optionsJson ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={q.id} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
            <KaTeXRenderer text={opt} />
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'multi_select') {
    const selected = (value as string[]) ?? [];
    return (
      <div className="space-y-2">
        {(q.optionsJson ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter((s) => s !== opt));
              }}
            />
            <KaTeXRenderer text={opt} />
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'numeric') {
    return (
      <input
        type="number"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="border rounded px-3 py-2 w-48"
        placeholder="Enter a number"
      />
    );
  }
  if (q.type === 'written') {
    return (
      <textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full border rounded px-3 py-2 resize-y"
        placeholder="Write your answer here…"
      />
    );
  }
  // short_answer / fill_blank
  return (
    <input
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded px-3 py-2"
      placeholder="Type your answer…"
    />
  );
}
