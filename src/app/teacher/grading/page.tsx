'use client';

import { useEffect, useState } from 'react';
import { KaTeXRenderer } from '@/components/KaTeXRenderer';

interface QueueItem {
  answerId: string;
  questionText: string;
  maxMarks: number;
  studentResponse: unknown;
  studentName: string;
  testTitle: string;
  submittedAt: string;
}

export default function GradingPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch('/api/grading/queue');
    if (res.ok) setQueue(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function grade(answerId: string, maxMarks: number) {
    const mark = parseFloat(marks[answerId] ?? '');
    if (isNaN(mark) || mark < 0 || mark > maxMarks) {
      setErrors((e) => ({ ...e, [answerId]: `Enter a number between 0 and ${maxMarks}` }));
      return;
    }

    const res = await fetch(`/api/grading/${answerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marksAwarded: mark }),
    });

    if (res.ok) {
      setSubmitted((s) => new Set(s).add(answerId));
      setErrors((e) => { const n = { ...e }; delete n[answerId]; return n; });
      await load();
    } else {
      const data = await res.json();
      setErrors((e) => ({ ...e, [answerId]: data.error ?? 'Failed' }));
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Grading Queue</h1>
      {queue.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          No answers pending grading
        </div>
      )}
      {queue.map((item) => (
        <div key={item.answerId} className="bg-white rounded-lg shadow p-6 space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{item.studentName} — {item.testTitle}</span>
            <span>Max: {item.maxMarks} marks</span>
          </div>
          <div className="font-medium">
            <KaTeXRenderer text={item.questionText} />
          </div>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <span className="text-gray-500 text-xs uppercase tracking-wide">Student answer</span>
            <p className="mt-1">{String(item.studentResponse)}</p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={0}
              max={item.maxMarks}
              step="0.5"
              value={marks[item.answerId] ?? ''}
              onChange={(e) => setMarks((m) => ({ ...m, [item.answerId]: e.target.value }))}
              placeholder={`0–${item.maxMarks}`}
              className="border rounded px-3 py-1 w-24 text-sm"
            />
            <button
              onClick={() => grade(item.answerId, item.maxMarks)}
              className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
            >
              Submit grade
            </button>
            {errors[item.answerId] && <span className="text-red-600 text-xs">{errors[item.answerId]}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
