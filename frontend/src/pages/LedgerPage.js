import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getLedger, downloadLedgerPdf, getBuyers, getOrder } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportTableToPDF, exportChartToImage } from '../utils/exportUtils';
import { formatDate, formatDateFilename } from '../utils/dateUtils';

const LedgerPage = () => {
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  
  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await getBuyers(1, 100);
      setBuyers(response.data.data);
    } catch (error) {
      showToast('Failed to load buyers', 'error');
    }
  };

  const handleGenerateLedger = async () => {
    if (!selectedBuyer) {
      showToast('Please select a buyer', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await getLedger(selectedBuyer, startDate, endDate);
      setLedgerData(response.data);
      showToast('Ledger generated successfully', 'success');
    } catch (error) {
      showToast('Failed to generate ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedBuyer) {
      showToast('Please select a buyer', 'warning');
      return;
    }

    try {
      const response = await downloadLedgerPdf(selectedBuyer, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ledger_${selectedBuyer}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('Ledger PDF downloaded', 'success');
    } catch (error) {
      showToast('Failed to download ledger PDF', 'error');
    }
  };

  const handleExportPDF = () => {
    if (!ledgerData) {
      showToast('Please generate ledger first', 'warning');
      return;
    }
    exportTableToPDF('ledgerTable', `Ledger_${ledgerData.buyer.company_name}.pdf`);
    showToast('Exported to PDF', 'success');
  };

  const handleExportPNG = () => {
    if (!ledgerData) {
      showToast('Please generate ledger first', 'warning');
      return;
    }
    exportChartToImage('ledgerTable', `Ledger_${ledgerData.buyer.company_name}.png`);
    showToast('Exported to PNG', 'success');
  };

  const handleViewOrder = async (entry) => {
    if (!entry.order_id) {
      showToast('No order associated with this entry', 'info');
      return;
    }

    setOrderLoading(true);
    try {
      const response = await getOrder(entry.order_id);
      setViewingOrder(response.data);
      setShowOrderModal(true);
    } catch (error) {
      showToast('Failed to load order details', 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">Party Ledger</h1>
            <p className="text-gray-200">View detailed transaction history for each buyer/party</p>
          </div>

          {/* Filters Card */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-6 mb-6">
            <h2 className="text-xl font-bold text-[#00D4FF] mb-4">Generate Ledger</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Buyer Selection */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Select Buyer/Party *</label>
                <select
                  value={selectedBuyer}
                  onChange={(e) => setSelectedBuyer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Choose a buyer...</option>
                  {buyers.map(buyer => (
                    <option key={buyer.id} value={buyer.id}>
                      {buyer.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Start Date (Optional)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Generate Button */}
              <div className="flex items-end">
                <button
                  onClick={handleGenerateLedger}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-2 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : '📊 Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Display */}
          {ledgerData && (
            <>
              {/* Buyer Info Card */}
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#00D4FF] mb-3">Account Details</h3>
                    <p className="text-white"><strong>Company:</strong> {ledgerData.buyer.company_name}</p>
                    <p className="text-white"><strong>Address:</strong> {ledgerData.buyer.address || 'N/A'}, {ledgerData.buyer.city || ''}</p>
                    <p className="text-white"><strong>Phone:</strong> {ledgerData.buyer.phone}</p>
                    <p className="text-white"><strong>Email:</strong> {ledgerData.buyer.email}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#00D4FF] mb-3">Tax Information</h3>
                    <p className="text-white"><strong>GST Number:</strong> {ledgerData.buyer.gst_number || 'N/A'}</p>
                    <p className="text-white"><strong>NTN Number:</strong> {ledgerData.buyer.ntn_number || 'N/A'}</p>
                    <p className="text-white mt-4"><strong>Date Range:</strong> {ledgerData.date_range.start !== 'All' ? `${ledgerData.date_range.start} to ${ledgerData.date_range.end}` : 'All Transactions'}</p>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full" id="ledgerTable">
                    <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C] text-black">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">Reference</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-black">Debit</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-black">Credit</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-black">Sales Tax</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-black">Income Tax</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-black">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ledgerData.entries.map((entry, index) => (
                        <tr
                          key={index}
                          onClick={() => handleViewOrder(entry)}
                          className={`${index % 2 === 0 ? 'bg-white bg-opacity-60' : 'bg-blue-50 bg-opacity-60'} hover:bg-blue-100 hover:bg-opacity-80 transition-all duration-200 cursor-pointer`}
                        >
                          <td className="px-4 py-3 text-sm text-black font-semibold">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-[#00D4FF]">
                            {entry.reference}
                          </td>
                          <td className="px-4 py-3 text-sm text-black font-semibold">
                            {entry.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-black font-semibold">
                            {entry.debit > 0 ? `₨ ${entry.debit.toLocaleString('en-PK', {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-800 font-semibold">
                            {entry.credit > 0 ? `₨ ${entry.credit.toLocaleString('en-PK', {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-black font-semibold">
                            {entry.sales_tax > 0 ? `₨ ${entry.sales_tax.toLocaleString('en-PK', {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-purple-900 font-semibold">
                            {entry.income_tax > 0 ? `₨ ${entry.income_tax.toLocaleString('en-PK', {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${entry.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₨ {entry.balance.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Card */}
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-6">
                <h3 className="text-xl font-bold text-[#00D4FF] mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-[#3A3F8C] bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Opening Balance</p>
                    <p className="text-2xl font-bold text-[#00D4FF]">
                      ₨ {ledgerData.summary.opening_balance.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-[#3A3F8C] bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Sales (Debits)</p>
                    <p className="text-2xl font-bold text-[#00D4FF]">
                      ₨ {ledgerData.summary.total_debits.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-green-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Payments (Credits)</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₨ {ledgerData.summary.total_credits.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-blue-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Sales Tax</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₨ {(ledgerData.summary.total_sales_tax || 0).toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-purple-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Income Tax</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₨ {(ledgerData.summary.total_income_tax || 0).toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className={`${ledgerData.summary.closing_balance > 0 ? 'bg-red-50' : 'bg-green-50'} bg-opacity-60 rounded-lg p-4`}>
                    <p className="text-sm text-gray-600 mb-1">Closing Balance (Due)</p>
                    <p className={`text-2xl font-bold ${ledgerData.summary.closing_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₨ {ledgerData.summary.closing_balance.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!ledgerData && !loading && (
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">No Ledger Generated</h3>
              <p className="text-gray-600">Select a buyer and click "Generate" to view ledger details</p>
            </div>
          )}

          {/* Order Details Modal */}
          {showOrderModal && viewingOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-90 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-[#17144B]">📦 Order Details</h2>
                
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs text-gray-600 font-semibold">ORDER ID</p>
                    <p className="text-lg font-bold text-[#17144B]">#{viewingOrder.id}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs text-gray-600 font-semibold">ORDER NUMBER</p>
                    <p className="text-lg font-bold text-[#17144B]">{viewingOrder.order_number}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs text-gray-600 font-semibold">DATE</p>
                    <p className="text-lg font-bold text-[#17144B]">{viewingOrder.order_date}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs text-gray-600 font-semibold">STATUS</p>
                    <p className={`text-lg font-bold ${
                      viewingOrder.status === 'paid' ? 'text-green-600' :
                      viewingOrder.status === 'partial' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {viewingOrder.status?.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-[#17144B] mb-2">👤 Buyer Information</h3>
                  <p className="text-sm text-gray-700"><strong>Name:</strong> {viewingOrder.buyer_name}</p>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-[#17144B] mb-3">📋 Items</h3>
                  <div className="space-y-2">
                    {viewingOrder.items && viewingOrder.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm font-semibold text-[#17144B]">{item.item_name}</p>
                        <p className="text-xs text-gray-600">Code: {item.item_code}</p>
                        <div className="flex justify-between mt-2">
                          <span className="text-sm text-gray-700">Qty: {item.quantity}</span>
                          <span className="text-sm font-semibold text-[#17144B]">₨ {item.line_total?.toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-[#17144B]">₨ {viewingOrder.subtotal?.toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Tax ({viewingOrder.tax_rate}%):</span>
                    <span className="font-semibold text-[#17144B]">₨ {viewingOrder.tax_amount?.toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span className="text-[#17144B]">Total:</span>
                    <span className="text-[#17144B]">₨ {viewingOrder.total_amount?.toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Notes */}
                {viewingOrder.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-[#17144B] mb-2">📝 Notes</h3>
                    <p className="text-sm text-gray-700">{viewingOrder.notes}</p>
                  </div>
                )}

                {/* Close Button */}
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
