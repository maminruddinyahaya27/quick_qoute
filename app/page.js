import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import Client from '@/lib/models/Client';
import StatusBadge from '@/components/StatusBadge';
import { formatMoney } from '@/lib/calc';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  await dbConnect();

  const [quotationCount, invoiceCount, clientCount, recentDocs, outstandingAgg] =
    await Promise.all([
      Document.countDocuments({ owner: user._id, type: 'quotation' }),
      Document.countDocuments({ owner: user._id, type: 'invoice' }),
      Client.countDocuments({ owner: user._id }),
      Document.find({ owner: user._id }).populate('client').sort({ createdAt: -1 }).limit(8),
      Document.aggregate([
        { $match: { owner: user._id, type: 'invoice', status: { $ne: 'paid' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

  const outstanding = outstandingAgg[0]?.total || 0;

  const cards = [
    { label: 'Quotations', value: quotationCount, href: '/quotations' },
    { label: 'Invoices', value: invoiceCount, href: '/invoices' },
    { label: 'Clients', value: clientCount, href: '/clients' },
    { label: 'Outstanding', value: formatMoney(outstanding), href: '/invoices' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="stamp text-xs text-teal font-semibold mb-1">Overview</p>
        <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="border border-line rounded-md bg-white p-5 hover:border-teal transition-colors"
          >
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">{card.label}</p>
            <p className="font-display text-2xl font-semibold text-ink font-tabular">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/quotations/new"
          className="px-4 py-2 rounded-md bg-teal text-white text-sm font-medium hover:bg-teal-light transition-colors"
        >
          + New quotation
        </Link>
        <Link
          href="/invoices/new"
          className="px-4 py-2 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal-soft transition-colors"
        >
          + New invoice
        </Link>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">Recent activity</h2>
        {!recentDocs.length && (
          <div className="border border-dashed border-line rounded-md p-10 text-center">
            <p className="text-ink-soft text-sm">
              Nothing here yet — create your first quotation, invoice, or receipt.
            </p>
          </div>
        )}
        {recentDocs.length > 0 && (
          <div className="border border-line rounded-md bg-white overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-ink text-paper text-xs uppercase tracking-wide px-4 py-2.5">
              <div className="col-span-2">Number</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Client</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
            {recentDocs.map((doc, i) => (
              <Link
                key={doc._id}
                href={`/${doc.type}s/${doc._id}`}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-teal-soft/40 transition-colors ${
                  i % 2 === 1 ? 'bg-paper' : ''
                }`}
              >
                <div className="col-span-2 stamp text-teal font-semibold">{doc.number}</div>
                <div className="col-span-2 capitalize text-ink-soft">{doc.type}</div>
                <div className="col-span-3">{doc.client?.name || '—'}</div>
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
    </div>
  );
}
