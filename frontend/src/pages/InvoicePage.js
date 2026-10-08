import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { amountToWords } from '../utils/numberToWords';
import { resolveLogoUrl } from '../utils/imageUtils';
import './InvoicePage.css';

const InvoicePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState({
    name: 'BUSINESS COMPANY',
    address: 'Business District, City, Country',
    logo: null,
    email: 'support@company.local',
    phone: '+1-800-0000000',
    whatsapp: '+1-800-0000000'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch business settings
        const token = localStorage.getItem('token');
        const settingsResponse = await fetch('http://localhost:5000/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          setCompanyData({
            name: settings.business_name || 'BUSINESS COMPANY',
            address: settings.address || 'Business District, City, Country',
            logo: resolveLogoUrl(settings.logo_url),
            email: settings.email || 'support@company.local',
            phone: settings.phone || '+1-800-0000000',
            whatsapp: settings.whatsapp || '+1-800-0000000'
          });
        }

        // Fetch order
        const response = await getOrder(orderId);
        setOrder(response.data);
        
        // Set document title to order number (ID) with STI suffix
        document.title = `${response.data.order_number}-STI`;
        
        setLoading(false);
      } catch (error) {
        showToast('Failed to load invoice', 'error');
        setLoading(false);
      }
    };

    fetchData();
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

  // Pagination: Split items into pages (approximately 15 items per page for A4)
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
      {companyData.logo && (
        <div className="logo-container">
          <img src={companyData.logo} alt="Company Logo" className="company-logo" />
        </div>
      )}
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
          Print
        </button>
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back
        </button>
      </div>

      {/* Render each page */}
      <div className="invoice-document">
        {itemPages.map((pageItems, pageIndex) => (
          <div key={pageIndex} className="invoice-container">
          {/* Watermark - Same logo with opacity */}
          {companyData.logo && (
            <div className="watermark" style={{backgroundImage: `url('${companyData.logo}')`}}></div>
          )}

          <div className="invoice-content">
            {/* Header on every page */}
            {renderHeader()}

            {/* Invoice Title */}
            <div className="invoice-title">Sales Tax Invoice {itemPages.length > 1 && `(Page ${pageIndex + 1} of ${itemPages.length})`}</div>

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
                {pageItems.map((item, idx) => {
                  const globalIndex = pageIndex * ITEMS_PER_PAGE + idx;
                  const amountBeforeTax = item.line_total;
                  const taxAmount = amountBeforeTax * (order.tax_rate / 100);
                  const amountAfterTax = amountBeforeTax + taxAmount;
                  return (
                    <tr key={idx}>
                      <td>{globalIndex + 1}</td>
                      <td style={{ textAlign: 'center' }}>{item.item?.code || item.code || 'N/A'}</td>
                      <td>{item.item?.name || item.name || 'Item'}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₨ {(item.item?.unit_price || item.unit_price || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{order.tax_rate}%</td>
                      <td style={{ textAlign: 'right' }}>₨ {amountBeforeTax.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₨ {amountAfterTax.toFixed(2)}</td>
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
                    <span>₨ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row tax">
                    <span>Sales Tax ({order.tax_rate}%):</span>
                    <span>₨ {totalTax.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Additional Charges:</span>
                    <span>₨ 0.00</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL AMOUNT:</span>
                    <span>₨ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="amount-in-words">
                  <strong>Amount in Words:</strong> {amountToWords(totalAmount)}
                </div>

                {/* Tax Breakdown */}
                <div className="tax-breakdown">
                  <h4>Sales Tax Breakdown</h4>
                  <table>
                    <tbody>
                      <tr>
                        <td>Base Amount (Before Tax):</td>
                        <td style={{ textAlign: 'right' }}>₨ {subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>GST @ {order.tax_rate}%:</td>
                        <td style={{ textAlign: 'right' }}>₨ {totalTax.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ borderTop: '1px solid #0f172a', paddingTop: '8px' }}>Total Tax Amount:</td>
                        <td style={{ borderTop: '1px solid #0f172a', paddingTop: '8px', textAlign: 'right' }}>₨ {totalTax.toFixed(2)}</td>
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