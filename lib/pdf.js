import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}

function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

function wrapLineByWidth(text, maxWidth, font, size) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }

  lines.push(current);
  return lines;
}

function wrapTextBlock(text, maxWidth, font, size) {
  return String(text || '')
    .split(/\r?\n/)
    .flatMap((line) => wrapLineByWidth(line, maxWidth, font, size));
}

function itemDescriptionLines(text, maxWidth, font, size) {
  const rawLines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rawLines.length) return [''];

  const first = wrapLineByWidth(rawLines[0], maxWidth, font, size);
  const detailLines = rawLines.slice(1).flatMap((line, idx) => {
    const isBullet = /^\*/.test(line);
    const detailText = isBullet ? line.replace(/^\*\s?/, '') : line;
    const wrapped = wrapLineByWidth(detailText, maxWidth - 16, font, size);

    if (isBullet) {
      return wrapped.map((part, partIdx) =>
        partIdx === 0 ? `* ${part}` : `  ${part}`
      );
    }

    return wrapped.map((part, partIdx) =>
      partIdx === 0 ? `${idx + 1}. ${part}` : `   ${part}`
    );
  });

  return [...first, ...detailLines];
}

function splitAddressLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clientAddressLines(client = {}) {
  const structuredLines = [
    client.addressLine1,
    client.addressLine2,
    client.addressLine3,
    [client.postcode, client.city, client.state, client.country].filter(Boolean).join(', '),
  ].filter(Boolean);

  if (structuredLines.length) {
    return structuredLines;
  }

  return splitAddressLines(client.address);
}

function myDetailAddressLines(myDetails = {}) {
  const structuredLines = [
    myDetails.addressLine1,
    myDetails.addressLine2,
    myDetails.addressLine3,
    [myDetails.postcode, myDetails.city, myDetails.state, myDetails.country]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);

  if (structuredLines.length) {
    return structuredLines;
  }

  return splitAddressLines(myDetails.address);
}

