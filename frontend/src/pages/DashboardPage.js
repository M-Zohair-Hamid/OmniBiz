import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getDashboardData } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportDashboardToPDF, printDocument } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';

const StatCard = ({ label, value, hint, accent = 'indigo' }) => {
  const pill = {
    indigo:  'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    rose:    'bg-rose-50 text-rose-700',
    violet:  'bg-violet-50 text-violet-700',
  }[accent] || 'bg-indigo-50 text-indigo-700';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && (
        <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pill}`}>
          {hint}
        </span>
      )}
    </div>
  );
};

const statusBadge = (status) => {
  const map = {
    pending:   'bg-amber-50 text-amber-700',
    confirmed: 'bg-indigo-50 text-indigo-700',
    shipped:   'bg-violet-50 text-violet-700',
    paid:      'bg-emerald-50 text-emerald-700',
    partial:   'bg-sky-50 text-sky-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDashboardData();
        setDashboardData(res.data);
      } catch (err) {
        showToast('Failed to load dashboard: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  useEffect(() => {
    if (user?.company_name) document.title = `${user.company_name} - Dashboard`;
  }, [user?.company_name]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const paid    = Number(dashboardData.payment_status?.paid    || 0);
  const partial = Number(dashboardData.payment_status?.partial || 0);
  const pending = Number(dashboardData.payment_status?.pending || 0);
  const total   = paid + partial + pending || 1;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar companyName={user?.company_name || 'Business'} />

      <div className="flex-1 ml-64">
        <div className="p-8">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
              <p className="mt-2 text-sm text-slate-500">
                Overview of sales, orders, and payment activity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportDashboardToPDF('dashboard-report.pdf')}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-indigo-700"
              >
                Export PDF
              </button>
              <button
                onClick={() => printDocument('dashboard-print')}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-50"
              >
                Print
              </button>
            </div>
          </div>

          {/* Stat cards — row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Total Sales"
              value={`Rs. ${dashboardData.summary.total_sales.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              hint="All time"
              accent="indigo"
            />
            <StatCard
              label="Pending Payments"
              value={`Rs. ${dashboardData.summary.pending_payments.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              hint="Outstanding"
              accent="amber"
            />
            <StatCard
              label="Recent Orders"
              value={dashboardData.summary.recent_orders_count}
              hint="Last 30 days"
              accent="emerald"
            />
            <StatCard
              label="Active Buyers"
              value={dashboardData.buyer_wise_sales?.length || 0}
              hint="With orders"
              accent="violet"
            />
          </div>

          {/* Payment status mini-cards — row 2 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</p>
                <p className="text-xl font-semibold text-slate-900">{paid}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-sky-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Partial</p>
                <p className="text-xl font-semibold text-slate-900">{partial}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
                <p className="text-xl font-semibold text-slate-900">{pending}</p>
              </div>
            </div>
          </div>

          {/* Payment progress bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900">Payment Collection Rate</h2>
              <span className="text-sm font-semibold text-slate-700">{Math.round((paid / total) * 100)}% collected</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(paid / total) * 100}%` }} />
              <div className="h-full bg-sky-400 transition-all"    style={{ width: `${(partial / total) * 100}%` }} />
              <div className="h-full bg-amber-400 transition-all"  style={{ width: `${(pending / total) * 100}%` }} />
            </div>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Paid</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="inline-block h-2 w-2 rounded-full bg-sky-400" />Partial</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Pending</span>
            </div>
          </div>

          {/* Two panels: Buyer-wise + Item-wise */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

            {/* Buyer-wise sales */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Buyer-Wise Sales</h2>
                <p className="mt-1 text-sm text-slate-500">Top buyers by sales volume</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Sales (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.buyer_wise_sales.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-6 text-sm text-slate-400">No sales data yet.</td></tr>
                    ) : dashboardData.buyer_wise_sales.map((b, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 align-middle font-medium text-slate-900">{b.name}</td>
                        <td className="px-4 py-3 align-middle text-slate-700 text-right">
                          {Number(b.value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Item-wise sales */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Item-Wise Sales</h2>
                <p className="mt-1 text-sm text-slate-500">Top items by revenue</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Item</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Sales (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.item_wise_sales.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-6 text-sm text-slate-400">No item data yet.</td></tr>
                    ) : dashboardData.item_wise_sales.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 align-middle font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 align-middle text-slate-700 text-right">
                          {Number(item.value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
                <p className="mt-1 text-sm text-slate-500">Latest transactions</p>
              </div>
            </div>
            <div id="dashboard-print" className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Order #</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_orders.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-sm text-slate-400">No recent orders.</td></tr>
                  ) : dashboardData.recent_orders.map(order => (
                    <tr key={order.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 align-middle font-medium text-slate-900">{order.order_number}</td>
                      <td className="px-4 py-3 align-middle text-slate-700">{order.buyer_name}</td>
                      <td className="px-4 py-3 align-middle text-slate-700">
                        Rs. {order.total_amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-500">{formatDate(order.created_at)}</td>
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
