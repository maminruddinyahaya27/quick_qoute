'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [quotationValidityDays, setQuotationValidityDays] = useState(30);
  const [quotationTermsAndConditions, setQuotationTermsAndConditions] = useState('');
  const [quotationHeaderEnabled, setQuotationHeaderEnabled] = useState(false);
  const [quotationHeaderTitle, setQuotationHeaderTitle] = useState('');
  const [quotationHeaderSubtitle, setQuotationHeaderSubtitle] = useState('');
  const [quotationHeaderNote, setQuotationHeaderNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setQuotationValidityDays(Number(data.quotationValidityDays || 0));
        setQuotationTermsAndConditions(data.quotationTermsAndConditions || '');
        setQuotationHeaderEnabled(Boolean(data.quotationHeader?.enabled));
        setQuotationHeaderTitle(data.quotationHeader?.title || '');
        setQuotationHeaderSubtitle(data.quotationHeader?.subtitle || '');
        setQuotationHeaderNote(data.quotationHeader?.note || '');
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationValidityDays: Number(quotationValidityDays) || 0,
        quotationTermsAndConditions,
        quotationHeader: {
          enabled: quotationHeaderEnabled,
          title: quotationHeaderTitle,
          subtitle: quotationHeaderSubtitle,
          note: quotationHeaderNote,
        },
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to save settings.');
      return;
    }
    setMessage('Quotation settings saved.');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
        <p className="text-sm text-ink-soft mt-1">
          Set defaults used when creating new quotations.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading settings...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 border border-line rounded-md bg-white p-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Quotation validity (days)
            </label>
            <input
              type="number"
              min="0"
              value={quotationValidityDays}
              onChange={(e) => setQuotationValidityDays(e.target.value)}
              className="w-40 border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Default terms and conditions
            </label>
            <textarea
              rows={7}
              value={quotationTermsAndConditions}
              onChange={(e) => setQuotationTermsAndConditions(e.target.value)}
              placeholder="Add your standard quotation terms and conditions"
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="border border-line rounded-md p-4 bg-paper/50 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Quotation header designer</h2>
              <p className="text-sm text-ink-soft mt-1">
                Customize the header block shown at the top of quotation PDFs.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={quotationHeaderEnabled}
                onChange={(e) => setQuotationHeaderEnabled(e.target.checked)}
              />
              Enable custom quotation header
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  Header title
                </label>
                <input
                  value={quotationHeaderTitle}
                  onChange={(e) => setQuotationHeaderTitle(e.target.value)}
                  placeholder="Example: Project Proposal"
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  Header subtitle
                </label>
                <input
                  value={quotationHeaderSubtitle}
                  onChange={(e) => setQuotationHeaderSubtitle(e.target.value)}
                  placeholder="Example: Website Development Services"
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  Header note
                </label>
                <textarea
                  rows={3}
                  value={quotationHeaderNote}
                  onChange={(e) => setQuotationHeaderNote(e.target.value)}
                  placeholder="Example: Valid for 30 days from issue date"
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}
          {message && <p className="text-sm text-teal">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </form>
      )}
    </div>
  );
}
