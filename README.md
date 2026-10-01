# GEETA INDUSTRIES - Tax Invoice & PDF Generator

A React web application designed for **GEETA INDUSTRIES** to create, edit, calculate, and convert GST Tax Invoices to PDF.

## 🚀 Getting Started

The development server is currently running at:
**[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**

To start it manually in the future:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

---

## ✨ Features

1. **Customer Dropdown & JSON Storage (`src/data/customers.json`)**:
   - Easily switch between customers (e.g., *LOKMAT MEDIA Pvt. Ltd.*, *SAKAL PAPERS*, *KIRLOSKAR*, *BHARAT FORGE*, etc.).
   - Pre-fills Bill To Name, Address, GSTIN, and Ship To address automatically.
   - "+ Add New Customer" button to add and remember new clients without any database needed.

2. **Inline WYSIWYG Editing**:
   - Click directly on any field (Invoice No, Date, Challan No, Company Details, Customer Info, Items, Bank Details) to edit.

3. **Item Grid & Real-time Auto-Calculations**:
   - `Amount INR = Quantity × Rate` is auto-calculated per item.
   - Add new rows or remove rows with 1 click.
   - Automatic Subtotal calculation.
   - GST options: Intra-State (CGST + SGST @ 9% each = 18%) or Inter-State (IGST), with quick-set buttons for 18%, 12%, 5%, and 0%.
   - Packing and Transport charges support.
   - Auto Round-up / Round-off to the nearest rupee.
   - Grand Total Amount auto-calculated.
   - **Amount in Words**: Automatically converts any amount to Indian currency text format (e.g., `INR Two Thousand One Hundred Twenty Four Only`).

4. **Convert to PDF**:
   - **Print / Save PDF**: Native browser print dialog formatted precisely for standard **A4 paper** with 100% crisp vector text and clean borders.
   - **Download PDF**: Direct one-click client-side download of `Invoice_<No>_<Customer>.pdf` using `html2pdf.js`.

5. **No Database Required**:
   - Stored in local JSON (`customers.json`) and synced with browser `localStorage` for convenience.
