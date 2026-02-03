import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getOrder } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { amountToWords } from '../utils/numberToWords';
import './InvoicePage.css';

const BillPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taxMode = searchParams.get('tax') || 'include'; // 'include' or 'exclude'
  const { showToast } = useContext(ToastContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const [companyData, setCompanyData] = useState(companyConfig.umarsons);

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
    displayAmountInWords = amountToWords(displayTotal);
  } else {
    displayTotal = subtotal;
    displayAmountInWords = amountToWords(displayTotal);
  }

  // Format date
  const orderDate = new Date(order.order_date);
  const orderDateStr = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  const dueDate = new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  // Pagination: Split items into pages
  const ITEMS_PER_PAGE = 15;
  const MAX_ITEMS_WITH_SUMMARY = 10;
  const itemPages = [];
  if (order.items && order.items.length > 0) {
    for (let i = 0; i < order.items.length; i += ITEMS_PER_PAGE) {
      itemPages.push(order.items.slice(i, i + ITEMS_PER_PAGE));
    }
  } else {
    itemPages.push([]);
  }

  // If the last page is too full, move summary to a new page
  let summaryPageIndex = itemPages.length - 1;
  if (itemPages.length > 1 && itemPages[summaryPageIndex].length > MAX_ITEMS_WITH_SUMMARY) {
    itemPages.push([]);
    summaryPageIndex = itemPages.length - 1;
  }

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
      <div>
        {itemPages.map((pageItems, pageIndex) => (
          <div key={pageIndex}>
          <div className="invoice-container">
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
              BILL {taxMode === 'include' ? '(INCLUDING TAX)' : '(EXCLUDING TAX)'} (PAGE {pageIndex + 1} OF {itemPages.length})
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
                {pageItems.map((item, idx) => {
                  const globalIndex = pageIndex * ITEMS_PER_PAGE + idx;
                  const itemAmount = taxMode === 'include' 
                    ? item.line_total + (item.line_total * (order.tax_rate / 100))
                    : item.line_total;
                  
                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center' }}>{globalIndex + 1}</td>
                      <td style={{ textAlign: 'center' }}>{item.item?.code || 'N/A'}</td>
                      <td>{item.item?.name || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₨ {item.unit_price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₨ {itemAmount.toFixed(2)}</td>
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
                    <span>₨ {subtotal.toFixed(2)}</span>
                  </div>
                  {taxMode === 'include' && (
                    <div className="summary-row tax">
                      <span>Sales Tax ({order.tax_rate}%):</span>
                      <span>₨ {totalTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Additional Charges:</span>
                    <span>₨ 0.00</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL AMOUNT:</span>
                    <span>₨ {displayTotal.toFixed(2)}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillPage;
