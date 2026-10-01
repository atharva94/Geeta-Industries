import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Plus,
  Trash2,
  UserPlus,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import initialCustomers from './data/customers.json';
import { numberToIndianWords } from './utils/numberToWords';

const DEFAULT_INVOICE = {
  // Company details
  company: {
    name: 'GEETA INDUSTRIES',
    addressLine1: 'SrNo. 150/6/2, Narkesari Society, Ganeshnagar, Dhayari,',
    cityPin: 'Pune - 411041',
    phone: '8308050153',
    email: 'vaibhav_pethkar@yahoo.co.in',
    gstNo: '27BBUPP1193D12B'
  },
  // Invoice meta
  meta: {
    title: 'TAX INVOICE',
    invoiceNo: '#1278',
    date: '05/01/26',
    challanNo: '1295'
  },
  // Customer details
  customer: {
    id: 'cust-1',
    name: 'LOKMAT MEDIA Pvt. Ltd.',
    address: '34/A, Sinhagad road, Vadgoan KH, Pune',
    gstNo: '27AAACL1888J1Z6',
    shipTo: 'SAME AS GIVEN'
  },
  // Items matching screenshot
  items: [
    { id: '1', description: 'BUSH', hsn: '84879000', qty: 10, units: 'PC', rate: 260 },
    { id: '2', description: 'BRASS BUSH', hsn: '84879000', qty: 10, units: 'PC', rate: 400 },
    { id: '3', description: 'PLAIN BUSH', hsn: '84879000', qty: 10, units: 'PC', rate: 230 },
    { id: '4', description: 'LONG PIN', hsn: '84879000', qty: 4, units: 'PC', rate: 370 },
    { id: '5', description: 'STEPED PIN', hsn: '84879000', qty: 2, units: 'PC', rate: 650 }
  ],
  // Tax & charges
  taxSettings: {
    isInterState: false,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    packingCharge: '--',
    transportCharge: 'Actual',
    autoRoundOff: true,
    manualRoundOff: '--'
  },
  // Footer & Bank
  footer: {
    specialInstructions: 'Subject to Pune jurisdiction only.',
    bankName: 'Bank of Baroda,',
    bankBranch: 'ManikBaug Branch, Pune',
    accountNo: '37940500000208',
    ifsc: 'BARB0MANIKB',
    forCompany: 'GEETA INDUSTRIES',
    signatoryTitle: 'Authorized Signatory',
    signatoryName: 'MR. VAIBHAV PETHKAR'
  }
};

