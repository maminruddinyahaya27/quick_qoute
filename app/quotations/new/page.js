'use client';

import DocumentForm from '@/components/DocumentForm';

export default function NewQuotationPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">New quotation</h1>
      <DocumentForm type="quotation" />
    </div>
  );
}
