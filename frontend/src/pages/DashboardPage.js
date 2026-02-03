import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getDashboardData } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportDashboardToPDF, exportChartToImage, printDocument } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token in localStorage:', token ? 'Present' : 'Missing');
        const response = await getDashboardData();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Dashboard error:', error.response?.data || error.message);
        showToast('Failed to load dashboard data: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast, user]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B]">
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-[#00D4FF]"></div>
          <p className="mt-6 text-white font-semibold text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Map company names to logo paths
  const getCompanyLogo = (companyName) => {
    if (companyName?.toLowerCase().includes('umarsons')) {
      return '/umarsons-logo.png';
    } else if (companyName?.toLowerCase().includes('makkah')) {
      return '/makkahpackages-logo.png';
    }
    return null;
  };

  const chartColors = {
    primary: '#0066ff',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    secondary: '#64748b'
  };

  const buyerChartData = {
    labels: dashboardData.buyer_wise_sales.map(b => b.name),
    datasets: [{
      label: 'Sales Amount (₨)',
      data: dashboardData.buyer_wise_sales.map(b => b.value),
      backgroundColor: [chartColors.primary, '#3d7fe8', '#2d5cc9', chartColors.success, chartColors.warning],
    }]
  };

  const itemChartData = {
    labels: dashboardData.item_wise_sales.map(i => i.name),
    datasets: [{
      label: 'Item Sales (₨)',
      data: dashboardData.item_wise_sales.map(i => i.value),
      backgroundColor: chartColors.primary,
      borderColor: chartColors.primary,
      borderWidth: 1,
      borderRadius: 4,
    }]
  };

  const paymentStatusData = {
    labels: ['Paid', 'Partial', 'Pending'],
    datasets: [{
      data: [dashboardData.payment_status.paid, dashboardData.payment_status.partial, dashboardData.payment_status.pending],
      backgroundColor: [chartColors.success, chartColors.warning, chartColors.error],
      borderColor: '#fff',
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
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
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-white mb-8">Dashboard</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-[#00D4FF] text-base font-bold mb-3 uppercase tracking-wide">Total Sales</h3>
              <p className="text-5xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00D4FF] bg-clip-text text-transparent">₨ {dashboardData.summary.total_sales.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-[#17144B] text-base font-bold mb-3 uppercase tracking-wide">Pending Payments</h3>
              <p className="text-5xl font-bold text-[#17144B]">₨ {dashboardData.summary.pending_payments.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-emerald-700 text-base font-bold mb-3 uppercase tracking-wide">Recent Orders</h3>
              <p className="text-5xl font-bold text-emerald-700">{dashboardData.summary.recent_orders_count}</p>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer transform">
              <h3 className="text-[#00D4FF] text-lg font-bold mb-3 uppercase tracking-wide">Payment Status</h3>
              <div className="flex gap-4 text-2xl">
                <span className="font-bold text-emerald-700">✓ {dashboardData.payment_status.paid}</span>
                <span className="font-bold text-yellow-600">◐ {dashboardData.payment_status.partial}</span>
                <span className="font-bold text-[#17144B]">✕ {dashboardData.payment_status.pending}</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transform">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#17144B]">Buyer-Wise Sales</h2>
                <button onClick={() => exportChartToImage('buyerChart', 'buyer-sales.png')} className="text-sm bg-[#00D4FF] hover:bg-[#00B8E0] text-[#17144B] px-3 py-2 rounded transition transform hover:scale-110">📊 Image</button>
              </div>
              <div id="buyerChart"><Bar data={buyerChartData} options={chartOptions} /></div>
            </div>
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transform">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#17144B]">Payment Status Distribution</h2>
                <button onClick={() => exportChartToImage('paymentChart', 'payment-status.png')} className="text-sm bg-[#00D4FF] hover:bg-[#00B8E0] text-[#17144B] px-3 py-2 rounded transition transform hover:scale-110">📊 Image</button>
              </div>
              <div id="paymentChart"><Doughnut data={paymentStatusData} options={doughnutOptions} /></div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transform">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#17144B]">Item-Wise Sales</h2>
              <button onClick={() => exportChartToImage('itemChart', 'item-sales.png')} className="text-sm bg-[#00D4FF] hover:bg-[#00B8E0] text-[#17144B] px-3 py-2 rounded transition transform hover:scale-110">📊 Image</button>
            </div>
            <div id="itemChart"><Bar data={itemChartData} options={chartOptions} /></div>
          </div>

          {/* Export Section */}
          <div className="flex gap-3 my-8 justify-center flex-wrap">
            <button onClick={() => exportDashboardToPDF('dashboard-report.pdf')} className="bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg">📄 Export PDF</button>
            <button onClick={() => printDocument('dashboard')} className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg">🖨️ Print</button>
          </div>

          {/* Recent Orders Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg p-6 border border-white border-opacity-30 hover:bg-opacity-60 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transform mt-8">
            <h2 className="text-2xl font-bold text-[#17144B] mb-4">Recent Orders</h2>
            <div id="dashboard" className="overflow-x-auto">
              <table className="w-full text-base">
                <thead className="bg-gradient-to-r from-[#17144B] to-[#3A3F8C] border-b border-[#17144B]">
                  <tr>
                    <th className="px-4 py-4 text-lg text-center font-bold text-[#EBEEF5]">Order #</th>
                    <th className="px-4 py-4 text-lg text-center font-bold text-[#EBEEF5]">Buyer</th>
                    <th className="px-4 py-4 text-lg text-center font-bold text-[#EBEEF5]">Amount</th>
                    <th className="px-4 py-4 text-lg text-center font-bold text-[#EBEEF5]">Status</th>
                    <th className="px-4 py-4 text-lg text-center font-bold text-[#EBEEF5]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_orders.map(order => (
                    <tr key={order.id} className="border-b border-[#3A3F8C] hover:bg-[#3A3F8C] hover:bg-opacity-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-base text-[#00D4FF] text-center">{order.order_number}</td>
                      <td className="px-4 py-3 text-base text-gray-700 text-center">{order.buyer_name}</td>
                      <td className="px-4 py-3 font-semibold text-base text-gray-700 text-center">₨ {order.total_amount.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm ${
                          order.status === 'pending' ? 'bg-yellow-300 bg-opacity-30 text-yellow-800 border border-yellow-300 border-opacity-50' :
                          order.status === 'confirmed' ? 'bg-blue-300 bg-opacity-30 text-blue-800 border border-blue-300 border-opacity-50' :
                          order.status === 'shipped' ? 'bg-purple-300 bg-opacity-30 text-purple-800 border border-purple-300 border-opacity-50' :
                          'bg-emerald-300 bg-opacity-30 text-emerald-800 border border-emerald-300 border-opacity-50'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base text-black font-semibold text-center">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
