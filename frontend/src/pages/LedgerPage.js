import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getLedger, getBuyers, getOrder } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/dateUtils';

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

  const handleViewOrder = async (orderId) => {
    setOrderLoading(true);
    try {
      const response = await getOrder(orderId);
      setViewingOrder(response.data);
      setShowOrderModal(true);
    } catch (error) {
      showToast('Failed to load order details', 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  const formatRoundedAmount = (value) => {
    const number = Math.round(Number(value) || 0);
    const lastDigit = number % 10;
    const rounded = lastDigit <= 5 ? number - lastDigit : number + (10 - lastDigit);
    return rounded.toLocaleString('en-PK');
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
            <p className="text-gray-200">View totals for each buyer/party</p>
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
                    <h3 className="text-lg font-bold text-black mb-3">Account Details</h3>
                    <p className="text-black"><strong>Company:</strong> {ledgerData.buyer.company_name}</p>
                    <p className="text-black"><strong>Address:</strong> {ledgerData.buyer.address || 'N/A'}, {ledgerData.buyer.city || ''}</p>
                    <p className="text-black"><strong>Phone:</strong> {ledgerData.buyer.phone}</p>
                    <p className="text-black"><strong>Email:</strong> {ledgerData.buyer.email}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-3">Tax Information</h3>
                    <p className="text-black"><strong>GST Number:</strong> {ledgerData.buyer.gst_number || 'N/A'}</p>
                    <p className="text-black"><strong>NTN Number:</strong> {ledgerData.buyer.ntn_number || 'N/A'}</p>
                    <p className="text-black mt-4"><strong>Date Range:</strong> {ledgerData.date_range.start !== 'All' ? `${ledgerData.date_range.start} to ${ledgerData.date_range.end}` : 'All Transactions'}</p>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-6 mb-6">
                <h3 className="text-xl font-bold text-black mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#3A3F8C] bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm font-bold text-black mb-1">Total Sales</p>
                    <p className="text-2xl font-bold text-[#00D4FF]">
                      ₨ {ledgerData.summary.total_sales.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-green-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm font-bold text-black mb-1">Total Payments</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₨ {ledgerData.summary.total_payments.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className={`${ledgerData.summary.total_due > 0 ? 'bg-red-50' : 'bg-green-50'} bg-opacity-60 rounded-lg p-4`}>
                    <p className="text-sm font-bold text-black mb-1">Due Payment</p>
                    <p className={`text-2xl font-bold ${ledgerData.summary.total_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₨ {ledgerData.summary.total_due.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-purple-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm font-bold text-black mb-1">Total Income Tax</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₨ {(ledgerData.summary.total_income_tax || 0).toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-white">Order-Details</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-white">Amount (Before Tax)</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-white">Amount (After Tax)</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-white">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-white">Due Payment</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-white">Income Tax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ledgerData.orders && ledgerData.orders.map((order, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? 'bg-white bg-opacity-60' : 'bg-blue-50 bg-opacity-60'} hover:bg-blue-100 hover:bg-opacity-80 transition-all`}
                        >
                          <td className="px-4 py-3 text-sm font-bold">
                            <button
                              onClick={() => handleViewOrder(order.order_id)}
                              className="text-[#00D4FF] hover:text-[#00B8E0] hover:underline font-semibold transition-all"
                            >
                              {order.order_number}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-[#17144B]">
                            ₨ {order.subtotal.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-[#17144B]">
                            ₨ {order.total_amount.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'paid' ? 'bg-green-200 text-green-800' :
                              order.status === 'partial' ? 'bg-orange-200 text-orange-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-[#17144B]">
                            ₨ {order.due_payment.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-[#17144B]">
                            ₨ {order.income_tax.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

          {/* Order Details Modal - Right Slide Panel */}
          {showOrderModal && viewingOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex z-50">
              {/* Left Click Area - Closes Modal */}
              <div 
                className="flex-1 cursor-pointer" 
                onClick={() => setShowOrderModal(false)}
              />
              
              {/* Right Side Panel */}
              <div className="w-96 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] backdrop-blur-xl border-l border-white border-opacity-30 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white border-opacity-20 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-white">📋 Order Details</h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-white hover:text-[#00D4FF] text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{scrollbarWidth: 'thin', scrollbarColor: '#00D4FF rgba(0,212,255,0.2)'}}>
                  {/* Order Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-3 border border-white border-opacity-10">
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">Order ID</p>
                      <p className="text-xl font-bold text-[#00D4FF] mt-1">#{viewingOrder.id}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-3 border border-white border-opacity-10">
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">Order Number</p>
                      <p className="text-lg font-bold text-white mt-1 break-words">{viewingOrder.order_number}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-3 border border-white border-opacity-10">
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">Date</p>
                      <p className="text-lg font-bold text-white mt-1">{formatDate(viewingOrder.order_date)}</p>
                    </div>
                    <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-3 border border-white border-opacity-10">
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">Status</p>
                      <p className={`text-lg font-bold mt-1 ${
                        viewingOrder.status === 'paid' ? 'text-green-400' :
                        viewingOrder.status === 'partial' ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {viewingOrder.status?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Buyer Information */}
                  <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-4 border border-white border-opacity-10">
                    <h3 className="font-bold text-white mb-3 text-lg">👤 Buyer Information</h3>
                    <p className="text-base text-gray-200 mb-2"><span className="font-bold">Company:</span> {viewingOrder.buyer_name}</p>
                    <p className="text-base text-gray-200"><span className="font-bold">ID:</span> {viewingOrder.buyer_id}</p>
                  </div>

                  {/* Items List */}
                  <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-4 border border-white border-opacity-10">
                    <h3 className="font-bold text-white mb-3 text-lg">📦 Items</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#00D4FF rgba(0,212,255,0.2)'}}>
                      {viewingOrder.items && viewingOrder.items.map((item, idx) => (
                        <div key={idx} className="bg-white bg-opacity-10 p-3 rounded border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                          <p className="text-sm font-semibold text-white">{item.item?.name || 'Item'}</p>
                          <p className="text-xs text-gray-300 mb-2">Code: {item.item?.code || 'N/A'}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-300">Qty: <strong>{item.quantity}</strong></span>
                            <span className="text-sm font-bold text-[#00D4FF]">₨ {(item.item?.unit_price * item.quantity).toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Unit: ₨ {(item.item?.unit_price).toLocaleString('en-PK', {minimumFractionDigits: 2})}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-4 border border-white border-opacity-10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-300 font-semibold">Subtotal:</span>
                      <span className="font-bold text-gray-200 text-lg">₨ {((viewingOrder.total_amount / (1 + (viewingOrder.tax_rate || 0) / 100)) || 0).toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-300 font-semibold">Tax ({viewingOrder.tax_rate}%):</span>
                      <span className="font-bold text-gray-200 text-lg">₨ {((viewingOrder.total_amount - (viewingOrder.total_amount / (1 + (viewingOrder.tax_rate || 0) / 100))) || 0).toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white border-opacity-20 pt-3">
                      <span className="font-bold text-white text-lg">Total:</span>
                      <span className="font-bold text-emerald-400 text-2xl">₨ {viewingOrder.total_amount?.toLocaleString('en-PK', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {viewingOrder.notes && (
                    <div className="backdrop-blur-sm bg-white bg-opacity-20 rounded-lg p-4 border border-white border-opacity-10">
                      <h3 className="font-bold text-white mb-3 text-lg">📝 Notes</h3>
                      <p className="text-base text-gray-200">{viewingOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Close Button - Footer */}
                <div className="flex-shrink-0 p-6 border-t border-white border-opacity-20">
                  <button 
                    onClick={() => setShowOrderModal(false)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
