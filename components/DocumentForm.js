'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { computeTotals, formatMoney } from '@/lib/calc';

const emptyItem = () => ({ description: '', quantity: 1, rate: 0 });

const emptyAddress = {
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  postcode: '',
  city: '',
  state: '',
  country: '',
};

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DocumentForm({ type, documentId }) {
  const router = useRouter();
  const isEdit = Boolean(documentId);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    companyRegistrationNumber: '',
    email: '',
    phone: '',
    ...emptyAddress,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingDocument, setLoadingDocument] = useState(isEdit);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        setClients(data);
        if (data.length && !clientId) setClientId(data[0]._id);
      });

    if (isEdit) return;

    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (type === 'quotation') {
          const validityDays = Number(data.quotationValidityDays || 0);
          if (!dueDate && validityDays > 0) {
            const base = new Date();
            base.setDate(base.getDate() + validityDays);
            setDueDate(toDateInputValue(base));
          }
          if (!termsAndConditions && data.quotationTermsAndConditions) {
            setTermsAndConditions(data.quotationTermsAndConditions);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !documentId) return;

    fetch(`/api/documents/${documentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => {
        if (!doc) return;

        setClientId(doc.client?._id || doc.client || '');
        setItems(
          (doc.items || []).map((it) => ({
            description: it.description || '',
            quantity: Number(it.quantity) || 0,
            rate: Number(it.rate) || 0,
          }))
        );
        setTaxRate(Number(doc.taxRate) || 0);
        setDiscount(Number(doc.discount) || 0);
        setNotes(doc.notes || '');
        setTermsAndConditions(doc.termsAndConditions || '');
        setDueDate(doc.dueDate ? toDateInputValue(new Date(doc.dueDate)) : '');
      })
      .finally(() => setLoadingDocument(false));
  }, [documentId, isEdit]);

  const totals = useMemo(() => computeTotals(items, taxRate, discount), [items, taxRate, discount]);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function createClient() {
    if (!newClient.name.trim()) return;
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    });
    const created = await res.json();
    setClients((prev) => [created, ...prev]);
    setClientId(created._id);
    setShowNewClient(false);
    setNewClient({
      name: '',
      company: '',
      companyRegistrationNumber: '',
      email: '',
      phone: '',
      ...emptyAddress,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Please select or add a client.');
      return;
    }
    const cleanItems = items.filter((it) => it.description.trim());
    if (!cleanItems.length) {
      setError('Add at least one line item with a description.');
      return;
    }

    setSaving(true);
    const res = await fetch(isEdit ? `/api/documents/${documentId}` : '/api/documents', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        client: clientId,
        items: cleanItems,
        taxRate: Number(taxRate) || 0,
        discount: Number(discount) || 0,
        notes,
        termsAndConditions: type === 'quotation' ? termsAndConditions : '',
        dueDate: dueDate || undefined,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong.');
      return;
    }

    const created = await res.json();
    router.push(`/${type}s/${created._id}`);
  }

  const label = type === 'invoice' ? 'Invoice' : 'Quotation';

  if (loadingDocument) {
    return <p className="text-ink-soft text-sm">Loading document...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
            Client
          </label>
          <div className="flex gap-2">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-white text-sm"
            >
              {!clients.length && <option value="">No clients yet</option>}
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.company ? `— ${c.company}` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewClient((s) => !s)}
              className="whitespace-nowrap px-3 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-teal-soft hover:text-teal hover:border-teal transition-colors"
            >
              + New client
            </button>
          </div>

          {showNewClient && (
            <div className="mt-3 border border-line rounded-md p-4 bg-white space-y-2">
              <input
                placeholder="Name *"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value.toUpperCase() })}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
              <input
                placeholder="Company"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
              <input
                placeholder="Company registration number"
                value={newClient.companyRegistrationNumber}
                onChange={(e) =>
                  setNewClient({ ...newClient, companyRegistrationNumber: e.target.value })
                }
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
                <input
                  placeholder="Phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <input
                placeholder="Address line 1"
                value={newClient.addressLine1}
                onChange={(e) => setNewClient({ ...newClient, addressLine1: e.target.value })}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
              <input
                placeholder="Address line 2"
                value={newClient.addressLine2}
                onChange={(e) => setNewClient({ ...newClient, addressLine2: e.target.value })}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
              <input
                placeholder="Address line 3"
                value={newClient.addressLine3}
                onChange={(e) => setNewClient({ ...newClient, addressLine3: e.target.value })}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  placeholder="Postcode"
                  value={newClient.postcode}
                  onChange={(e) => setNewClient({ ...newClient, postcode: e.target.value })}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
                <input
                  placeholder="City"
                  value={newClient.city}
                  onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
                <input
                  placeholder="State"
                  value={newClient.state}
                  onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
                <input
                  placeholder="Country"
                  value={newClient.country}
                  onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={createClient}
                className="px-3 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light transition-colors"
              >
                Save client
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
            Due date {type === 'quotation' ? '(valid until)' : ''}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 bg-white text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Line items
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-teal hover:text-teal-light"
          >
            + Add item
          </button>
        </div>

        <div className="border border-line rounded-md overflow-hidden bg-white">
          <div className="grid grid-cols-12 gap-2 bg-ink text-paper text-xs uppercase tracking-wide px-4 py-2">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              className={`grid grid-cols-12 gap-2 px-4 py-2 items-center ${
                i % 2 === 1 ? 'bg-paper' : ''
              }`}
            >
              <textarea
                rows={2}
                className="col-span-6 border border-line rounded-md px-2 py-1.5 text-sm resize-y"
                placeholder="e.g. Website design services"
                value={item.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="1"
                className="col-span-2 border border-line rounded-md px-2 py-1.5 text-sm font-tabular"
                value={item.quantity}
                onChange={(e) => updateItem(i, 'quantity', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="col-span-2 border border-line rounded-md px-2 py-1.5 text-sm font-tabular"
                value={item.rate}
                onChange={(e) => updateItem(i, 'rate', e.target.value)}
              />
              <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="text-sm font-tabular">
                  {formatMoney(Number(item.quantity || 0) * Number(item.rate || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-rust text-xs hover:underline"
                >
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
            Notes
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, thank-you note, etc."
            className="w-full border border-line rounded-md px-3 py-2 bg-white text-sm"
          />

          {type === 'quotation' && (
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Terms and conditions
              </label>
              <textarea
                rows={4}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Default terms are loaded from Settings"
                className="w-full border border-line rounded-md px-3 py-2 bg-white text-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Discount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-32 border border-line rounded-md px-2 py-1.5 text-sm text-right font-tabular"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Tax rate (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-32 border border-line rounded-md px-2 py-1.5 text-sm text-right font-tabular"
            />
          </div>

          <div className="border-t border-line pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>Subtotal</span>
              <span className="font-tabular">{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-soft">
              <span>Tax</span>
              <span className="font-tabular">{formatMoney(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-display font-semibold text-ink pt-1">
              <span>Total</span>
              <span className="font-tabular">{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-rust text-sm">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-paper"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? `Update ${label}` : `Create ${label}`}
        </button>
      </div>
    </form>
  );
}
