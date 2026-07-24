'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';

const emptyAddress = {
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  postcode: '',
  city: '',
  state: '',
  country: '',
};

const emptyForm = {
  name: '',
  company: '',
  companyRegistrationNumber: '',
  email: '',
  phone: '',
  ...emptyAddress,
  taxId: '',
};

function parseAddress(address = '') {
  const lines = String(address)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasLocationLine = lines.length > 1;
  const location = hasLocationLine ? lines[lines.length - 1] : '';
  const locationParts = location.split(',').map((part) => part.trim()).filter(Boolean);
  const postcode = locationParts[0] || '';
  const city = locationParts[1] || '';
  const state = locationParts[2] || '';
  const country = locationParts[3] || '';

  const addressLines = hasLocationLine ? lines.slice(0, -1) : lines;

  return {
    addressLine1: addressLines[0] || '',
    addressLine2: addressLines[1] || '',
    addressLine3: addressLines[2] || '',
    postcode,
    city,
    state,
    country,
  };
}

function getAddressFields(client) {
  const hasStructuredAddress = [
    client.addressLine1,
    client.addressLine2,
    client.addressLine3,
    client.postcode,
    client.city,
    client.state,
    client.country,
  ].some(Boolean);

  if (hasStructuredAddress) {
    return {
      addressLine1: client.addressLine1 || '',
      addressLine2: client.addressLine2 || '',
      addressLine3: client.addressLine3 || '',
      postcode: client.postcode || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || '',
    };
  }

  return parseAddress(client.address);
}

function buildAddress(form) {
  const lines = [form.addressLine1, form.addressLine2, form.addressLine3]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const location = [form.postcode, form.city, form.state, form.country]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');

  if (location) lines.push(location);
  return lines.join('\n');
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/clients');
    setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      company: form.company,
      companyRegistrationNumber: form.companyRegistrationNumber,
      email: form.email,
      phone: form.phone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      addressLine3: form.addressLine3,
      postcode: form.postcode,
      city: form.city,
      state: form.state,
      country: form.country,
      taxId: form.taxId,
    };

    if (editingId) {
      await fetch(`/api/clients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setForm(emptyForm);
    setEditingId(null);
    load();
  }

  function startEdit(client) {
    setEditingId(client._id);
    setForm({
      name: client.name || '',
      company: client.company || '',
      companyRegistrationNumber: client.companyRegistrationNumber || '',
      email: client.email || '',
      phone: client.phone || '',
      ...getAddressFields(client),
      taxId: client.taxId || '',
    });
  }

  async function handleDelete(id) {
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    setClientToDelete(null);
    load();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <h1 className="font-display text-2xl font-semibold text-ink mb-4">
          {editingId ? 'Edit client' : 'Add client'}
        </h1>
        <form onSubmit={handleSubmit} className="border border-line rounded-md bg-white p-4 space-y-3">
          <input
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Company registration number"
            value={form.companyRegistrationNumber}
            onChange={(e) =>
              setForm({ ...form, companyRegistrationNumber: e.target.value })
            }
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Address line 1"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Address line 2"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Address line 3"
            value={form.addressLine3}
            onChange={(e) => setForm({ ...form, addressLine3: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input
              placeholder="Postcode"
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
            <input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>
          <input
            placeholder="Tax ID"
            value={form.taxId}
            onChange={(e) => setForm({ ...form, taxId: e.target.value })}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light transition-colors"
            >
              {editingId ? 'Save changes' : 'Add client'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="px-4 py-2 rounded-md border border-line text-sm text-ink-soft"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">All clients</h2>
        {loading && <p className="text-ink-soft text-sm">Loading…</p>}
        {!loading && !clients.length && (
          <div className="border border-dashed border-line rounded-md p-10 text-center">
            <p className="text-ink-soft text-sm">No clients yet. Add your first one.</p>
          </div>
        )}
        {!loading && clients.length > 0 && (
          <div className="border border-line rounded-md bg-white divide-y divide-line">
            {clients.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-ink text-sm">{c.name}</p>
                  <p className="text-xs text-ink-soft">
                    {[c.company, c.companyRegistrationNumber, c.email, c.phone]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(c)} className="text-teal hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => setClientToDelete(c)}
                    className="text-rust hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(clientToDelete)}
        title="Delete client"
        description={clientToDelete ? `Delete ${clientToDelete.name}? This cannot be undone.` : ''}
        onClose={() => setClientToDelete(null)}
        actions={[
          <button
            key="cancel"
            type="button"
            onClick={() => setClientToDelete(null)}
            className="px-4 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-paper"
          >
            Cancel
          </button>,
          <button
            key="delete"
            type="button"
            onClick={() => clientToDelete && handleDelete(clientToDelete._id)}
            className="px-4 py-2 rounded-md bg-rust text-white text-sm font-medium hover:opacity-90"
          >
            Delete
          </button>,
        ]}
      >
        <p className="text-sm text-ink-soft">This action permanently removes the client record.</p>
      </Modal>
    </div>
  );
}
