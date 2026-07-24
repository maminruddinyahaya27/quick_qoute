'use client';

import DocumentForm from '@/components/DocumentForm';

export default function NewInvoicePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">New invoice</h1>
      <DocumentForm type="invoice" />
    </div>
  );
}
