'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatMoney } from '@/lib/calc';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

const STATUS_OPTIONS = {
  quotation: ['draft', 'sent', 'accepted', 'rejected'],
  invoice: ['draft', 'sent', 'paid', 'overdue'],
  receipt: ['paid'],
};

function descriptionLines(text = '') {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [''];

  const first = lines[0];
  const rest = lines.slice(1).map((line, idx) => `${idx + 1}. ${line}`);
  return [first, ...rest];
}

function formatClientAddress(client) {
  const structuredLines = [
    client.addressLine1,
    client.addressLine2,
    client.addressLine3,
    [client.postcode, client.city, client.state, client.country].filter(Boolean).join(', '),
  ].filter(Boolean);

  if (structuredLines.length) {
    return structuredLines.join('\n');
  }

  return client.address || '';
}

export default function DocumentDetail({ id, type }) {
  const router = useRouter();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [creatingReceipt, setCreatingReceipt] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [messageModal, setMessageModal] = useState({ open: false, title: '', message: '' });

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/documents/${id}`);
    if (res.ok) setDoc(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status) {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setDoc(await res.json());
  }

  async function convertToInvoice() {
    setConverting(true);
    const res = await fetch(`/api/documents/${id}/convert`, { method: 'POST' });
    setConverting(false);
    if (res.ok) {
      const invoice = await res.json();
      router.push(`/invoices/${invoice._id}`);
    }
  }

  function openMessageModal(title, message) {
    setMessageModal({ open: true, title, message });
  }

  function openReceiptModal() {
    setReceiptAmount(doc?.total ? formatMoney(doc.total) : '');
    setReceiptError('');
    setReceiptModalOpen(true);
  }

  async function createReceipt() {
    const amount = Number(String(receiptAmount).replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      setReceiptError('Please enter a valid deposit amount.');
      return;
    }

    setCreatingReceipt(true);
    const res = await fetch(`/api/documents/${id}/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    setCreatingReceipt(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReceiptModalOpen(false);
      openMessageModal('Receipt could not be created', data.error || 'Failed to create receipt.');
      return;
    }

    const receipt = await res.json();
    setReceiptModalOpen(false);
    router.push(`/receipts/${receipt._id}`);
  }

  async function handleDelete() {
    setDeleteModalOpen(false);
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    router.push(type === 'invoice' ? '/invoices' : type === 'receipt' ? '/receipts' : '/quotations');
  }

  if (loading) return <p className="text-ink-soft text-sm">Loading…</p>;
  if (!doc) return <p className="text-rust text-sm">Document not found.</p>;

  const client = doc.client || {};
  const clientAddress = formatClientAddress(client);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="stamp text-xs text-teal font-semibold mb-1">{doc.number}</p>
          <h1 className="font-display text-2xl font-semibold text-ink capitalize">
            {doc.type}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={doc.status} />
          {doc.type === 'quotation' && (
            <Link
              href={`/quotations/${id}/edit`}
              className="px-3 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-paper"
            >
              Edit quotation
            </Link>
          )}
          <a
            href={`/api/documents/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-paper"
          >
            Download PDF
          </a>
          {doc.type === 'quotation' && !doc.convertedTo && (
            <button
              onClick={convertToInvoice}
              disabled={converting}
              className="px-3 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
            >
              {converting ? 'Converting…' : 'Convert to invoice'}
            </button>
          )}
          {doc.type === 'quotation' && (
            <button
              onClick={openReceiptModal}
              disabled={creatingReceipt}
              className="px-3 py-2 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal-soft disabled:opacity-60"
            >
              {creatingReceipt ? 'Creating…' : 'Create receipt'}
            </button>
          )}
          {doc.type === 'quotation' && doc.convertedTo && (
            <Link
              href={`/invoices/${doc.convertedTo}`}
              className="px-3 py-2 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal-soft"
            >
              View invoice →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="border border-line rounded-md bg-white overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-ink text-paper text-xs uppercase tracking-wide px-4 py-2">
              <div className="col-span-1">No</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {doc.items.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm ${
                  i % 2 === 1 ? 'bg-paper' : ''
                }`}
              >
                <div className="col-span-1 font-tabular text-ink-soft">{i + 1}</div>
                <div className="col-span-5 space-y-1">
                  {descriptionLines(item.description).map((line, lineIdx) => (
                    <p
                      key={lineIdx}
                      className={lineIdx === 0 ? '' : 'text-ink-soft'}
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <div className="col-span-2 font-tabular">{item.quantity}</div>
                <div className="col-span-2 font-tabular">{formatMoney(item.rate)}</div>
                <div className="col-span-2 text-right font-tabular">
                  {formatMoney(item.amount)}
                </div>
              </div>
            ))}
          </div>

          {doc.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1">
                Notes
              </p>
              <p className="text-sm text-ink-soft whitespace-pre-wrap">{doc.notes}</p>
            </div>
          )}

          {doc.termsAndConditions && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1">
                Terms and conditions
              </p>
              <p className="text-sm text-ink-soft whitespace-pre-wrap">
                {doc.termsAndConditions}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border border-line rounded-md bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Billed to
            </p>
            <p className="font-medium text-ink">{client.name}</p>
            {client.company && <p className="text-sm text-ink-soft">{client.company}</p>}
            {client.companyRegistrationNumber && (
              <p className="text-sm text-ink-soft">
                Registration no: {client.companyRegistrationNumber}
              </p>
            )}
            {client.email && <p className="text-sm text-ink-soft">{client.email}</p>}
            {client.phone && <p className="text-sm text-ink-soft">{client.phone}</p>}
            {clientAddress && (
              <p className="text-sm text-ink-soft whitespace-pre-wrap">{clientAddress}</p>
            )}
          </div>

          <div className="border border-line rounded-md bg-white p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>Subtotal</span>
              <span className="font-tabular">{formatMoney(doc.subtotal)}</span>
            </div>
            {doc.discount > 0 && (
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Discount</span>
                <span className="font-tabular">-{formatMoney(doc.discount)}</span>
              </div>
            )}
            {doc.taxRate > 0 && (
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Tax ({doc.taxRate}%)</span>
                <span className="font-tabular">{formatMoney(doc.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-display font-semibold text-ink pt-2 border-t border-line mt-2">
              <span>Total</span>
              <span className="font-tabular">{formatMoney(doc.total)}</span>
            </div>
          </div>

          <div className="border border-line rounded-md bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Status
            </p>
            <select
              value={doc.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm bg-white"
            >
              {STATUS_OPTIONS[doc.type].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="text-sm text-rust hover:underline"
          >
            Delete {doc.type}
          </button>
        </div>
      </div>

      <Modal
        open={receiptModalOpen}
        title="Create receipt"
        description="Enter the deposit amount received for this quotation."
        onClose={() => {
          if (creatingReceipt) return;
          setReceiptModalOpen(false);
          setReceiptError('');
        }}
        actions={[
          <button
            key="cancel"
            type="button"
            onClick={() => {
              setReceiptModalOpen(false);
              setReceiptError('');
            }}
            className="px-4 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-paper"
          >
            Cancel
          </button>,
          <button
            key="create"
            type="button"
            onClick={createReceipt}
            disabled={creatingReceipt}
            className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light disabled:opacity-60"
          >
            {creatingReceipt ? 'Creating…' : 'Create receipt'}
          </button>,
        ]}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              Deposit amount
            </label>
            <input
              value={receiptAmount}
              onChange={(e) => setReceiptAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>
          {receiptError && <p className="text-sm text-rust">{receiptError}</p>}
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title={`Delete ${doc.type}`}
        description={`Delete ${doc.number}? This cannot be undone.`}
        onClose={() => setDeleteModalOpen(false)}
        actions={[
          <button
            key="cancel"
            type="button"
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-2 rounded-md border border-line text-sm text-ink-soft hover:bg-paper"
          >
            Cancel
          </button>,
          <button
            key="delete"
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-md bg-rust text-white text-sm font-medium hover:opacity-90"
          >
            Delete
          </button>,
        ]}
      >
        <p className="text-sm text-ink-soft">This action permanently removes the record.</p>
      </Modal>

      <Modal
        open={messageModal.open}
        title={messageModal.title}
        description={messageModal.message}
        onClose={() => setMessageModal({ open: false, title: '', message: '' })}
        actions={[
          <button
            key="ok"
            type="button"
            onClick={() => setMessageModal({ open: false, title: '', message: '' })}
            className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light"
          >
            OK
          </button>,
        ]}
      >
        <div />
      </Modal>
    </div>
  );
}
