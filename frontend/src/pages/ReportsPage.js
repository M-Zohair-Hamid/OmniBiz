import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api, { getReportSummary, getBuyerWiseReport, getItemWiseReport } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [buyerData, setBuyerData] = useState([]);
  const [itemData, setItemData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateBuyerId, setGenerateBuyerId] = useState('');
  const [generateStartDate, setGenerateStartDate] = useState('');
  const [generateEndDate, setGenerateEndDate] = useState('');
  const [buyersList, setBuyersList] = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [selectedBuyerName, setSelectedBuyerName] = useState('');
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [selectedBuyerItems, setSelectedBuyerItems] = useState([]);
  const [selectedBuyerLoading, setSelectedBuyerLoading] = useState(false);

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [summary, buyers, items] = await Promise.all([
        getReportSummary(),
        getBuyerWiseReport(),
        getItemWiseReport()
      ]);
      setReportData(summary.data);
      setBuyerData(buyers.data);
      setItemData(items.data);
    } catch (error) {
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.company_id, user?.company_code]);

  // Set page title based on company name
  useEffect(() => {
    if (user?.company_name) {
      document.title = `${user.company_name} - Reports`;
    }
  }, [user?.company_name]);


  const loadBuyersForCompany = async () => {
    setBuyersLoading(true);
    try {
      const response = await api.get('/buyers', {
        params: { page: 1, per_page: 1000, search: '' },
      });
      setBuyersList(response.data.data || []);
    } catch (error) {
      showToast('Failed to load buyers list', 'error');
    } finally {
      setBuyersLoading(false);
    }
  };

  useEffect(() => {
    loadBuyersForCompany();
    setGenerateBuyerId('');
    setSelectedBuyerName('');
    setSelectedBuyerId('');
    setSelectedBuyerItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.company_id, user?.company_code]);

  useEffect(() => {
    const loadSelectedBuyerItems = async () => {
      if (!selectedBuyerId) {
        setSelectedBuyerItems([]);
        return;
      }
      setSelectedBuyerLoading(true);
      try {
        const response = await api.get('/reports/buyer-report', {
          params: { buyer_id: selectedBuyerId }
        });
        setSelectedBuyerItems(response.data.items || []);
      } catch (error) {
        showToast('Failed to load buyer items', 'error');
      } finally {
        setSelectedBuyerLoading(false);
      }
    };

    loadSelectedBuyerItems();
  }, [selectedBuyerId, showToast]);

  const handleGenerateReport = () => {
    if (!generateBuyerId) {
      showToast('Please select a buyer', 'warning');
      return;
    }

    const params = new URLSearchParams();
    params.set('buyer_id', generateBuyerId);
    if (generateStartDate) params.set('start_date', generateStartDate);
    if (generateEndDate) params.set('end_date', generateEndDate);
    window.open(`/report?${params.toString()}`, '_blank', 'noopener,noreferrer');
    setShowGenerateModal(false);
  };

  if (loading || !reportData) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar companyName={user?.company_name || 'Business'} />
        <div className="flex-1 ml-64 p-8 relative z-10"><div className="text-center text-[#0d9488] font-semibold">Loading reports...</div></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="absolute inset-0 bg-slate-50 opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Reports & Analytics</h1>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-500/60 transform  transition-all"
            >
              Generate Buyer Report
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <h3 className="text-[#0d9488] text-sm font-bold mb-3 uppercase tracking-wide">Total Sales</h3>
              <p className="text-3xl font-bold text-teal-700">₨ {reportData.total_sales.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <h3 className="text-[#0f172a] text-sm font-bold mb-3 uppercase tracking-wide">Pending Payments</h3>
              <p className="text-3xl font-bold text-[#0f172a]">₨ {reportData.pending_payments.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <h3 className="text-emerald-700 text-sm font-bold mb-3 uppercase tracking-wide">Recent Orders</h3>
              <p className="text-3xl font-bold text-emerald-700">{reportData.recent_orders || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <h3 className="text-indigo-700 text-sm font-bold mb-3 uppercase tracking-wide">Total Buyers</h3>
              <p className="text-3xl font-bold text-indigo-700">{buyerData.length}</p>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-black">Buyer-Wise Sales Report</h2>
                <p className="text-sm text-black mt-1 opacity-70">Detailed breakdown of sales by buyer</p>
              </div>
              <div className="mb-4">
                <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wide">Buyer items & quantity</label>
                <input
                  type="text"
                  list="buyer-list"
                  value={selectedBuyerName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedBuyerName(value);
                    const match = buyersList.find((b) => b.company_name === value);
                    setSelectedBuyerId(match ? String(match.id) : '');
                  }}
                  placeholder="Type to select buyer"
                  className="w-full px-3 py-2 bg-white bg-opacity-70 border border-[#1e293b] rounded-lg text-[#0f172a] font-semibold text-sm focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30"
                />
                <datalist id="buyer-list">
                  {buyersList.map((buyer) => (
                    <option key={buyer.id} value={buyer.company_name} />
                  ))}
                </datalist>
                {buyersLoading && (
                  <div className="text-xs text-[#0f172a] opacity-60 mt-1">Loading buyers...</div>
                )}
              </div>
              {selectedBuyerId && (
                <div className="mb-4 rounded-xl bg-white bg-opacity-70 border border-white border-opacity-40 p-4">
                  <div className="text-sm font-bold text-[#0f172a] mb-2">Items bought by {selectedBuyerName}</div>
                  {selectedBuyerLoading ? (
                    <div className="text-sm text-[#0f172a] opacity-70">Loading items...</div>
                  ) : (
                    <div className="max-h-40 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[#0f172a]">
                          <tr>
                            <th className="text-left py-1">Item</th>
                            <th className="text-right py-1">Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]/20">
                          {selectedBuyerItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-1 text-[#0f172a]">{item.item_name}</td>
                              <td className="py-1 text-right font-semibold text-[#0f172a]">{item.total_quantity}</td>
                            </tr>
                          ))}
                          {selectedBuyerItems.length === 0 && (
                            <tr>
                              <td colSpan="2" className="py-2 text-center text-[#0f172a] opacity-70">No items found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600 text-sm uppercase tracking-wider">Buyer Name</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 text-sm uppercase tracking-wider">Order Count</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600 text-sm uppercase tracking-wider">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b] divide-opacity-30">
                    {buyerData.map((buyer, idx) => (
                      <tr key={idx} className="hover:bg-white hover:bg-opacity-20 transition-all duration-200 hover:shadow-md group">
                        <td className="px-4 py-3 font-semibold text-black group-hover:text-[#0d9488] transition-colors">{buyer.buyer_name}</td>
                        <td className="px-4 py-3 text-black text-center font-medium">{buyer.order_count}</td>
                        <td className="px-4 py-3 font-bold text-right text-emerald-700 group-hover:text-emerald-600">₨ {buyer.total_orders.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                    {buyerData.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-6 text-center text-sm text-[#0f172a] opacity-70">No buyers available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-black">Item-Wise Sales Report</h2>
                <p className="text-sm text-black mt-1 opacity-70">Detailed breakdown of sales by item</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600 text-sm uppercase tracking-wider">Item Name</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 text-sm uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600 text-sm uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b] divide-opacity-30">
                    {itemData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white hover:bg-opacity-20 transition-all duration-200 hover:shadow-md group">
                        <td className="px-4 py-3 font-semibold text-black group-hover:text-emerald-600 transition-colors">{item.item_name}</td>
                        <td className="px-4 py-3 text-black text-center font-medium">{item.total_quantity}</td>
                        <td className="px-4 py-3 font-bold text-right text-emerald-700 group-hover:text-emerald-600">₨ {item.total_value.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40  z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4">Generate Buyer Report</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[#0f172a] font-bold mb-2 text-sm">Buyer</label>
                <select
                  value={generateBuyerId}
                  onChange={(e) => setGenerateBuyerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1e293b] rounded-lg text-[#0f172a] font-semibold text-sm focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30"
                >
                  <option value="">Select buyer</option>
                  {buyersList.map((buyer) => (
                    <option key={buyer.id} value={buyer.id}>{buyer.company_name}</option>
                  ))}
                </select>
                {buyersLoading && <div className="text-xs text-[#0f172a] opacity-60 mt-1">Loading buyers...</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0f172a] font-bold mb-2 text-sm">Start Date (optional)</label>
                  <input
                    type="date"
                    value={generateStartDate}
                    onChange={(e) => setGenerateStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1e293b] rounded-lg text-[#0f172a] font-semibold text-sm focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
                <div>
                  <label className="block text-[#0f172a] font-bold mb-2 text-sm">End Date (optional)</label>
                  <input
                    type="date"
                    value={generateEndDate}
                    onChange={(e) => setGenerateEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1e293b] rounded-lg text-[#0f172a] font-semibold text-sm focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGenerateReport}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-50"
              >
                Generate
              </button>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;