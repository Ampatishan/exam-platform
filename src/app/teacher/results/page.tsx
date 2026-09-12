'use client';

import { useEffect, useState } from 'react';

interface TestOption {
  id: string;
  title: string;
  subject: string;
}

interface AnswerItem {
  answerId: string;
  questionText: string;
  questionType: string;
  maxMarks: number;
  optionsJson: unknown;
  correctAnswer: unknown;
  section: string;
  response: unknown;
  marksAwarded: number | null;
  gradingStatus: string;
}

interface AttemptResult {
  attemptId: string;
  student: { id: string; username: string };
  startedAt: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  totalMarks: number;
  earnedMarks: number;
  answers: AnswerItem[];
}

function statusColor(status: string) {
  if (status === 'AUTO_CORRECT') return 'text-green-600';
  if (status === 'AUTO_WRONG') return 'text-red-500';
  if (status === 'MANUALLY_GRADED') return 'text-blue-600';
  return 'text-orange-500';
}

function formatResponse(response: unknown, type: string, options: unknown): string {
  if (response === null || response === undefined) return '—';
  if (type === 'mcq' && Array.isArray(options) && typeof response === 'number') {
    return `${String.fromCharCode(65 + response)}. ${(options as string[])[response] ?? response}`;
  }
  if (type === 'multi_select' && Array.isArray(response) && Array.isArray(options)) {
    return (response as number[])
      .map((i) => `${String.fromCharCode(65 + i)}. ${(options as string[])[i] ?? i}`)
      .join(', ');
  }
  if (Array.isArray(response)) return (response as unknown[]).join(', ');
  return String(response);
}

function formatAnswer(answer: unknown, type: string, options: unknown): string {
  if (answer === null || answer === undefined) return '—';
  if (type === 'mcq' && Array.isArray(options) && typeof answer === 'number') {
    return `${String.fromCharCode(65 + answer)}. ${(options as string[])[answer] ?? answer}`;
  }
  if (Array.isArray(answer)) return (answer as unknown[]).join(', ');
  return String(answer);
}

export default function TeacherResultsPage() {
  const [tests, setTests] = useState<TestOption[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tests').then((r) => r.json()).then(setTests);
  }, []);

  async function loadResults(testId: string) {
    if (!testId) { setResults([]); return; }
    setLoading(true);
    setExpandedId(null);
    const res = await fetch(`/api/tests/${testId}/results`);
    setLoading(false);
    if (res.ok) setResults(await res.json());
  }

  function handleSelect(id: string) {
    setSelectedTestId(id);
    loadResults(id);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Student Results</h1>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="text-sm font-medium text-gray-700 mr-3">Select test</label>
        <select
          value={selectedTestId}
          onChange={(e) => handleSelect(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">— choose a test —</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>{t.title} ({t.subject})</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && selectedTestId && results.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No submissions yet</div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2">Student</th>
                <th className="text-left px-4 py-2">Submitted</th>
                <th className="text-left px-4 py-2">Score</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <>
                  <tr key={r.attemptId} className="border-b">
                    <td className="px-4 py-2 font-medium">{r.student.username}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleString()
                        : <span className="text-orange-500">In progress</span>}
                      {r.autoSubmitted && <span className="ml-1 text-gray-400">(auto)</span>}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-medium">{r.earnedMarks}</span>
                      <span className="text-gray-400"> / {r.totalMarks}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === r.attemptId ? null : r.attemptId)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {expandedId === r.attemptId ? 'Hide' : 'View answers'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.attemptId && (
                    <tr key={`${r.attemptId}-detail`} className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="space-y-3">
                          {r.answers.map((a, i) => (
                            <div key={a.answerId} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-400 mb-0.5">{a.section} · Q{i + 1}</p>
                                  <p className="text-sm font-medium text-gray-800">{a.questionText}</p>
                                  <div className="mt-1 space-y-1">
                                    {Array.isArray(a.optionsJson) && (
                                      <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                                        {(a.optionsJson as string[]).map((opt, oi) => (
                                          <li key={oi}>{String.fromCharCode(65 + oi)}. {opt}</li>
                                        ))}
                                      </ul>
                                    )}
                                    <p className="text-xs">
                                      <span className="text-gray-400">Student answer: </span>
                                      <span className="font-medium text-gray-800">
                                        {formatResponse(a.response, a.questionType, a.optionsJson)}
                                      </span>
                                    </p>
                                    {a.correctAnswer != null && (
                                      <p className="text-xs">
                                        <span className="text-gray-400">Correct answer: </span>
                                        <span className="text-green-700 font-medium">
                                          {formatAnswer(a.correctAnswer, a.questionType, a.optionsJson)}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-medium">
                                    {a.marksAwarded ?? '—'} / {a.maxMarks}
                                  </p>
                                  <p className={`text-xs ${statusColor(a.gradingStatus)}`}>
                                    {a.gradingStatus.replace('_', ' ').toLowerCase()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
