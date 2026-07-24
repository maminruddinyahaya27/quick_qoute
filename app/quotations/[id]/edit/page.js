import DocumentForm from '@/components/DocumentForm';

export default async function EditQuotationPage({ params }) {
  const { id } = await params;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Edit quotation</h1>
      <DocumentForm type="quotation" documentId={id} />
    </div>
  );
}
