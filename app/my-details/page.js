'use client';

import { useEffect, useState } from 'react';

const emptyAddress = {
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  postcode: '',
  city: '',
  state: '',
  country: '',
};

const emptyDetails = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  ...emptyAddress,
  address: '',
  website: '',
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

  return {
    addressLine1: hasLocationLine ? lines[0] || '' : lines[0] || '',
    addressLine2: hasLocationLine ? lines[1] || '' : '',
    addressLine3: hasLocationLine ? lines[2] || '' : '',
    postcode: locationParts[0] || '',
    city: locationParts[1] || '',
    state: locationParts[2] || '',
    country: locationParts[3] || '',
  };
}

function getAddressFields(data) {
  const hasStructuredAddress = [
    data.addressLine1,
    data.addressLine2,
    data.addressLine3,
    data.postcode,
    data.city,
    data.state,
    data.country,
  ].some(Boolean);

  return hasStructuredAddress ? {
    addressLine1: data.addressLine1 || '',
    addressLine2: data.addressLine2 || '',
    addressLine3: data.addressLine3 || '',
    postcode: data.postcode || '',
    city: data.city || '',
    state: data.state || '',
    country: data.country || '',
  } : parseAddress(data.address);
}

export default function MyDetailsPage() {
  const [myDetails, setMyDetails] = useState(emptyDetails);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/my-details');
      if (res.ok) {
        const data = await res.json();
        setMyDetails({ ...emptyDetails, ...data, ...getAddressFields(data) });
      }
      setLoading(false);
    }
    load();
  }, []);

  function updateField(field, value) {
    setMyDetails((prev) => ({ ...prev, [field]: value }));
  }

  function updatePasswordField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const res = await fetch('/api/my-details', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: myDetails.businessName,
        contactName: myDetails.contactName,
        email: myDetails.email,
        phone: myDetails.phone,
        addressLine1: myDetails.addressLine1,
        addressLine2: myDetails.addressLine2,
        addressLine3: myDetails.addressLine3,
        postcode: myDetails.postcode,
        city: myDetails.city,
        state: myDetails.state,
        country: myDetails.country,
        website: myDetails.website,
        taxId: myDetails.taxId,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to save details.');
      return;
    }

    setMessage('Your details were saved.');
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please complete all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });
    setPasswordSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error || 'Failed to update password.');
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMessage('Password updated successfully.');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My details</h1>
        <p className="text-sm text-ink-soft mt-1">
          This information appears as the sender details in your PDFs.
        </p>
      </div>

      <div className="inline-flex rounded-md border border-line bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'bg-ink text-paper'
              : 'text-ink/70 hover:bg-teal-soft hover:text-teal'
          }`}
        >
          My details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'password'
              ? 'bg-ink text-paper'
              : 'text-ink/70 hover:bg-teal-soft hover:text-teal'
          }`}
        >
          Password update
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading details...</p>
      ) : activeTab === 'details' ? (
        <form onSubmit={handleSave} className="space-y-4 border border-line rounded-md bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Business name
              </label>
              <input
                value={myDetails.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Contact name
              </label>
              <input
                value={myDetails.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Email
              </label>
              <input
                type="email"
                value={myDetails.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Phone
              </label>
              <input
                value={myDetails.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Address line 1
              </label>
              <input
                value={myDetails.addressLine1}
                onChange={(e) => updateField('addressLine1', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Address line 2
              </label>
              <input
                value={myDetails.addressLine2}
                onChange={(e) => updateField('addressLine2', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Address line 3
              </label>
              <input
                value={myDetails.addressLine3}
                onChange={(e) => updateField('addressLine3', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  Postcode
                </label>
                <input
                  value={myDetails.postcode}
                  onChange={(e) => updateField('postcode', e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  City
                </label>
                <input
                  value={myDetails.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  State
                </label>
                <input
                  value={myDetails.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                  Country
                </label>
                <input
                  value={myDetails.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Website
              </label>
              <input
                value={myDetails.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
                Tax ID
              </label>
              <input
                value={myDetails.taxId}
                onChange={(e) => updateField('taxId', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}
          {message && <p className="text-sm text-teal">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save details'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handlePasswordUpdate}
          className="space-y-4 border border-line rounded-md bg-white p-6 max-w-xl"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Current password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              New password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => updatePasswordField('newPassword', e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Confirm new password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>

          {passwordError && <p className="text-sm text-rust">{passwordError}</p>}
          {passwordMessage && <p className="text-sm text-teal">{passwordMessage}</p>}

          <button
            type="submit"
            disabled={passwordSaving}
            className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
          >
            {passwordSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
