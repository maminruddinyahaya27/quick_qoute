'use client';

import { use } from 'react';
import DocumentDetail from '@/components/DocumentDetail';

export default function QuotationDetailPage({ params }) {
  const { id } = use(params);
  return <DocumentDetail id={id} type="quotation" />;
}