export default function App() {
  const [invoice, setInvoice] = useState(() => {
    const saved = localStorage.getItem('geeta_current_invoice_v2');
    return saved ? JSON.parse(saved) : DEFAULT_INVOICE;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('geeta_customers_list');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState(invoice.customer?.id || 'cust-1');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    address: '',
    gstNo: '',
    shipTo: 'SAME AS GIVEN',
    phone: '',
    email: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState('medium');

  const invoiceSheetRef = useRef(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('geeta_current_invoice_v2', JSON.stringify(invoice));
  }, [invoice]);

  useEffect(() => {
    localStorage.setItem('geeta_customers_list', JSON.stringify(customers));
  }, [customers]);

  // Handle customer selection
  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);

    if (custId === 'new') {
      setShowNewCustomerModal(true);
      return;
    }

    const found = customers.find((c) => c.id === custId);
    if (found) {
      setInvoice((prev) => ({
        ...prev,
        customer: {
          id: found.id,
          name: found.name,
          address: found.address,
          gstNo: found.gstNo,
          shipTo: found.shipTo || 'SAME AS GIVEN'
        }
      }));
    }
  };

  // Add new customer
  const handleSaveNewCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;

    const newId = 'cust-' + Date.now();
    const customerObj = {
      id: newId,
      name: newCustomer.name,
      address: newCustomer.address,
      gstNo: newCustomer.gstNo,
      shipTo: newCustomer.shipTo || 'SAME AS GIVEN',
      phone: newCustomer.phone,
      email: newCustomer.email
    };

    const updated = [...customers, customerObj];
    setCustomers(updated);
    setSelectedCustomerId(newId);
    setInvoice((prev) => ({
      ...prev,
      customer: {
        id: customerObj.id,
        name: customerObj.name,
        address: customerObj.address,
        gstNo: customerObj.gstNo,
        shipTo: customerObj.shipTo
      }
    }));

    setShowNewCustomerModal(false);
    setNewCustomer({
      name: '',
      address: '',
      gstNo: '',
      shipTo: 'SAME AS GIVEN',
      phone: '',
      email: ''
    });
  };

  // Calculations
  const calculateRowAmount = (qty, rate) => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    return q * r;
  };

  const subtotal = invoice.items.reduce((sum, item) => {
    return sum + calculateRowAmount(item.qty, item.rate);
  }, 0);

  const { isInterState, cgstRate, sgstRate, igstRate, packingCharge, transportCharge, autoRoundOff, manualRoundOff } =
    invoice.taxSettings;

  const cgstAmount = !isInterState ? (subtotal * (parseFloat(cgstRate) || 0)) / 100 : 0;
  const sgstAmount = !isInterState ? (subtotal * (parseFloat(sgstRate) || 0)) / 100 : 0;
  const igstAmount = isInterState ? (subtotal * (parseFloat(igstRate) || 0)) / 100 : 0;

  const numPacking = parseFloat(packingCharge) || 0;
  const numTransport = parseFloat(transportCharge) || 0;

  const rawTotal = subtotal + cgstAmount + sgstAmount + igstAmount + numPacking + numTransport;

  let roundOffAmount = 0;
  if (autoRoundOff) {
    // If packing or transport are not numeric, we just sum up
    roundOffAmount = 0;
  } else {
    roundOffAmount = parseFloat(manualRoundOff) || 0;
  }

  const grandTotal = Math.round((rawTotal + roundOffAmount) * 100) / 100;
  const amountInWords = numberToIndianWords(grandTotal);

  // Item rows operations
  const handleItemChange = (index, field, value) => {
    const updated = [...invoice.items];
    updated[index] = { ...updated[index], [field]: value };
    setInvoice((prev) => ({ ...prev, items: updated }));
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      hsn: '84879000',
      qty: 1,
      units: 'PC',
      rate: 0
    };
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (index) => {
    if (invoice.items.length <= 1) return;
    const updated = invoice.items.filter((_, i) => i !== index);
    setInvoice((prev) => ({ ...prev, items: updated }));
  };

  const handleTaxPreset = (cgst, sgst) => {
    setInvoice((prev) => ({
      ...prev,
      taxSettings: {
        ...prev.taxSettings,
        isInterState: false,
        cgstRate: cgst,
        sgstRate: sgst
      }
    }));
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceSheetRef.current) return;

    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = invoiceSheetRef.current;
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `Invoice_${(invoice.meta.invoiceNo || 'TaxInvoice').replace('#', '')}_${(invoice.customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: 750,
          windowWidth: 750
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset invoice back to the screenshot template?')) {
      setInvoice(DEFAULT_INVOICE);
      setSelectedCustomerId('cust-1');
    }
  };

  // Render text helper for WYSIWYG
  const renderField = (value, onChange, placeholder = '', className = '', isTextarea = false) => {
    if (isExporting) {
      return <div className={`pure-text ${className}`}>{value || '\u00A0'}</div>;
    }

    if (isTextarea) {
      return (
        <>
          <div className="pure-text print-only-text" style={{ display: 'none' }}>
            {value || '\u00A0'}
          </div>
          <textarea
            className={`editable-textarea ${className}`}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
          />
        </>
      );
    }

    return (
      <>
        <div className={`pure-text print-only-text ${className}`} style={{ display: 'none' }}>
          {value || '\u00A0'}
        </div>
        <input
          type="text"
          className={`editable-input ${className}`}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      </>
    );
  };

  // Fill up table to authentic printed height based on font scale
  const minRows = fontSizeScale === 'xlarge' ? 5 : (fontSizeScale === 'large' ? 6 : 6);
  const blankRowsNeeded = Math.max(0, minRows - invoice.items.length);
  const blankRows = Array.from({ length: blankRowsNeeded });

  return (
    <div>
      {/* Header Toolbar */}
      <header className="app-header no-print">
        <div className="header-container">
          <div className="logo-section">
            <span className="brand-badge">GEETA</span>
            <div>
              <h1 className="app-title">Tax Invoice Studio</h1>
              <p className="app-subtitle">Direct live edit & crisp PDF generation</p>
            </div>
          </div>

          <div className="toolbar-controls">
            {/* Customer Dropdown */}
            <div className="customer-select-group">
              <span className="customer-label">Customer:</span>
              <select
                className="customer-select"
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                title="Select customer from JSON"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="new">+ Add New Customer...</option>
              </select>

              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '4px 7px', fontSize: '11px' }}
                onClick={() => setShowNewCustomerModal(true)}
                title="Add new customer"
              >
                <UserPlus size={13} />
              </button>
            </div>

            <button type="button" className="btn btn-secondary" onClick={handleAddItem} title="Add Item">
              <Plus size={13} /> Add Row
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNativePrint}
              title="Print via Browser (Vector A4)"
            >
              <Printer size={13} /> Print / Save PDF
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              title="Direct PDF file download"
            >
              <Download size={13} /> {isExporting ? 'Exporting...' : 'Download PDF'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              title="Reset to sample"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="workspace">
        {/* Quick Helpers Bar */}
        <div className="quick-helpers-bar no-print">
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>GST Quick Set:</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '2px 7px', fontSize: '11px' }}
              onClick={() => handleTaxPreset(9, 9)}
            >
              18% (9+9)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '2px 7px', fontSize: '11px' }}
              onClick={() => handleTaxPreset(6, 6)}
            >
              12% (6+6)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '2px 7px', fontSize: '11px' }}
              onClick={() => handleTaxPreset(2.5, 2.5)}
            >
              5% (2.5+2.5)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '2px 7px', fontSize: '11px' }}
              onClick={() => handleTaxPreset(0, 0)}
            >
              0%
            </button>
            <button
              type="button"
              className={`btn ${isInterState ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '2px 7px', fontSize: '11px' }}
              onClick={() =>
                setInvoice((prev) => ({
                  ...prev,
                  taxSettings: { ...prev.taxSettings, isInterState: !prev.taxSettings.isInterState }
                }))
              }
            >
              {isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Intra-State)'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#475569', fontSize: '11px' }}>Text Size:</span>
              <div className="size-pill-group">
                <button
                  type="button"
                  className={`size-pill ${fontSizeScale === 'medium' ? 'active' : ''}`}
                  onClick={() => setFontSizeScale('medium')}
                  title="Default larger text"
                >
                  Medium
                </button>
                <button
                  type="button"
                  className={`size-pill ${fontSizeScale === 'large' ? 'active' : ''}`}
                  onClick={() => setFontSizeScale('large')}
                  title="Large text"
                >
                  Large
                </button>
                <button
                  type="button"
                  className={`size-pill ${fontSizeScale === 'xlarge' ? 'active' : ''}`}
                  onClick={() => setFontSizeScale('xlarge')}
                  title="Extra Large text"
                >
                  XL
                </button>
              </div>
            </div>
            <span className="helper-chip">
              <Sparkles size={11} color="#c5221f" /> Redesigned to match sample
            </span>
          </div>
        </div>

        {/* Invoice Canvas */}
        <div className="invoice-wrapper">
          <div className={`invoice-sheet size-${fontSizeScale}`} ref={invoiceSheetRef}>
            {/* Top Header: Company details (Left) & Tax Invoice Meta (Right) */}
            <div className="invoice-header-grid">
              {/* Left: GEETA INDUSTRIES in Crimson Serif Italic */}
              <div style={{ maxWidth: '440px' }}>
                <div className="company-title-red">
                  {renderField(
                    invoice.company.name,
                    (e) => setInvoice((prev) => ({ ...prev, company: { ...prev.company, name: e.target.value } })),
                    'GEETA INDUSTRIES',
                    'company-title-red'
                  )}
                </div>
                <div className="company-contact-lines">
                  <div>
                    {renderField(
                      invoice.company.addressLine1,
                      (e) =>
                        setInvoice((prev) => ({ ...prev, company: { ...prev.company, addressLine1: e.target.value } })),
                      'Address line 1'
                    )}
                  </div>
                  <div>
                    {renderField(
                      invoice.company.cityPin,
                      (e) =>
                        setInvoice((prev) => ({ ...prev, company: { ...prev.company, cityPin: e.target.value } })),
                      'City PIN'
                    )}
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    Phone: {renderField(
                      invoice.company.phone,
                      (e) => setInvoice((prev) => ({ ...prev, company: { ...prev.company, phone: e.target.value } })),
                      'Phone'
                    )}
                  </div>
                  <div>
                    Email: <span className="company-email-link">
                      {renderField(
                        invoice.company.email,
                        (e) => setInvoice((prev) => ({ ...prev, company: { ...prev.company, email: e.target.value } })),
                        'Email'
                      )}
                    </span>
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    GSTNo.: {renderField(
                      invoice.company.gstNo,
                      (e) => setInvoice((prev) => ({ ...prev, company: { ...prev.company, gstNo: e.target.value } })),
                      'GSTIN'
                    )}
                  </div>
                </div>
              </div>

              {/* Right: TAX INVOICE & Meta */}
              <div style={{ textAlign: 'right' }}>
                <div className="tax-invoice-heading">
                  {renderField(
                    invoice.meta.title,
                    (e) => setInvoice((prev) => ({ ...prev, meta: { ...prev.meta, title: e.target.value } })),
                    'TAX INVOICE',
                    'tax-invoice-heading text-right'
                  )}
                </div>
                <div className="invoice-meta-lines">
                  <div className="meta-row">
                    <span style={{ fontWeight: 600 }}>INVOICE NO.:</span>
                    <span style={{ fontWeight: 700, minWidth: '70px', textAlign: 'right' }}>
                      {renderField(
                        invoice.meta.invoiceNo,
                        (e) => setInvoice((prev) => ({ ...prev, meta: { ...prev.meta, invoiceNo: e.target.value } })),
                        '#1278',
                        'text-right'
                      )}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span style={{ fontWeight: 600 }}>DATE:</span>
                    <span style={{ fontWeight: 700, minWidth: '70px', textAlign: 'right' }}>
                      {renderField(
                        invoice.meta.date,
                        (e) => setInvoice((prev) => ({ ...prev, meta: { ...prev.meta, date: e.target.value } })),
                        '05/01/26',
                        'text-right'
                      )}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span style={{ fontWeight: 600 }}>CHALLAN NO.:</span>
                    <span style={{ fontWeight: 700, minWidth: '70px', textAlign: 'right' }}>
                      {renderField(
                        invoice.meta.challanNo,
                        (e) => setInvoice((prev) => ({ ...prev, meta: { ...prev.meta, challanNo: e.target.value } })),
                        '1295',
                        'text-right'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Section: BILL TO & SHIP TO */}
            <div className="customer-section-grid">
              {/* BILL TO */}
              <div>
                <div className="party-title">BILL TO:</div>
                <div className="party-name">
                  {renderField(
                    invoice.customer.name,
                    (e) => setInvoice((prev) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } })),
                    'Customer Name'
                  )}
                </div>
                <div>
                  {renderField(
                    invoice.customer.address,
                    (e) => setInvoice((prev) => ({ ...prev, customer: { ...prev.customer, address: e.target.value } })),
                    'Address',
                    '',
                    true
                  )}
                </div>
                <div style={{ marginTop: '2px' }}>
                  <strong>GSTNo. </strong>
                  {renderField(
                    invoice.customer.gstNo,
                    (e) => setInvoice((prev) => ({ ...prev, customer: { ...prev.customer, gstNo: e.target.value } })),
                    'Customer GSTIN'
                  )}
                </div>
              </div>

              {/* SHIP TO */}
              <div style={{ paddingLeft: '16px' }}>
                <div className="party-title">SHIP TO:</div>
                <div>
                  {renderField(
                    invoice.customer.shipTo,
                    (e) => setInvoice((prev) => ({ ...prev, customer: { ...prev.customer, shipTo: e.target.value } })),
                    'SAME AS GIVEN',
                    '',
                    true
                  )}
                </div>
              </div>
            </div>

            {/* Central Table */}
            <table className="modern-invoice-table">
              <thead>
                <tr className="table-head-row">
                  <th style={{ width: '36%', textAlign: 'center' }}>DESCRIPTION OF GOODS</th>
                  <th style={{ width: '13%', textAlign: 'center' }}>HSN CODE</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>QTY</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>UNITS</th>
                  <th style={{ width: '13%', textAlign: 'center' }}>RATE</th>
                  <th style={{ width: '16%', textAlign: 'center' }}>AMOUNT INR</th>
                  {!isExporting && <th style={{ width: '26px' }} className="no-print"></th>}
                </tr>
              </thead>
              <tbody>
                {/* Item Rows (without horizontal lines between rows) */}
                {invoice.items.map((item, idx) => {
                  const rowAmount = calculateRowAmount(item.qty, item.rate);
                  return (
                    <tr key={item.id || idx} className="item-data-row">
                      <td style={{ textAlign: 'left' }}>
                        {renderField(
                          item.description,
                          (e) => handleItemChange(idx, 'description', e.target.value),
                          'Item description'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {renderField(
                          item.hsn,
                          (e) => handleItemChange(idx, 'hsn', e.target.value),
                          '84879000',
                          'text-center'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isExporting ? (
                          <div className="pure-text text-center">{item.qty}</div>
                        ) : (
                          <>
                            <div className="pure-text print-only-text text-center" style={{ display: 'none' }}>
                              {item.qty}
                            </div>
                            <input
                              type="number"
                              step="any"
                              className="editable-input text-center"
                              value={item.qty}
                              onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            />
                          </>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {renderField(
                          item.units,
                          (e) => handleItemChange(idx, 'units', e.target.value),
                          'PC',
                          'text-center'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isExporting ? (
                          <div className="pure-text text-center">{item.rate}</div>
                        ) : (
                          <>
                            <div className="pure-text print-only-text text-center" style={{ display: 'none' }}>
                              {item.rate}
                            </div>
                            <input
                              type="number"
                              step="any"
                              className="editable-input text-center"
                              value={item.rate}
                              onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            />
                          </>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                        {rowAmount.toFixed(2)}
                      </td>
                      {!isExporting && (
                        <td className="no-print" style={{ textAlign: 'center', borderRight: 'none' }}>
                          {invoice.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="btn-danger-outline"
                              title="Delete row"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Empty Filler Rows for Table Height */}
                {blankRows.map((_, i) => (
                  <tr key={`blank-${i}`} className="empty-filler-row">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}>&nbsp;</td>}
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="calc-row">
                  <td colSpan={4} style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, borderRight: '1px solid #000' }}>
                    Total
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, paddingRight: '12px' }}>
                    {subtotal.toFixed(0)}
                  </td>
                  {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                </tr>

                {/* CGST Row */}
                {!isInterState && (
                  <tr className="calc-row">
                    <td colSpan={3} style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}>
                      CGST: @
                    </td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000' }}>
                      {isExporting ? (
                        <span>{cgstRate}%</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <input
                            type="number"
                            step="0.5"
                            className="editable-input text-center"
                            style={{ width: '38px', height: '22px' }}
                            value={cgstRate}
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                taxSettings: { ...prev.taxSettings, cgstRate: e.target.value }
                              }))
                            }
                          />
                          <span>%</span>
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                      {cgstAmount.toFixed(2)}
                    </td>
                    {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                  </tr>
                )}

                {/* SGST Row */}
                {!isInterState && (
                  <tr className="calc-row">
                    <td colSpan={3} style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}>
                      SGST: @
                    </td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000' }}>
                      {isExporting ? (
                        <span>{sgstRate}%</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <input
                            type="number"
                            step="0.5"
                            className="editable-input text-center"
                            style={{ width: '38px', height: '22px' }}
                            value={sgstRate}
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                taxSettings: { ...prev.taxSettings, sgstRate: e.target.value }
                              }))
                            }
                          />
                          <span>%</span>
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                      {sgstAmount.toFixed(2)}
                    </td>
                    {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                  </tr>
                )}

                {/* IGST Row (if inter-state) */}
                {isInterState && (
                  <tr className="calc-row">
                    <td colSpan={3} style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}>
                      IGST: @
                    </td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #000' }}>
                      <span>{igstRate}%</span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                      {igstAmount.toFixed(2)}
                    </td>
                    {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                  </tr>
                )}

                {/* PACKING Row */}
                <tr className="calc-row">
                  <td colSpan={3} style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}>
                    PACKING
                  </td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #000' }}>
                    {renderField(
                      packingCharge,
                      (e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          taxSettings: { ...prev.taxSettings, packingCharge: e.target.value }
                        })),
                      '--',
                      'text-center'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                    {numPacking > 0 ? numPacking.toFixed(2) : ''}
                  </td>
                  {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                </tr>

                {/* TRANSPORT Row */}
                <tr className="calc-row">
                  <td colSpan={3} style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}>
                    TRANSPORT:
                  </td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #000' }}>
                    {renderField(
                      transportCharge,
                      (e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          taxSettings: { ...prev.taxSettings, transportCharge: e.target.value }
                        })),
                      'Actual',
                      'text-center'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                    {numTransport > 0 ? numTransport.toFixed(2) : ''}
                  </td>
                  {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                </tr>

                {/* ROUND UP Row */}
                <tr className="calc-row">
                  <td colSpan={3} style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}>
                    ROUND UP:
                  </td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid #000' }}>
                    {renderField(
                      manualRoundOff,
                      (e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          taxSettings: { ...prev.taxSettings, manualRoundOff: e.target.value }
                        })),
                      '--',
                      'text-center'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                    {roundOffAmount !== 0 ? roundOffAmount.toFixed(2) : ''}
                  </td>
                  {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                </tr>

                {/* TOTAL AMOUNT Row */}
                <tr className="grand-total-calc-row">
                  <td
                    colSpan={4}
                    style={{ textAlign: 'right', borderRight: '1px solid #000', paddingRight: '8px', whiteSpace: 'nowrap' }}
                  >
                    TOTAL AMOUNT:
                  </td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                    {grandTotal.toFixed(2)}
                  </td>
                  {!isExporting && <td className="no-print" style={{ borderRight: 'none' }}></td>}
                </tr>
              </tbody>
            </table>

            {/* Footer 3-Column Box */}
            <div className="invoice-footer-container">
              {/* Left Column: Words & Instructions */}
              <div className="footer-col">
                <div style={{ fontWeight: 600 }}>Amount chargeable (in words)</div>
                <div style={{ marginTop: '2px', lineHeight: 1.35 }}>
                  {amountInWords}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <strong>Special instructions: </strong>
                  {renderField(
                    invoice.footer.specialInstructions,
                    (e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, specialInstructions: e.target.value }
                      })),
                    'Special instructions'
                  )}
                </div>
              </div>

              {/* Middle Column: Bank Details */}
              <div className="footer-col">
                <div style={{ fontWeight: 700 }}>Our Bank Details:</div>
                <div>
                  {renderField(
                    invoice.footer.bankName,
                    (e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, bankName: e.target.value }
                      })),
                    'Bank Name'
                  )}
                </div>
                <div>
                  {renderField(
                    invoice.footer.bankBranch,
                    (e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, bankBranch: e.target.value }
                      })),
                    'Branch'
                  )}
                </div>
                <div style={{ marginTop: '2px' }}>
                  <strong>A/c no.: </strong>
                  {renderField(
                    invoice.footer.accountNo,
                    (e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, accountNo: e.target.value }
                      })),
                    'Account No'
                  )}
                </div>
                <div>
                  <strong>IFSC Code: </strong>
                  {renderField(
                    invoice.footer.ifsc,
                    (e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, ifsc: e.target.value }
                      })),
                    'IFSC'
                  )}
                </div>
              </div>

              {/* Right Column: Signatory */}
              <div className="footer-col signatory-col">
                <div>
                  <strong>For, </strong>
                  <span style={{ fontWeight: 800 }}>
                    {renderField(
                      invoice.footer.forCompany,
                      (e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, forCompany: e.target.value }
                        })),
                      'Company Name',
                      'text-right'
                    )}
                  </span>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '10px', color: '#374151' }}>
                    {renderField(
                      invoice.footer.signatoryTitle,
                      (e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, signatoryTitle: e.target.value }
                        })),
                      'Title',
                      'text-right'
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '11px', marginTop: '2px' }}>
                    {renderField(
                      invoice.footer.signatoryName,
                      (e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, signatoryName: e.target.value }
                        })),
                      'Signatory',
                      'text-right'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Add New Customer */}
      {showNewCustomerModal && (
        <div className="modal-overlay no-print" onClick={() => setShowNewCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add New Customer</h3>
            <form onSubmit={handleSaveNewCustomer}>
              <div className="form-group">
                <label className="form-label">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. ABC Engineering Pvt. Ltd."
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Full office address, City, PIN"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={newCustomer.gstNo}
                  onChange={(e) => setNewCustomer({ ...newCustomer, gstNo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shipping Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Defaults to SAME AS GIVEN"
                  value={newCustomer.shipTo}
                  onChange={(e) => setNewCustomer({ ...newCustomer, shipTo: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewCustomerModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
