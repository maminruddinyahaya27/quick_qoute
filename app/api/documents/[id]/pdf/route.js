import dbConnect from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import MyDetail from '@/lib/models/MyDetail';
import Setting from '@/lib/models/Setting';
import '@/lib/models/Client';
import { generatePdf } from '@/lib/pdf';
import { requireApiUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await requireApiUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const [doc, myDetails, settings] = await Promise.all([
    Document.findOne({ _id: id, owner: user._id }).populate('client'),
    MyDetail.findOne({ owner: user._id }),
    Setting.findOne({ owner: user._id, key: 'default' }),
  ]);
  if (!doc) {
    return new Response('Not found', { status: 404 });
  }
  const pdfBytes = await generatePdf(doc, myDetails || {}, settings?.quotationHeader || {});
  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${doc.number}.pdf"`,
    },
  });
}
