'use client';

import { useEffect, useState } from 'react';

interface Student {
  id: string;
  username: string;
  mustChangePassword: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/users');
    if (res.ok) setStudents(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, temporaryPassword: newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      setNewUsername('');
      setNewPassword('');
      await load();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to create student');
    }
  }

  async function resetPassword(id: string) {
    const res = await fetch(`/api/users/${id}/reset-password`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setResetPasswords((p) => ({ ...p, [id]: data.temporaryPassword }));
    }
  }

  async function deleteStudent(id: string, username: string) {
    if (!confirm(`Delete student "${username}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok || res.status === 204) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Failed to delete student');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Students</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Create student account</h2>
        <form onSubmit={createStudent} className="flex gap-3 flex-wrap">
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username"
            required
            className="border rounded px-3 py-2 flex-1 min-w-32"
          />
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Temporary password"
            required
            minLength={6}
            className="border rounded px-3 py-2 flex-1 min-w-40"
          />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating…' : 'Create'}
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2">Username</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No students yet</td></tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{s.username}</td>
                <td className="px-4 py-2">
                  {s.mustChangePassword
                    ? <span className="text-orange-600 text-xs">Must change password</span>
                    : <span className="text-green-600 text-xs">Active</span>}
                </td>
                <td className="px-4 py-2 flex gap-3 items-center">
                  {resetPasswords[s.id] ? (
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      Temp pw: {resetPasswords[s.id]}
                    </span>
                  ) : (
                    <button
                      onClick={() => resetPassword(s.id)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Reset password
                    </button>
                  )}
                  <button
                    onClick={() => deleteStudent(s.id, s.username)}
                    disabled={deletingId === s.id}
                    className="text-red-600 hover:underline text-xs disabled:opacity-40"
                  >
                    {deletingId === s.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
