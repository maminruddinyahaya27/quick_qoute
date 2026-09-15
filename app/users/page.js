'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadUsers() {
    setLoading(true);
    const response = await fetch('/api/users');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Unable to load users.');
      setLoading(false);
      return;
    }
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function resetPassword(userId) {
    const newPassword = passwords[userId] || '';
    setMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSavingId(userId);
    const response = await fetch(`/api/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    setSavingId('');

    if (!response.ok) {
      setError(data.error || 'Unable to update password.');
      return;
    }

    setPasswords((current) => ({ ...current, [userId]: '' }));
    setMessage(`Password updated for ${data.user.email}.`);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Users</h1>
        <p className="text-sm text-ink-soft mt-1">Manage user access and reset passwords.</p>
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}

      {loading ? (
        <p className="text-sm text-ink-soft">Loading users...</p>
      ) : (
        <div className="border border-line rounded-md bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-paper text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink">Name</th>
                  <th className="px-4 py-3 font-semibold text-ink">Email</th>
                  <th className="px-4 py-3 font-semibold text-ink">Role</th>
                  <th className="px-4 py-3 font-semibold text-ink">New password</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 text-ink">{user.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{user.email}</td>
                    <td className="px-4 py-3 text-ink-soft">{user.role}</td>
                    <td className="px-4 py-3">
                      <input
                        type="password"
                        value={passwords[user.id] || ''}
                        onChange={(event) =>
                          setPasswords((current) => ({ ...current, [user.id]: event.target.value }))
                        }
                        placeholder="At least 6 characters"
                        className="w-full min-w-44 border border-line rounded-md px-3 py-2 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => resetPassword(user.id)}
                        disabled={savingId === user.id}
                        className="whitespace-nowrap px-3 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
                      >
                        {savingId === user.id ? 'Saving...' : 'Update password'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