export async function generatePdf(doc, myDetails = {}, quotationHeader = {}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const ink = rgb(0.106, 0.141, 0.212);
  const gray = rgb(0.42, 0.44, 0.48);
  const teal = rgb(0.184, 0.435, 0.388);
  const lineGray = rgb(0.72, 0.72, 0.72);
  const headerBg = rgb(0.11, 0.16, 0.26);
  const white = rgb(1, 1, 1);
  const tableText = rgb(0.1, 0.1, 0.1);

  const title =
    doc.type === 'invoice' ? 'INVOICE' : doc.type === 'receipt' ? 'RECEIPT' : 'QUOTATION';

  const customHeaderLines = [
    String(quotationHeader?.title || '').trim(),
    String(quotationHeader?.subtitle || '').trim(),
    String(quotationHeader?.note || '').trim(),
  ].filter(Boolean);

  if (doc.type === 'quotation' && quotationHeader?.enabled && customHeaderLines.length) {
    const boxTop = y;
    const wrappedHeaderLines = customHeaderLines.flatMap((line, idx) =>
      wrapLineByWidth(line, width - margin * 2 - 24, idx === 0 ? fontBold : font, idx === 0 ? 12 : 10)
    );
    const boxHeight = 20 + wrappedHeaderLines.length * 14;

    page.drawRectangle({
      x: margin,
      y: boxTop - boxHeight,
      width: width - margin * 2,
      height: boxHeight,
      color: rgb(0.94, 0.97, 0.96),
    });

    let headerY = boxTop - 18;
    wrappedHeaderLines.forEach((line, idx) => {
      const isFirst = idx === 0;
      page.drawText(String(line), {
        x: margin + 12,
        y: headerY,
        size: isFirst ? 12 : 10,
        font: isFirst ? fontBold : font,
        color: isFirst ? ink : gray,
      });
      headerY -= 14;
    });

    y -= boxHeight + 14;
  }

  page.drawText(title, { x: margin, y, size: 26, font: fontBold, color: ink });
  const numberWidth = fontBold.widthOfTextAtSize(doc.number, 13);
  page.drawText(doc.number, {
    x: width - margin - numberWidth,
    y: y + 2,
    size: 13,
    font: fontBold,
    color: teal,
  });
  y -= 34;

  page.drawText(`Issue date: ${formatDate(doc.issueDate)}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: gray,
  });
  if (doc.dueDate) {
    page.drawText(`Due date: ${formatDate(doc.dueDate)}`, {
      x: margin + 220,
      y,
      size: 10,
      font,
      color: gray,
    });
  }
  y -= 30;

  const contactTopY = y;

  const senderLines = [
    myDetails.businessName,
    myDetails.contactName,
    myDetails.email,
    myDetails.phone,
    myDetails.website,
    myDetails.taxId ? `Tax ID: ${myDetails.taxId}` : '',
    ...myDetailAddressLines(myDetails),
  ].filter(Boolean);

  const senderWrappedLines = senderLines.flatMap((line) =>
    wrapLineByWidth(line, 210, font, 9)
  );

  if (senderLines.length) {
    page.drawText('FROM', { x: 330, y: contactTopY + 15, size: 9, font: fontBold, color: teal });
    let senderY = contactTopY;
    senderWrappedLines.forEach((line) => {
      page.drawText(String(line), { x: 330, y: senderY, size: 9, font, color: gray });
      senderY -= 12;
    });
  }

  page.drawText('BILL TO', { x: margin, y: contactTopY, size: 9, font: fontBold, color: teal });
  y = contactTopY - 15;
  const client = doc.client || {};
  const clientLines = [
    client.name,
    client.company,
    client.companyRegistrationNumber
      ? `Registration no: ${client.companyRegistrationNumber}`
      : '',
    client.email,
    client.phone,
    ...clientAddressLines(client),
  ].filter(Boolean);

  const clientWrappedLines = clientLines.flatMap((line) =>
    wrapLineByWidth(line, 260, font, 10)
  );

  clientWrappedLines.forEach((line) => {
    page.drawText(String(line), { x: margin, y, size: 10, font, color: ink });
    y -= 13;
  });

  const senderBottomY = contactTopY - senderWrappedLines.length * 12;
  const contactsBottomY = Math.min(y, senderBottomY);
  y = contactsBottomY - 20;

  const colBreak = {
    left: margin,
    no: margin + 34,
    desc: 320,
    qty: 390,
    rate: 465,
    right: width - margin,
  };
  const colX = {
    no: margin + 10,
    desc: margin + 40,
    qty: colBreak.desc + 8,
    rate: colBreak.qty + 8,
    amount: colBreak.rate + 8,
  };

  const headerHeight = 22;
  const headerTextY = y;
  const headerBottom = y - 6;
  const rowGap = 6;
  const rowTextTopPad = 3;

  page.drawRectangle({
    x: colBreak.left,
    y: headerBottom,
    width: colBreak.right - colBreak.left,
    height: headerHeight,
    color: headerBg,
  });

  page.drawText('NO', { x: colX.no, y: headerTextY, size: 9, font: fontBold, color: white });
  page.drawText('DESCRIPTION', { x: colX.desc, y: headerTextY, size: 9, font: fontBold, color: white });
  page.drawText('QTY', { x: colX.qty, y: headerTextY, size: 9, font: fontBold, color: white });
  page.drawText('RATE', { x: colX.rate, y: headerTextY, size: 9, font: fontBold, color: white });
  page.drawText('AMOUNT', { x: colX.amount, y: headerTextY, size: 9, font: fontBold, color: white });

  y -= 24;

  (doc.items || []).forEach((item, i) => {
    const descLines = itemDescriptionLines(item.description, 250, font, 10);
    const rowHeight = Math.max(24, descLines.length * 12 + 8);

    if (y - (rowHeight + rowGap) < 120) return;

    const rowTop = y - rowGap;
    const rowBottom = rowTop - rowHeight;
    const textTopY = rowTop - rowTextTopPad;

    descLines.forEach((line, idx) => {
      page.drawText(line, {
        x: colX.desc,
        y: textTopY - idx * 12,
        size: 10,
        font,
        color: tableText,
      });
    });

    page.drawText(String(i + 1), {
      x: colX.no,
      y: textTopY,
      size: 10,
      font,
      color: tableText,
    });

    page.drawText(String(item.quantity), { x: colX.qty, y: textTopY, size: 10, font, color: tableText });
    page.drawText(formatMoney(item.rate), { x: colX.rate, y: textTopY, size: 10, font, color: tableText });
    page.drawText(formatMoney(item.amount), { x: colX.amount, y: textTopY, size: 10, font, color: tableText });

    y = rowBottom;
  });

  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: lineGray,
  });
  y -= 22;

  const totalsLabelX = 380;
  const totalsValueX = 475;

  const drawRow = (label, value, bold = false) => {
    const f = bold ? fontBold : font;
    const c = bold ? ink : gray;
    page.drawText(label, { x: totalsLabelX, y, size: bold ? 12 : 10, font: f, color: c });
    page.drawText(value, { x: totalsValueX, y, size: bold ? 12 : 10, font: f, color: c });
    y -= bold ? 18 : 16;
  };

  drawRow('Subtotal', formatMoney(doc.subtotal));
  if (doc.discount) drawRow('Discount', `-${formatMoney(doc.discount)}`);
  if (doc.taxRate) drawRow(`Tax (${doc.taxRate}%)`, formatMoney(doc.taxAmount));
  y -= 4;
  page.drawLine({
    start: { x: totalsLabelX, y: y + 12 },
    end: { x: width - margin, y: y + 12 },
    thickness: 1,
    color: ink,
  });
  drawRow('Total', formatMoney(doc.total), true);

  if (doc.notes) {
    y -= 30;
    page.drawText('NOTES', { x: margin, y, size: 9, font: fontBold, color: teal });
    y -= 15;
    const noteLines = wrapTextBlock(doc.notes, width - margin * 2, font, 9);
    noteLines.forEach((line) => {
      page.drawText(line, { x: margin, y, size: 9, font, color: gray });
      y -= 12;
    });
    y -= 4;
  }

  if (doc.termsAndConditions) {
    y -= 14;
    page.drawText('TERMS & CONDITIONS', { x: margin, y, size: 9, font: fontBold, color: teal });
    y -= 15;
    const termLines = wrapTextBlock(doc.termsAndConditions, width - margin * 2, font, 9);
    termLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font,
        color: gray,
      });
      y -= 12;
    });
  }

  page.drawText('Generated by Q-Qoute', {
    x: margin,
    y: 30,
    size: 8,
    font,
    color: gray,
  });

  return pdfDoc.save();
}
