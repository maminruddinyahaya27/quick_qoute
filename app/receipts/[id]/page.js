import DocumentDetail from '@/components/DocumentDetail';

export default async function ReceiptDetailPage({ params }) {
  const { id } = await params;
  return <DocumentDetail id={id} type="receipt" />;
}
