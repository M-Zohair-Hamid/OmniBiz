import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BuyerReportPage = () => {
  const [searchParams] = useSearchParams();
  const buyerId = searchParams.get('buyer_id');
  const startDate = searchParams.get('start_date') || '';
  const endDate = searchParams.get('end_date') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      if (!buyerId) {
        setError('Missing buyer_id in query');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get('/reports/buyer-report', {
          params: {
            buyer_id: buyerId,
            start_date: startDate,
            end_date: endDate
          }
        });
        setReport(response.data);
        setError('');
      } catch (err) {
        const message = err.response?.data?.error || 'Failed to load report';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [buyerId, startDate, endDate]);

  const titleSuffix = useMemo(() => {
    if (startDate && endDate) return `${startDate}-${endDate}`;
    return 'overall';
  }, [startDate, endDate]);

  useEffect(() => {
    if (report?.buyer?.company_name) {
      document.title = `Report-${report.buyer.company_name}-${titleSuffix}`;
    }
  }, [report, titleSuffix]);

  const monthlyMax = useMemo(() => {
    if (!report?.monthly_sales?.length) return 0;
    return Math.max(...report.monthly_sales.map((m) => m.total_sales || 0));
  }, [report]);

  const monthlyChart = useMemo(() => {
    if (!report?.monthly_sales?.length) return null;
    const labels = report.monthly_sales.map((m) => m.month);
    const data = report.monthly_sales.map((m) => m.total_sales || 0);
    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Monthly Sales (₨)',
            data,
            backgroundColor: 'rgba(0, 212, 255, 0.6)',
            borderColor: '#17144B',
            borderWidth: 1,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(58, 63, 140, 0.7)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `₨ ${ctx.parsed.y.toLocaleString('en-PK')}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#17144B', font: { size: 10 } },
            grid: { display: false }
          },
          y: {
            ticks: {
              color: '#17144B',
              callback: (value) => `₨ ${Number(value).toLocaleString('en-PK')}`,
              font: { size: 10 }
            },
            grid: { color: 'rgba(23, 20, 75, 0.1)' }
          }
        }
      }
    };
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] flex items-center justify-center">
        <div className="text-center text-[#00D4FF] font-semibold">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] flex items-center justify-center">
        <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-lg text-center">
          <div className="text-lg font-bold text-[#17144B] mb-2">Unable to load report</div>
          <div className="text-sm text-[#17144B] opacity-70">{error || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <style>
        {`
          @media print {
            body { background: #fff !important; }
            .no-print { display: none !important; }
            .print-container { background: #fff !important; padding: 0 !important; }
            .print-card { background: #fff !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
            .print-header { color: #111827 !important; }
            .print-subtle { color: #374151 !important; }
            .print-grid { gap: 12px !important; }
            .print-chart { height: 240px !important; }
            .page-break { page-break-inside: avoid; }
          }
        `}
      </style>
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <div className="relative z-10 p-8 print-container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white print-header">Buyer Report</h1>
            <p className="text-sm text-white opacity-80 print-subtle">
              {report.buyer.company_name} • {report.filters.start_date || 'Any date'} → {report.filters.end_date || 'Any date'}
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white bg-opacity-70 border border-[#3A3F8C] text-sm font-semibold text-[#17144B] print-card">
            Relationship: {report.relationship?.relationship_label || 'N/A'} ({report.relationship?.relationship_score ?? '—'})
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print-grid">
          <div className="bg-white bg-opacity-70 rounded-xl p-4 border border-white border-opacity-40 print-card">
            <div className="text-xs font-bold text-[#17144B] uppercase tracking-wide">Total Orders</div>
            <div className="text-2xl font-extrabold text-[#17144B]">{report.summary.total_orders}</div>
          </div>
          <div className="bg-white bg-opacity-70 rounded-xl p-4 border border-white border-opacity-40 print-card">
            <div className="text-xs font-bold text-[#17144B] uppercase tracking-wide">Total Sales</div>
            <div className="text-2xl font-extrabold text-emerald-700">₨ {report.summary.total_sales.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white bg-opacity-70 rounded-xl p-4 border border-white border-opacity-40 print-card">
            <div className="text-xs font-bold text-[#17144B] uppercase tracking-wide">Outstanding</div>
            <div className="text-2xl font-extrabold text-rose-600">₨ {report.summary.outstanding.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white bg-opacity-70 rounded-xl p-4 border border-white border-opacity-40 print-card">
            <div className="text-xs font-bold text-[#17144B] uppercase tracking-wide">On-Time Ratio</div>
            <div className="text-2xl font-extrabold text-[#17144B]">{Math.round((report.summary.on_time_ratio || 0) * 100)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-grid">
          <div className="bg-white bg-opacity-70 rounded-xl p-5 border border-white border-opacity-40 print-card page-break">
            <h3 className="text-lg font-bold text-[#17144B] mb-3">Items Purchased</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#17144B] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-center">Quantity</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3F8C]/30">
                  {report.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white hover:bg-opacity-60 transition-colors">
                      <td className="px-3 py-2 font-semibold text-[#17144B]">{item.item_name}</td>
                      <td className="px-3 py-2 text-center">{item.total_quantity}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">₨ {item.total_value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {report.items.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-3 py-5 text-center text-[#17144B] opacity-70">No items found for this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white bg-opacity-70 rounded-xl p-5 border border-white border-opacity-40 print-card page-break">
            <h3 className="text-lg font-bold text-[#17144B] mb-3">Monthly Sales Trend</h3>
            {report.monthly_sales.length === 0 || monthlyMax <= 0 ? (
              <div className="text-sm text-[#17144B] opacity-70">No monthly sales data available.</div>
            ) : (
              <div className="h-64 bg-white/60 rounded-lg p-3 print-chart">
                {monthlyChart && <Bar data={monthlyChart.data} options={monthlyChart.options} />}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-blue-500/60 flex items-center justify-center text-2xl no-print"
      >
        ?
      </button>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[#17144B] mb-3">How to read this report</h3>
            <ul className="text-sm text-[#17144B] space-y-2 opacity-80">
              <li>• Relationship score summarizes buyer behavior (payments, revenue, frequency, growth).</li>
              <li>• Outstanding shows unpaid balance for selected dates.</li>
              <li>• On-Time Ratio is the share of payments made before due date.</li>
              <li>• Monthly trend highlights sales pattern for quick comparison.</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerReportPage;
