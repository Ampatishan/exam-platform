'use client';

import { useEffect, useState, useCallback } from 'react';
import { KaTeXRenderer } from '@/components/KaTeXRenderer';

interface PracticeQuestion {
  id: string;
  type: string;
  text: string;
  marks: number;
  difficulty: string;
  options?: string[];
  answer: unknown;
  accepted?: string[];
  tolerance?: number;
  subject: string;
  sectionName: string;
}

export default function PracticePage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [feedback, setFeedback] = useState<Record<string, { correct: boolean; correctAnswer: unknown }>>({});
  const [subjects, setSubjects] = useState<string[]>([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (section) params.set('section', section);
    const res = await fetch(`/api/practice/questions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
      const uniqueSubjects = [...new Set<string>(data.questions.map((q: PracticeQuestion) => q.subject))];
      setSubjects(uniqueSubjects);
    }
  }, [subject, section]);

  useEffect(() => { load(); }, [load]);

  async function check(questionId: string) {
    const response = answers[questionId];
    const res = await fetch('/api/practice/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, response }),
    });
    if (res.ok) {
      const data = await res.json();
      setFeedback((f) => ({ ...f, [questionId]: data }));
    }
  }

  function setAnswer(id: string, val: unknown) {
    setAnswers((a) => ({ ...a, [id]: val }));
    setFeedback((f) => { const n = { ...f }; delete n[id]; return n; });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Practice Mode</h1>
      <p className="text-sm text-gray-500">Questions you previously answered incorrectly. No timer, no grade.</p>

      <div className="flex gap-3 flex-wrap">
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setSection(''); }} className="border rounded px-3 py-2 text-sm">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="Filter by section name"
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {questions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          No practice questions. Answer some tests first — wrong answers will appear here.
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q) => {
          const fb = feedback[q.id];
          return (
            <div key={q.id} className="bg-white rounded-lg shadow p-5 space-y-3">
              <div className="text-xs text-gray-400">{q.subject} · {q.sectionName} · {q.difficulty}</div>
              <p className="font-medium"><KaTeXRenderer text={q.text} /></p>
              <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
              <button
                onClick={() => check(q.id)}
                className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700"
              >
                Check answer
              </button>
              {fb && (
                <div className={`text-sm font-medium ${fb.correct ? 'text-green-600' : 'text-red-600'}`}>
                  {fb.correct ? 'Correct!' : `Wrong — the answer was: ${String(fb.correctAnswer)}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange }: { q: PracticeQuestion; value: unknown; onChange: (v: unknown) => void }) {
  if (q.type === 'mcq') {
    return (
      <div className="space-y-1">
        {(q.options ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name={`p-${q.id}`} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
            <KaTeXRenderer text={opt} />
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'multi_select') {
    const selected = (value as string[]) ?? [];
    return (
      <div className="space-y-1">
        {(q.options ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={selected.includes(opt)} onChange={(e) => {
              onChange(e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt));
            }} />
            <KaTeXRenderer text={opt} />
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'numeric') {
    return <input type="number" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="border rounded px-3 py-2 w-48 text-sm" placeholder="Number" />;
  }
  return <input type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Your answer" />;
}
