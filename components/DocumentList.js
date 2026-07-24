'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/calc';
import StatusBadge from '@/components/StatusBadge';

export default function DocumentList({ type }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        setDocs(data);
        setLoading(false);
      });
  }, [type]);

  const label =
    type === 'invoice' ? 'Invoices' : type === 'receipt' ? 'Receipts' : 'Quotations';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">{label}</h1>
        {type !== 'receipt' && (
          <Link
            href={`/${type}s/new`}
            className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light transition-colors"
          >
            + New {type}
          </Link>
        )}
      </div>

      {loading && <p className="text-ink-soft text-sm">Loading…</p>}

      {!loading && !docs.length && (
        <div className="border border-dashed border-line rounded-md p-10 text-center">
          <p className="text-ink-soft text-sm">
            No {label.toLowerCase()} yet. Create your first one to get started.
          </p>
        </div>
      )}

      {!loading && docs.length > 0 && (
        <div className="border border-line rounded-md bg-white overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-ink text-paper text-xs uppercase tracking-wide px-4 py-2.5">
            <div className="col-span-2">Number</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Issue date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Total</div>
          </div>
          {docs.map((doc, i) => (
            <Link
              key={doc._id}
              href={`/${type}s/${doc._id}`}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-teal-soft/40 transition-colors ${
                i % 2 === 1 ? 'bg-paper' : ''
              }`}
            >
              <div className="col-span-2 stamp text-teal font-semibold">{doc.number}</div>
              <div className="col-span-3">{doc.client?.name || '—'}</div>
              <div className="col-span-2 text-ink-soft">
                {new Date(doc.issueDate).toLocaleDateString()}
              </div>
              <div className="col-span-2">
                <StatusBadge status={doc.status} />
              </div>
              <div className="col-span-3 text-right font-tabular font-medium">
                {formatMoney(doc.total)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
