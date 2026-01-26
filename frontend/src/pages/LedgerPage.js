import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getLedger, downloadLedgerPdf, getBuyers } from '../services/api';
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100" style={{ backgroundImage: 'url(/imgs/1.jpg)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <Sidebar companyName={user?.full_name || 'User'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">Party Ledger</h1>
            <p className="text-gray-600">View detailed transaction history for each buyer/party</p>
          </div>

          {/* Filters Card */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Generate Ledger</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Buyer Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Buyer/Party *</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date (Optional)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">End Date (Optional)</label>
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
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <h3 className="text-lg font-bold text-blue-600 mb-3">Account Details</h3>
                    <p className="text-gray-700"><strong>Company:</strong> {ledgerData.buyer.company_name}</p>
                    <p className="text-gray-700"><strong>Address:</strong> {ledgerData.buyer.address || 'N/A'}, {ledgerData.buyer.city || ''}</p>
                    <p className="text-gray-700"><strong>Phone:</strong> {ledgerData.buyer.phone}</p>
                    <p className="text-gray-700"><strong>Email:</strong> {ledgerData.buyer.email}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-600 mb-3">Tax Information</h3>
                    <p className="text-gray-700"><strong>GST Number:</strong> {ledgerData.buyer.gst_number || 'N/A'}</p>
                    <p className="text-gray-700"><strong>NTN Number:</strong> {ledgerData.buyer.ntn_number || 'N/A'}</p>
                    <p className="text-gray-700 mt-4"><strong>Date Range:</strong> {ledgerData.date_range.start !== 'All' ? `${ledgerData.date_range.start} to ${ledgerData.date_range.end}` : 'All Transactions'}</p>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex justify-end gap-3 mb-4">
                <button
                  onClick={handleExportPDF}
                  className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  📄 Export PDF
                </button>
                <button
                  onClick={handleExportPNG}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-sm font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  🖼️ Export PNG
                </button>
              </div>

              {/* Ledger Table */}
              <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full" id="ledgerTable">
                    <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Bill No</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Description</th>
                        <th className="px-4 py-3 text-center text-sm font-bold">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Rate</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Tax</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Total</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ledgerData.entries.map((entry, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? 'bg-white bg-opacity-60' : 'bg-blue-50 bg-opacity-60'} hover:bg-blue-100 hover:bg-opacity-80 transition-all duration-200`}
                        >
                          <td className="px-4 py-3 text-sm text-black font-semibold">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {entry.invoice_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-black font-semibold">
                            {entry.item_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-black font-semibold">
                            {entry.quantity > 0 ? entry.quantity : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-black font-semibold">
                            {entry.rate > 0 ? `₨ ${entry.rate.toLocaleString('en-PK', {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-black font-semibold">
                            ₨ {entry.amount.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-black font-semibold">
                            {entry.tax > 0 ? `₨ ${entry.tax.toLocaleString('en-PK', {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${entry.type === 'credit' ? 'text-green-600' : 'text-blue-600'}`}>
                            {entry.type === 'credit' ? '-' : ''}₨ {entry.total.toLocaleString('en-PK', {minimumFractionDigits: 2})}
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
                <h3 className="text-xl font-bold text-blue-600 mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Opening Balance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₨ {ledgerData.summary.opening_balance.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-blue-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Sales (Debits)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₨ {ledgerData.summary.total_debits.toLocaleString('en-PK', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="bg-green-50 bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Payments (Credits)</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₨ {ledgerData.summary.total_credits.toLocaleString('en-PK', {minimumFractionDigits: 2})}
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
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Ledger Generated</h3>
              <p className="text-gray-600">Select a buyer and click "Generate" to view ledger details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
