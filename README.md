# Q-Qoute — Quotation & Invoice Portal

A Next.js (App Router) + MongoDB portal for creating clients, quotations, and
invoices — with PDF export and one-click "convert quotation to invoice".

## Features

- **Clients** — add, edit, delete customer records
- **Quotations** — line items, tax rate, discount, notes, auto-numbered (`QUO-00001`)
- **Invoices** — same builder, auto-numbered (`INV-00001`), status tracking
  (draft / sent / paid / overdue)
- **Convert** a quotation into an invoice in one click (preserves line items,
  links both records)
- **PDF export** — every quotation/invoice can be downloaded as a PDF
  (generated server-side with `pdf-lib`, no headless browser needed)
- **Dashboard** — counts, outstanding invoice total, recent activity

## Tech stack

- Next.js 16 (App Router, route handlers for the API)
- MongoDB + Mongoose
- Tailwind CSS
- pdf-lib for PDF generation

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up your database connection. Copy `.env.example` to `.env.local` and
   fill in your MongoDB URI:

   ```bash
   cp .env.example .env.local
   ```

   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/quotation-invoice-portal
   ```

   This works with a local `mongod`, Docker (`docker run -d -p 27017:27017 mongo`),
   or a hosted cluster (e.g. MongoDB Atlas connection string).

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

4. Build for production:

   ```bash
   npm run build
   npm start
   ```

## Project structure

```
app/
  page.js                     # Dashboard (server component, direct DB reads)
  clients/page.js              # Client list + inline add/edit/delete
  quotations/page.js            # Quotation list
  quotations/new/page.js        # New quotation form
  quotations/[id]/page.js       # Quotation detail (status, convert, PDF)
  invoices/...                  # Same pattern for invoices
  api/clients/route.js          # GET/POST clients
  api/clients/[id]/route.js     # GET/PUT/DELETE a client
  api/documents/route.js        # GET (?type=quotation|invoice)/POST
  api/documents/[id]/route.js   # GET/PUT/DELETE a document
  api/documents/[id]/convert/route.js  # Quotation -> Invoice
  api/documents/[id]/pdf/route.js      # Streams a generated PDF
components/
  DocumentForm.js    # Shared create form (line items, totals, client picker)
  DocumentDetail.js  # Shared detail view (status, convert, delete, PDF link)
  DocumentList.js    # Shared list table
  StatusBadge.js
  Navbar.js
lib/
  mongodb.js   # Cached Mongoose connection
  models/      # Client, Document (shared by quotation & invoice), Counter
  calc.js      # Totals math (subtotal, discount, tax, total)
  pdf.js       # pdf-lib document renderer
```

### Why one "Document" model for both types?

Quotations and invoices share the same shape (client, line items, tax,
discount, notes, status, PDF). A single `Document` model with a `type` field
(`quotation` | `invoice`) avoids duplicating schemas, API routes, and UI —
and makes "convert this quotation into an invoice" a simple, native operation
that keeps a link between the two records (`convertedFrom` / `convertedTo`).

## Extending this

- **Auth** — there's no login yet; add NextAuth.js or your own middleware if
  this needs to be multi-user or public-facing.
- **Email delivery** — hook a provider (Resend, SendGrid, Postmark) into the
  detail page's "Download PDF" action to email PDFs directly to clients.
  Currency — all amounts are unit-less; add a `currency` field to `Document`
  if you need multi-currency support.
- **Recurring invoices** — add a cron/queue job that calls `POST /api/documents`
  on a schedule using a saved template.
