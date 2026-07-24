'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Authentication failed.');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md border border-line rounded-lg bg-white p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {mode === 'login' ? 'Login' : 'Create account'}
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            {mode === 'login'
              ? 'Sign in to access your quotations and invoices.'
              : 'Create an account to start using your own workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="text-sm text-teal hover:underline"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}
