'use client';

import { useEffect, useMemo, useState } from 'react';

const emptyRegistration = {
  companyName: '',
  registrationNumber: '',
  taxId: '',
  businessType: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  country: '',
  status: 'draft',
  submittedAt: null,
  reviewNotes: '',
};

const statusStyle = {
  draft: 'bg-paper text-ink-soft border-line',
  submitted: 'bg-teal-soft text-teal border-teal/30',
  approved: 'bg-[#e8f7ee] text-[#1f6f46] border-[#8ecaa9]',
  rejected: 'bg-[#fff1ef] text-rust border-[#f2b8b2]',
};

export default function CompanyRegistrationPage() {
  const [form, setForm] = useState(emptyRegistration);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const readOnly = form.status === 'approved';

  const statusLabel = useMemo(() => {
    const status = form.status || 'draft';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }, [form.status]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/company-registration');
      if (res.ok) {
        const data = await res.json();
        setForm({ ...emptyRegistration, ...data });
      }
      setLoading(false);
    }
    load();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveDraft(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const res = await fetch('/api/company-registration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to save draft.');
      return;
    }

    setForm({ ...emptyRegistration, ...data });
    setMessage('Draft saved.');
  }

  async function submitRegistration() {
    setSubmitting(true);
    setMessage('');
    setError('');

    const res = await fetch('/api/company-registration', { method: 'POST' });
    setSubmitting(false);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to submit registration.');
      return;
    }

    setForm({ ...emptyRegistration, ...data });
    setMessage('Registration submitted successfully.');
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Company registration</h1>
          <p className="text-sm text-ink-soft mt-1">
            Save draft details and submit your company for registration.
          </p>
        </div>
        <span
          className={`text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1 ${statusStyle[form.status || 'draft']}`}
        >
          {statusLabel}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading registration...</p>
      ) : (
        <form onSubmit={saveDraft} className="space-y-4 border border-line rounded-md bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Company name *
              </label>
              <input
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Registration number *
              </label>
              <input
                value={form.registrationNumber}
                onChange={(e) => updateField('registrationNumber', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Business type
              </label>
              <input
                value={form.businessType}
                onChange={(e) => updateField('businessType', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Tax ID
              </label>
              <input
                value={form.taxId}
                onChange={(e) => updateField('taxId', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Country *
              </label>
              <input
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Address *
              </label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
                disabled={readOnly}
              />
            </div>
          </div>

          {form.submittedAt && (
            <p className="text-xs text-ink-soft">Submitted on {new Date(form.submittedAt).toLocaleString()}</p>
          )}
          {form.reviewNotes && <p className="text-xs text-rust">Review notes: {form.reviewNotes}</p>}

          {error && <p className="text-sm text-rust">{error}</p>}
          {message && <p className="text-sm text-teal">{message}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || readOnly}
              className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={submitRegistration}
              disabled={submitting || readOnly}
              className="px-4 py-2 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal-soft disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
