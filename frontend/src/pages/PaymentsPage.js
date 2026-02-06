import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getPayments, deletePayment, createPayment, getOrder } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { formatDate, getCurrentDateForInput } from '../utils/dateUtils';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [showCompletePaymentModal, setShowCompletePaymentModal] = useState(false);
  const [completePaymentForm, setCompletePaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    payment_type: 'full',
    payment_date: getCurrentDateForInput(),
    income_tax_rate: '',
    notes: ''
  });
  const roundToNearestTen = (value) => {
    const number = Math.round(Number(value) || 0);
    const lastDigit = number % 10;
    return lastDigit <= 5 ? number - lastDigit : number + (10 - lastDigit);
  };

  const formatRoundedAmount = (value) => roundToNearestTen(value).toLocaleString('en-PK');
  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightText = (text) => {
    const value = String(text ?? '');
    const term = searchTerm.trim();
    if (!term) return value;

    const pattern = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return value.split(pattern).map((part, idx) => {
      const match = part.toLowerCase() === term.toLowerCase();
      return match ? <mark key={idx} className="bg-yellow-300 text-gray-900 px-0.5 rounded">{part}</mark> : part;
    });
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    filterPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, searchTerm]);

  // Set page title based on company name
  useEffect(() => {
    if (user?.company_name) {
      document.title = `${user.company_name} - Payments`;
    }
  }, [user?.company_name]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await getPayments(currentPage, 10);
      setPayments(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      showToast('Failed to load payments', 'error');
    }
    setLoading(false);
  };

  const filterPayments = () => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredPayments(payments);
      return;
    }
    
    const filtered = payments.filter(p => 
      String(p.order_number || '').toLowerCase().includes(term) ||
      String(p.buyer_name || '').toLowerCase().includes(term) ||
      String(p.payment_method || '').toLowerCase().includes(term) ||
      String(p.payment_type || '').toLowerCase().includes(term)
    );
    setFilteredPayments(filtered);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    
    try {
      const response = await deletePayment(paymentId);
      
      // Check if order status changed to pending
      if (response.data.order && response.data.order.status === 'pending') {
        showToast(`✅ Payment deleted! Order ${response.data.order.order_number} reverted to PENDING`, 'success');
      } else {
        showToast('Payment deleted successfully', 'success');
      }
      
      fetchPayments();
    } catch (error) {
      showToast('Failed to delete payment', 'error');
    }
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      cash: '💵 Cash',
      card: '💳 Card',
      bank_transfer: '🏦 Bank Transfer',
      cheque: '📄 Cheque'
    };
    return methods[method] || method;
  };

  const getPaymentTypeDisplay = (type) => {
    return type === 'full' ? '✅ Full' : '⚠️ Partial';
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const cashPayments = payments.filter(p => p.payment_method === 'cash').length;
  const cardPayments = payments.filter(p => p.payment_method === 'card').length;
  const fullPayments = payments.filter(p => p.payment_type === 'full').length;

  const handleViewPayment = async (payment) => {
    try {
      const orderResponse = await getOrder(payment.order_id);
      setViewingPayment({...payment, orderDetails: orderResponse.data});
      setShowViewModal(true);
    } catch (error) {
      showToast('Failed to load payment details', 'error');
    }
  };

  const handleCompletePayment = (payment) => {
    setViewingPayment(payment);
    // Calculate remaining amount
    const remainingAmount = typeof payment.order_remaining === 'number'
      ? payment.order_remaining
      : (payment.orderDetails ? (payment.orderDetails.total_amount - payment.amount) : 0);
    
    setCompletePaymentForm({
      amount: remainingAmount > 0 ? remainingAmount.toString() : '',
      payment_method: 'cash',
      payment_type: 'full',
      payment_date: getCurrentDateForInput(),
      income_tax_rate: '',
      notes: ''
    });
    setShowCompletePaymentModal(true);
  };

  const handleCompletePaymentSubmit = async () => {
    if (!viewingPayment || !completePaymentForm.amount) {
      showToast('Please enter payment amount', 'warning');
      return;
    }

    let amount = parseFloat(completePaymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    // Round amount to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    // Parse income tax rate (percentage)
    let income_tax_rate = parseFloat(completePaymentForm.income_tax_rate || 0);
    income_tax_rate = Math.round(income_tax_rate * 100) / 100;

    try {
      const response = await createPayment({
        order_id: viewingPayment.order_id,
        amount: amount,
        payment_method: completePaymentForm.payment_method,
        payment_type: completePaymentForm.payment_type,
        payment_date: completePaymentForm.payment_date,
        income_tax_rate: income_tax_rate,
        notes: completePaymentForm.notes
      });
      
      // Check if payment was auto-upgraded to full
      if (response.data.auto_upgraded) {
        showToast('✅ Payment recorded! Auto-upgraded from Partial to FULL (amount equals remaining balance)', 'success');
      } else {
        showToast('Payment recorded successfully!', 'success');
      }
      
      setShowCompletePaymentModal(false);
      setShowViewModal(false);
      fetchPayments();
    } catch (error) {
      showToast('Failed to record payment', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white">💰 Payments</h1>
          </div>

          {/* Payment Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Payments</p>
                  <p className="text-2xl font-bold text-[#00D4FF]">{payments.length}</p>
                </div>
                <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-emerald-700">₨ {formatRoundedAmount(totalAmount)}</p>
                </div>
                <div className="bg-emerald-700 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">💵</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Cash/Card</p>
                  <p className="text-2xl font-bold text-[#00D4FF]">{cashPayments} / {cardPayments}</p>
                </div>
                <div className="bg-purple-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">💳</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Full Payments</p>
                  <p className="text-2xl font-bold text-[#17144B]">{fullPayments}</p>
                </div>
                <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="🔍 Search by order number, buyer, or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 backdrop-blur-sm bg-white bg-opacity-40 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-[#00D4FF] focus:bg-opacity-60 transition-all"
            />
          </div>

          {/* Payments Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-white">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                {searchTerm ? 'No payments found matching your search.' : 'No payments recorded yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table id="payments-table" className="w-full">
                  <thead className="bg-white bg-opacity-20 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Buyer</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white bg-opacity-10 backdrop-blur-sm divide-y divide-white divide-opacity-10">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-white hover:bg-opacity-20 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          {highlightText(payment.order_number)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {highlightText(payment.buyer_name)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {payment.payment_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                          ₨ {formatRoundedAmount(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          ₨ {formatRoundedAmount(payment.balance || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {highlightText(getPaymentMethodDisplay(payment.payment_method))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {highlightText(getPaymentTypeDisplay(payment.payment_type))}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {highlightText(payment.notes || '-')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-60 transition-all text-white font-semibold"
              >
                Previous
              </button>
              <span className="px-4 py-2 backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-lg text-white font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-60 transition-all text-white font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* View Payment Details Modal */}
        {showViewModal && viewingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
              <h2 className="text-2xl font-bold mb-6 text-[#17144B]">💳 Payment Details</h2>
              
              <div className="space-y-4">
                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4 p-4 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Payment ID</p>
                    <p className="text-lg font-bold text-[#17144B]">#{viewingPayment.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Order #</p>
                    <p className="text-lg font-bold text-[#17144B]">{viewingPayment.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Date</p>
                    <p className="text-lg font-bold text-[#17144B]">{viewingPayment.payment_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Amount</p>
                    <p className="text-lg font-bold text-emerald-600">₨ {formatRoundedAmount(viewingPayment.amount)}</p>
                  </div>
                </div>

                {/* Payment Method & Type */}
                <div className="grid grid-cols-2 gap-4 p-4 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Payment Method</p>
                    <p className="text-lg font-bold text-[#17144B]">{getPaymentMethodDisplay(viewingPayment.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Payment Type</p>
                    <p className="text-lg font-bold text-[#17144B]">{getPaymentTypeDisplay(viewingPayment.payment_type)}</p>
                  </div>
                </div>

                {/* Order Details */}
                {viewingPayment.orderDetails && (
                  <div className="p-4 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                    <h3 className="font-bold text-[#17144B] mb-3">📋 Order Information</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700"><strong>Buyer:</strong> {viewingPayment.buyer_name}</p>
                      <p className="text-sm text-gray-700"><strong>Order Date:</strong> {formatDate(viewingPayment.orderDetails.order_date)}</p>
                      <p className="text-sm text-gray-700"><strong>Order Total:</strong> ₨ {formatRoundedAmount(viewingPayment.orderDetails.total_amount)}</p>
                      <p className="text-sm text-gray-700"><strong>Remaining Amount:</strong> ₨ {formatRoundedAmount(typeof viewingPayment.order_remaining === 'number' ? viewingPayment.order_remaining : (viewingPayment.orderDetails.total_amount - viewingPayment.amount))}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewingPayment.notes && (
                  <div className="p-4 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                    <h3 className="font-bold text-[#17144B] mb-2">📝 Notes</h3>
                    <p className="text-sm text-gray-700">{viewingPayment.notes}</p>
                  </div>
                )}

                {/* Complete Payment Button for Partial Payments */}
                {viewingPayment.payment_type === 'partial' && (typeof viewingPayment.order_remaining !== 'number' || viewingPayment.order_remaining > 0) && (
                  <div className="p-4 backdrop-blur-sm bg-blue-50 bg-opacity-50 rounded-lg border border-blue-300 border-opacity-30">
                    <p className="text-sm text-blue-800 mb-3">⚠️ This payment is partial. You can complete the remaining amount.</p>
                    <button
                      onClick={() => handleCompletePayment(viewingPayment)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
                    >
                      💰 Record Additional Payment
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6">
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Payment Modal */}
        {showCompletePaymentModal && viewingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-md w-full animate-scaleIn">
              <h2 className="text-2xl font-bold mb-6 text-[#17144B] text-center">💳 Record Additional Payment</h2>
              
              <div className="mb-4 p-4 bg-white bg-opacity-50 rounded-lg">
                <p className="text-sm text-gray-700"><strong>Order:</strong> {viewingPayment.order_number}</p>
                <p className="text-sm text-gray-700"><strong>Previous Payment:</strong> ₨ {formatRoundedAmount(viewingPayment.amount)}</p>
                <p className="text-sm text-gray-700"><strong>Payment Type:</strong> {getPaymentTypeDisplay(viewingPayment.payment_type)}</p>
              </div>

              <div className="space-y-4">
                {/* Additional Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Amount</label>
                  <input
                    type="number"
                    value={completePaymentForm.amount}
                    onChange={(e) => setCompletePaymentForm({...completePaymentForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Is this the remaining amount? */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Portion</label>
                  <select
                    value={completePaymentForm.payment_type}
                    onChange={(e) => setCompletePaymentForm({...completePaymentForm, payment_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="partial">⚠️ Partial Payment</option>
                    <option value="full">✅ Full/Complete Payment</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={completePaymentForm.payment_method}
                    onChange={(e) => setCompletePaymentForm({...completePaymentForm, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="cheque">📄 Cheque</option>
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={completePaymentForm.payment_date}
                    onChange={(e) => setCompletePaymentForm({...completePaymentForm, payment_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Income Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax Rate (%) - Optional</label>
                  <input
                    type="number"
                    step="0.01"
                    value={completePaymentForm.income_tax_rate}
                    onChange={(e) => setCompletePaymentForm({...completePaymentForm, income_tax_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1.5 for 1.5%"
                  />
                  <p className="text-xs text-gray-500 mt-1">Income tax will be calculated as: Payment Amount × Rate / 100</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={completePaymentForm.notes}
                    onChange={(e) => setCompletePaymentForm({...completePaymentForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={handleCompletePaymentSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
                  >
                    💳 Record Payment
                  </button>
                  <button 
                    onClick={() => setShowCompletePaymentModal(false)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
