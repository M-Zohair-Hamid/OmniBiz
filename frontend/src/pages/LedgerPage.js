import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getLedger, getBuyers } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const LedgerPage = () => {
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-6">
                <h3 className="text-xl font-bold text-black mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#3A3F8C] bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm font-bold text-black mb-1">Total Sales</p>
                    <p className="text-2xl font-bold text-[#00D4FF]">
                      ₨ {ledgerData.summary.total_debits.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-green-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm font-bold text-black mb-1">Total Payments</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₨ {ledgerData.summary.total_credits.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className={`${ledgerData.summary.closing_balance > 0 ? 'bg-red-50' : 'bg-green-50'} bg-opacity-60 rounded-lg p-4`}>
                    <p className="text-sm font-bold text-black mb-1">Due Payment</p>
                    <p className={`text-2xl font-bold ${ledgerData.summary.closing_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₨ {ledgerData.summary.closing_balance.toLocaleString('en-PK', {minimumFractionDigits: 2})}
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

        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
