import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { amountToWords } from '../utils/numberToWords';
import './InvoicePage.css';

// Company configuration
const companyConfig = {
  umarsons: {
    name: 'UMARSONS',
    address: 'P-5284, ST#09 REHMATABAD, SHEIKUPURA ROAD FAISALABAD.',
    logo: '/logo.png',
    watermark: '/watermark.png',
    email: 'umarsons08@gmail.com',
    phone: '0301-7194270',
    whatsapp: '0313-7050844'
  },
  makkah_packages: {
    name: 'MAKKAH PACKAGES',
    address: 'P-5284, ST#09 REHMATABAD, SHEIKUPURA ROAD FAISALABAD.',
    logo: '/assets/templates/makkahpackages/logo.png',
    watermark: '/assets/templates/makkahpackages/watermark.png',
    email: 'makkahpackages08@gmail.com',
    phone: '0301-7194270',
    whatsapp: '0313-7050844'
  }
};

const InvoicePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [companyData, setCompanyData] = useState(companyConfig.umarsons);
  const roundOffAmount = (value) => Math.round(Number(value) || 0);
  const formatRupees = (value) => roundOffAmount(value).toLocaleString('en-PK');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrder(orderId);
        setOrder(response.data);
        
        // Set company configuration based on order's company
        const companyCode = response.data.company_name?.toLowerCase().replace(/\s+/g, '_') || 'umarsons';
        if (companyConfig[companyCode]) {
          setCompanyData(companyConfig[companyCode]);
        }
        
        // Set document title to order number (ID) with STI suffix
        document.title = `${response.data.order_number}-STI`;
        
        setLoading(false);
      } catch (error) {
        showToast('Failed to load invoice', 'error');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, showToast]);

  const handlePrint = () => {
    window.print();
  };


  if (loading) {
    return <div className="invoice-loading">Loading invoice...</div>;
  }

  if (!order) {
    return (
      <div className="invoice-error">
        <p>Invoice not found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Calculate totals
  const subtotal = order.items?.reduce((sum, item) => sum + item.line_total, 0) || 0;
  const totalTax = subtotal * (order.tax_rate / 100);
  const totalAmount = subtotal + totalTax;

  // Format date
  const orderDate = new Date(order.order_date);
  const orderDateStr = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  const dueDate = new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const MAX_TABLE_ROWS = 12;
  const itemPages = [(order.items || []).slice(0, MAX_TABLE_ROWS)];
  const summaryPageIndex = 0;

  // Render header component
  const renderHeader = () => (
    <div className="invoice-header">
      <div className="logo-container">
        <img src={companyData.logo} alt="Company Logo" className="company-logo" />
      </div>
      <div className="company-info">
        <h1 className="company-name">{companyData.name}</h1>
        <p className="company-address"><strong>{companyData.address}</strong></p>
      </div>
    </div>
  );

  // Render footer component
  const renderFooter = () => (
    <div className="invoice-footer">
      <p><strong>Thank you for your business!</strong></p>
      <p><strong>Payment Terms:</strong> Net 30 Days</p>
      <p>For queries: {companyData.email} | Cell: {companyData.phone} | WhatsApp: {companyData.whatsapp}</p>
      <p>This is a computer-generated invoice and does not require a signature.</p>
    </div>
  );

  return (
    <div className="invoice-page">
      {/* Print/Save Controls */}
      <div className="invoice-controls print-hidden">
        <button onClick={handlePrint} className="btn-print">
          🖨️ Print
        </button>
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back
        </button>
      </div>

      {/* Render each page */}
      <div className="invoice-document">
        {itemPages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className={`invoice-container ${pageIndex < itemPages.length - 1 ? 'page-break' : 'page-last'}`}
          >
          {/* Watermark */}
          <div className="watermark" style={{backgroundImage: `url('${companyData.watermark}')`}}></div>

          <div className="invoice-content">
            {/* Header on every page */}
            {renderHeader()}

            {/* Invoice Title */}
            <div className="invoice-title">Sales Tax Invoice</div>

            {/* Details Grid - Only on first page */}
            {pageIndex === 0 && (
              <div className="details-grid">
                <div className="details-section">
                  <h3>Bill To:</h3>
                  <p className="buyer-name"><strong>{order.buyer_name}</strong></p>
                  <p><span className="label">City:</span> {order.buyer?.city || 'N/A'}</p>
                  <p><span className="label">NTN:</span> {order.buyer?.ntn_number || 'N/A'}</p>
                  <p><span className="label">GST #:</span> {order.buyer?.gst_number || 'N/A'}</p>
                  <p><span className="label">Phone:</span> {order.buyer?.phone || 'N/A'}</p>
                </div>
                <div className="details-section">
                  <h3>Invoice Details:</h3>
                  <p><span className="label">ID#:</span> {order.order_number}</p>
                  <p><span className="label">Date:</span> {orderDateStr}</p>
                  <p><span className="label">Due Date:</span> {dueDateStr}</p>
                </div>
              </div>
            )}

            {/* Items Table for this page */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '3%', textAlign: 'center' }}>#</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Code</th>
                  <th style={{ width: '28%', textAlign: 'center' }}>Description</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Rate</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>Tax %</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Amount Before Tax</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Amount After Tax</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: MAX_TABLE_ROWS }, (_, idx) => {
                  const item = pageItems[idx];
                  const amountBeforeTax = item ? item.line_total : 0;
                  const taxAmount = item ? (amountBeforeTax * (order.tax_rate / 100)) : 0;
                  const amountAfterTax = amountBeforeTax + taxAmount;
                  return (
                    <tr key={item?.id || `blank-${idx}`}>
                      <td>{idx + 1}</td>
                      <td style={{ textAlign: 'center' }}>{item ? (item.item?.code || item.code || 'N/A') : ''}</td>
                      <td>{item ? (item.item?.name || item.name || 'Item') : ''}</td>
                      <td style={{ textAlign: 'center' }}>{item ? item.quantity : ''}</td>
                      <td style={{ textAlign: 'right' }}>{item ? `₨ ${formatRupees(item.item?.unit_price || item.unit_price || 0)}` : ''}</td>
                      <td style={{ textAlign: 'center' }}>{item ? `${order.tax_rate}%` : ''}</td>
                      <td style={{ textAlign: 'right' }}>{item ? `₨ ${formatRupees(amountBeforeTax)}` : ''}</td>
                      <td style={{ textAlign: 'right' }}>{item ? `₨ ${formatRupees(amountAfterTax)}` : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary, Amount in Words, Tax Breakdown - Only on last page */}
            {pageIndex === summaryPageIndex && (
              <div className="invoice-bottom">
                {/* Summary Section */}
                <div className="summary-section">
                  <div className="summary-row subtotal">
                    <span>Subtotal (Before Tax):</span>
                    <span>₨ {formatRupees(subtotal)}</span>
                  </div>
                  <div className="summary-row tax">
                    <span>Sales Tax ({order.tax_rate}%):</span>
                    <span>₨ {formatRupees(totalTax)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Additional Charges:</span>
                    <span>₨ 0</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL AMOUNT:</span>
                    <span>₨ {formatRupees(totalAmount)}</span>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="amount-in-words">
                  <strong>Amount in Words:</strong> {amountToWords(roundOffAmount(totalAmount))}
                </div>

                {/* Tax Breakdown */}
                <div className="tax-breakdown">
                  <h4>Sales Tax Breakdown</h4>
                  <table>
                    <tbody>
                      <tr>
                        <td>Base Amount (Before Tax):</td>
                        <td style={{ textAlign: 'right' }}>₨ {formatRupees(subtotal)}</td>
                      </tr>
                      <tr>
                        <td>GST @ {order.tax_rate}%:</td>
                        <td style={{ textAlign: 'right' }}>₨ {formatRupees(totalTax)}</td>
                      </tr>
                      <tr>
                        <td style={{ borderTop: '1px solid #17144B', paddingTop: '8px' }}>Total Tax Amount:</td>
                        <td style={{ borderTop: '1px solid #17144B', paddingTop: '8px', textAlign: 'right' }}>₨ {formatRupees(totalTax)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer on every page */}
            {renderFooter()}
          </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoicePage;
