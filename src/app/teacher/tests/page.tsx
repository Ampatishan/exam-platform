'use client';

import { useEffect, useRef, useState } from 'react';

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

export default function TeacherTestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch('/api/tests');
    if (res.ok) setTests(await res.json());
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
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No tests yet</td></tr>
            )}
            {tests.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{t.title}</td>
                <td className="px-4 py-2">{t.subject}</td>
                <td className="px-4 py-2">{t.durationMinutes} min</td>
                <td className="px-4 py-2">{t.attemptCount}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {t.availableFrom || t.availableUntil
                    ? `${t.availableFrom ? new Date(t.availableFrom).toLocaleDateString() : '—'} → ${t.availableUntil ? new Date(t.availableUntil).toLocaleDateString() : '—'}`
                    : 'Always open'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
