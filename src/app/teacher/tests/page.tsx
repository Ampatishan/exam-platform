'use client';

import { useEffect, useRef, useState } from 'react';

interface QuestionItem {
  id: string;
  type: string;
  text: string;
  marks: number;
  difficulty: string;
  optionsJson: unknown;
  answerJson: unknown;
  order: number;
}

interface SectionItem {
  id: string;
  name: string;
  order: number;
  questions: QuestionItem[];
}

interface TestDetail {
  id: string;
  subject: string;
  title: string;
  durationMinutes: number;
  publishedAt: string;
  availableFrom: string | null;
  availableUntil: string | null;
  sections: SectionItem[];
}

interface TestItem {
  id: string;
  subject: string;
  title: string;
  durationMinutes: number;
  publishedAt: string;
  attemptCount: number;
  availableFrom: string | null;
  availableUntil: string | null;
}

interface Student {
  id: string;
  username: string;
}

export default function TeacherTestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [viewingTest, setViewingTest] = useState<TestDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'students'>('questions');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [testsRes, studentsRes] = await Promise.all([
      fetch('/api/tests'),
      fetch('/api/users'),
    ]);
    if (testsRes.ok) setTests(await testsRes.json());
    if (studentsRes.ok) setStudents(await studentsRes.json());
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/tests/upload', { method: 'POST', body: formData });
    setUploading(false);

    if (res.ok) {
      const data = await res.json();
      setUploadSuccess(`Test uploaded successfully (ID: ${data.testId})`);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } else {
      const data = await res.json();
      if (data.details) {
        setUploadError(data.details.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('\n'));
      } else {
        setUploadError(data.error ?? 'Upload failed');
      }
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok || res.status === 204) {
      if (viewingTest?.id === id) setViewingTest(null);
      setTests((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert('Failed to delete test');
    }
  }

  async function handleView(id: string) {
    if (viewingTest?.id === id) {
      setViewingTest(null);
      return;
    }
    setLoadingDetail(id);
    const [detailRes, assignRes] = await Promise.all([
      fetch(`/api/tests/${id}`),
      fetch(`/api/tests/${id}/assignments`),
    ]);
    setLoadingDetail(null);
    if (detailRes.ok) setViewingTest(await detailRes.json());
    if (assignRes.ok) {
      const data = await assignRes.json();
      setAssignedIds(new Set(data.userIds));
    }
    setActiveTab('questions');
  }

  async function toggleAssignment(userId: string) {
    if (!viewingTest) return;
    const next = new Set(assignedIds);
    if (next.has(userId)) next.delete(userId); else next.add(userId);
    setAssignedIds(next);
    setAssignmentSaving(true);
    await fetch(`/api/tests/${viewingTest.id}/assignments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [...next] }),
    });
    setAssignmentSaving(false);
    await load();
  }

  const totalMarks = (sections: SectionItem[]) =>
    sections.flatMap(s => s.questions).reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Tests</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-3">Upload test (JSON)</h2>
        <form onSubmit={handleUpload} className="flex gap-3 items-center flex-wrap">
          <input type="file" accept=".json" ref={fileRef} required className="text-sm" />
          <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
        {uploadSuccess && <p className="text-green-600 text-sm mt-2">{uploadSuccess}</p>}
        {uploadError && <pre className="text-red-600 text-xs mt-2 whitespace-pre-wrap">{uploadError}</pre>}
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer">JSON schema reference</summary>
          <pre className="text-xs bg-gray-50 rounded p-3 mt-2 overflow-x-auto">{JSON.stringify({
            subject: "string",
            title: "string",
            duration_minutes: "number",
            available_from: "ISO datetime (optional)",
            available_until: "ISO datetime (optional)",
            sections: [{ name: "string", questions: [{ type: "mcq|multi_select|short_answer|fill_blank|numeric|written", text: "string", marks: "number", difficulty: "easy|medium|hard", "...type-specific fields": "..." }] }]
          }, null, 2)}</pre>
        </details>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Subject</th>
              <th className="text-left px-4 py-2">Duration</th>
              <th className="text-left px-4 py-2">Attempts</th>
              <th className="text-left px-4 py-2">Window</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No tests yet</td></tr>
            )}
            {tests.map((t) => (
              <>
                <tr key={t.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{t.title}</td>
                  <td className="px-4 py-2">{t.subject}</td>
                  <td className="px-4 py-2">{t.durationMinutes} min</td>
                  <td className="px-4 py-2">{t.attemptCount}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {t.availableFrom || t.availableUntil
                      ? `${t.availableFrom ? new Date(t.availableFrom).toLocaleDateString() : '—'} → ${t.availableUntil ? new Date(t.availableUntil).toLocaleDateString() : '—'}`
                      : 'Always open'}
                  </td>
                  <td className="px-4 py-2 text-right flex gap-3 justify-end items-center">
                    <button
                      onClick={() => handleView(t.id)}
                      disabled={loadingDetail === t.id}
                      className="text-blue-600 hover:underline text-xs disabled:opacity-50"
                    >
                      {loadingDetail === t.id ? 'Loading…' : viewingTest?.id === t.id ? 'Hide' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.title)}
                      disabled={deletingId === t.id}
                      className="text-red-600 hover:underline text-xs disabled:opacity-40"
                    >
                      {deletingId === t.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
                {viewingTest?.id === t.id && (
                  <tr key={`${t.id}-detail`} className="bg-gray-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="flex gap-4 text-xs text-gray-500 mb-3">
                        <span>{viewingTest.sections.length} section{viewingTest.sections.length !== 1 ? 's' : ''}</span>
                        <span>{viewingTest.sections.flatMap(s => s.questions).length} questions</span>
                        <span>{totalMarks(viewingTest.sections)} total marks</span>
                      </div>

                      <div className="flex gap-0 mb-4 border-b">
                        <button
                          onClick={() => setActiveTab('questions')}
                          className={`px-4 py-1.5 text-sm font-medium border-b-2 -mb-px ${activeTab === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                          Questions
                        </button>
                        <button
                          onClick={() => setActiveTab('students')}
                          className={`px-4 py-1.5 text-sm font-medium border-b-2 -mb-px ${activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                          Students {assignedIds.size > 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-700 rounded-full px-1.5">{assignedIds.size}</span>}
                        </button>
                      </div>

                      {activeTab === 'questions' && (
                        <div className="space-y-4">
                          {viewingTest.sections.map((section) => (
                            <div key={section.id}>
                              <h3 className="font-semibold text-sm mb-2">{section.name}</h3>
                              <ol className="space-y-3">
                                {section.questions.map((q, qi) => (
                                  <li key={q.id} className="text-sm border-l-2 border-blue-200 pl-3">
                                    <div className="flex gap-2 items-start">
                                      <span className="text-gray-400 text-xs mt-0.5 shrink-0">{qi + 1}.</span>
                                      <div className="flex-1">
                                        <p className="text-gray-800">{q.text}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                          <span className="capitalize">{q.type.replace('_', ' ')}</span>
                                          <span>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                          <span className="capitalize">{q.difficulty}</span>
                                        </div>
                                        {Array.isArray(q.optionsJson) && (
                                          <ul className="mt-1 space-y-0.5">
                                            {(q.optionsJson as string[]).map((opt, oi) => (
                                              <li key={oi} className="text-xs text-gray-600">
                                                {String.fromCharCode(65 + oi)}. {opt}
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                        {q.answerJson != null && (
                                          <p className="text-xs text-green-700 mt-1">
                                            Answer: {Array.isArray(q.answerJson)
                                              ? (q.answerJson as string[]).join(', ')
                                              : String(q.answerJson as string | number | boolean)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'students' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-gray-500">Check students who should have access to this test.</p>
                            {assignmentSaving && <span className="text-xs text-gray-400">Saving…</span>}
                          </div>
                          {students.length === 0 ? (
                            <p className="text-sm text-gray-400">No students created yet.</p>
                          ) : (
                            <div className="space-y-1">
                              {students.map((s) => (
                                <label key={s.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-100 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={assignedIds.has(s.id)}
                                    onChange={() => toggleAssignment(s.id)}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{s.username}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
