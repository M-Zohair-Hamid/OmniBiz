import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

const BillPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taxMode = searchParams.get('tax') || 'include'; // 'include' or 'exclude'
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
        
        // Set document title to order number (ID) with BILL suffix
        document.title = `${response.data.order_number}-BILL`;
        
        setLoading(false);
      } catch (error) {
        showToast('Failed to load bill', 'error');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, showToast]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="invoice-loading">Loading bill...</div>;
  }

  if (!order) {
    return (
      <div className="invoice-error">
        <p>Bill not found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Calculate totals based on tax mode
  const subtotal = order.items?.reduce((sum, item) => sum + item.line_total, 0) || 0;
  const totalTax = subtotal * (order.tax_rate / 100);
  
  let displayTotal, displayAmountInWords;
  if (taxMode === 'include') {
    displayTotal = subtotal + totalTax;
    displayAmountInWords = amountToWords(roundOffAmount(displayTotal));
  } else {
    displayTotal = subtotal;
    displayAmountInWords = amountToWords(roundOffAmount(displayTotal));
  }

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
      {/* Controls */}
      <div className="invoice-controls print-hidden">
        <button onClick={handlePrint} className="btn-print">🖨️ Print</button>
        <button onClick={() => navigate(-1)} className="btn-back">← Back</button>
      </div>

      {/* Invoice pages */}
      <div className="invoice-document">
        {itemPages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className={`invoice-container ${pageIndex < itemPages.length - 1 ? 'page-break' : 'page-last'}`}
          >
            {/* Watermark */}
            <div 
              className="watermark" 
              style={{ backgroundImage: `url(${companyData.watermark})` }}
            ></div>

            <div className="invoice-content">
            {/* Header */}
            {renderHeader()}

            {/* Title */}
            <div className="invoice-title">
              BILL {taxMode === 'include' ? '(INCLUDING TAX)' : '(EXCLUDING TAX)'}
            </div>

            {/* Details Grid - Only on first page */}
            {pageIndex === 0 && (
              <div className="details-grid">
                <div className="details-section">
                  <h3>Bill To:</h3>
                  <p className="buyer-name">{order.buyer?.company_name || 'N/A'}</p>
                  <p><strong>City:</strong> {order.buyer?.city || 'N/A'}</p>
                  <p><strong>NTN:</strong> {order.buyer?.ntn_number || 'N/A'}</p>
                  <p><strong>GST #:</strong> {order.buyer?.gst_number || 'N/A'}</p>
                  <p><strong>Phone:</strong> {order.buyer?.phone || 'N/A'}</p>
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
                  <th style={{ width: '35%', textAlign: 'center' }}>Description</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Rate</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: MAX_TABLE_ROWS }, (_, idx) => {
                  const item = pageItems[idx];
                  const itemAmount = item
                    ? (taxMode === 'include'
                      ? item.line_total + (item.line_total * (order.tax_rate / 100))
                      : item.line_total)
                    : 0;

                  return (
                    <tr key={item?.id || `blank-${idx}`}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ textAlign: 'center' }}>{item ? (item.item?.code || 'N/A') : ''}</td>
                      <td>{item ? (item.item?.name || 'N/A') : ''}</td>
                      <td style={{ textAlign: 'center' }}>{item ? item.quantity : ''}</td>
                      <td style={{ textAlign: 'right' }}>{item ? `₨ ${formatRupees(item.unit_price)}` : ''}</td>
                      <td style={{ textAlign: 'right' }}>{item ? `₨ ${formatRupees(itemAmount)}` : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary, Amount in Words - Only on last page */}
            {pageIndex === summaryPageIndex && (
              <div className="invoice-bottom">
                {/* Summary Section */}
                <div className="summary-section">
                  <div className="summary-row subtotal">
                    <span>Subtotal:</span>
                    <span>₨ {formatRupees(subtotal)}</span>
                  </div>
                  {taxMode === 'include' && (
                    <div className="summary-row tax">
                      <span>Sales Tax ({order.tax_rate}%):</span>
                      <span>₨ {formatRupees(totalTax)}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Additional Charges:</span>
                    <span>₨ 0</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL AMOUNT:</span>
                    <span>₨ {formatRupees(displayTotal)}</span>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="amount-in-words">
                  <strong>Amount in Words:</strong> {displayAmountInWords}
                </div>
              </div>
            )}

            </div>

            {/* Footer on every page */}
            {renderFooter()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillPage;
