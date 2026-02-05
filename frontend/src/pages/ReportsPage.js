import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getReportSummary, getBuyerWiseReport, getItemWiseReport } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [buyerData, setBuyerData] = useState([]);
  const [itemData, setItemData] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  // Set page title based on company name
  useEffect(() => {
    if (user?.company_name) {
      document.title = `${user.company_name} - Reports`;
    }
  }, [user?.company_name]);

  if (loading || !reportData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B]">
        <Sidebar companyName={user?.company_name || 'Business'} />
        <div className="flex-1 ml-64 p-8 relative z-10"><div className="text-center text-[#00D4FF] font-semibold">Loading reports...</div></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-white mb-8">Reports & Analytics</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-[#00D4FF] text-sm font-bold mb-3 uppercase tracking-wide">Total Sales</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00D4FF] bg-clip-text text-transparent">₨ {reportData.total_sales.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-[#17144B] text-sm font-bold mb-3 uppercase tracking-wide">Pending Payments</h3>
              <p className="text-3xl font-bold text-[#17144B]">₨ {reportData.pending_payments.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-emerald-700 text-sm font-bold mb-3 uppercase tracking-wide">Recent Orders</h3>
              <p className="text-3xl font-bold text-emerald-700">{reportData.recent_orders || 0}</p>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-purple-700 text-sm font-bold mb-3 uppercase tracking-wide">Total Buyers</h3>
              <p className="text-3xl font-bold text-purple-700">{buyerData.length}</p>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30">
              <div className="mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] bg-clip-text text-transparent">Buyer-Wise Sales Report</h2>
                <p className="text-sm text-black mt-1 opacity-70">Detailed breakdown of sales by buyer</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C] border-b-2 border-[#00D4FF]">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-white text-sm uppercase tracking-wider">Buyer Name</th>
                      <th className="px-4 py-3 text-center font-bold text-white text-sm uppercase tracking-wider">Order Count</th>
                      <th className="px-4 py-3 text-right font-bold text-white text-sm uppercase tracking-wider">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3A3F8C] divide-opacity-30">
                    {buyerData.map((buyer, idx) => (
                      <tr key={idx} className="hover:bg-white hover:bg-opacity-20 transition-all duration-200 hover:shadow-md group">
                        <td className="px-4 py-3 font-semibold text-black group-hover:text-[#00D4FF] transition-colors">{buyer.buyer_name}</td>
                        <td className="px-4 py-3 text-black text-center font-medium">{buyer.order_count}</td>
                        <td className="px-4 py-3 font-bold text-right text-emerald-700 group-hover:text-emerald-600">₨ {buyer.total_orders.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30">
              <div className="mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">Item-Wise Sales Report</h2>
                <p className="text-sm text-black mt-1 opacity-70">Detailed breakdown of sales by item</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C] border-b-2 border-emerald-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-white text-sm uppercase tracking-wider">Item Name</th>
                      <th className="px-4 py-3 text-center font-bold text-white text-sm uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-right font-bold text-white text-sm uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3A3F8C] divide-opacity-30">
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
    </div>
  );
};

export default ReportsPage;
