import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getReportSummary, getBuyerWiseReport, getItemWiseReport, exportOrdersCsv } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { exportChartToImage } from '../utils/exportUtils';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [buyerData, setBuyerData] = useState([]);
  const [itemData, setItemData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  }, []);

  const handleExportCsv = async () => {
    try {
      const response = await exportOrdersCsv(startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders-report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('CSV exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export CSV', 'error');
    }
  };

  if (loading || !reportData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B]">
        <Sidebar companyName={user?.company_name || 'Business'} />
        <div className="flex-1 ml-64 p-8 relative z-10"><div className="text-center text-[#00D4FF] font-semibold">Loading reports...</div></div>
      </div>
    );
  }

  const buyerChartData = {
    labels: buyerData.map(b => b.buyer_name),
    datasets: [{
      label: 'Total Orders (₨)',
      data: buyerData.map(b => b.total_orders),
      backgroundColor: '#0066ff'
    }]
  };

  const itemChartData = {
    labels: itemData.map(i => i.item_name),
    datasets: [{
      label: 'Total Value (₨)',
      data: itemData.map(i => i.total_value),
      backgroundColor: '#22c55e'
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#000000',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#000000',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#000000',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

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
              <p className="text-3xl font-bold text-emerald-700">{reportData.recent_orders_count}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-black">Buyer-Wise Sales</h2>
                <button onClick={() => exportChartToImage('buyerChart', 'buyer-sales.png')} className="px-2 py-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-black rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">📋 PNG</button>
              </div>
              <div id="buyerChart">
                <Bar data={buyerChartData} options={chartOptions} />
              </div>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-black">Item-Wise Sales</h2>
                <button onClick={() => exportChartToImage('itemChart', 'item-sales.png')} className="px-2 py-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-black rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">📊 PNG</button>
              </div>
              <div id="itemChart">
                <Bar data={itemChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-black">Buyer-Wise Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C] border-b border-[#17144B]">
                    <tr>
                      <th className="px-3 py-2 text-center font-bold text-white">Buyer</th>
                      <th className="px-3 py-2 text-center font-bold text-white">Orders</th>
                      <th className="px-3 py-2 text-center font-bold text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyerData.map((buyer, idx) => (
                      <tr key={idx} className="border-b border-[#3A3F8C] hover:bg-[#3A3F8C] hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                        <td className="px-3 py-2 font-semibold text-black text-center">{buyer.buyer_name}</td>
                        <td className="px-3 py-2 text-black text-center">{buyer.order_count}</td>
                        <td className="px-3 py-2 font-bold text-black text-center">₨ {buyer.total_orders.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-black">Item-Wise Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C] border-b border-[#17144B]">
                    <tr>
                      <th className="px-3 py-2 text-center font-bold text-white">Item</th>
                      <th className="px-3 py-2 text-center font-bold text-white">Qty</th>
                      <th className="px-3 py-2 text-center font-bold text-white">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemData.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#3A3F8C] hover:bg-[#3A3F8C] hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                        <td className="px-3 py-2 font-semibold text-black text-center">{item.item_name}</td>
                        <td className="px-3 py-2 text-black text-center">{item.total_quantity}</td>
                        <td className="px-3 py-2 font-bold text-black text-center">₨ {item.total_value.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
