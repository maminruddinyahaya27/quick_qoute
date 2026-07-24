'use client';

import { use } from 'react';
import DocumentDetail from '@/components/DocumentDetail';

export default function InvoiceDetailPage({ params }) {
  const { id } = use(params);
  return <DocumentDetail id={id} type="invoice" />;
}
