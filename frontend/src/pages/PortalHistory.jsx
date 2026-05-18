import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSubscriptionHistory } from '../api';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  GRACE: 'bg-yellow-100 text-yellow-800',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
  PAID: 'bg-blue-100 text-blue-800',
};

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtMonth(dateStr) {
  if (!dateStr) return '—';
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
}

export default function PortalHistory() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getSubscriptionHistory()
      .then((res) => setHistory(res.data))
      .catch(() => setError('Failed to load subscription history.'));
  }, []);

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate('/portal')}
          className="flex items-center gap-1 text-blue-700 text-sm font-medium hover:text-blue-900 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Subscription History</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">Last 12 months</p>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {!error && !history && (
        <div className="space-y-2 animate-pulse">
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      )}

      {history && history.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
          No subscription records found for the last 12 months.
        </div>
      )}

      {history && history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Month</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Rate</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Grace Deadline</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((item) => (
                  <tr key={item.subscriptionId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">{fmtMonth(item.startDate)}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(item.startDate)} – {fmtDate(item.endDate)}</td>
                    <td className="px-5 py-3 text-gray-800 whitespace-nowrap">₹{Number(item.monthlyRate).toFixed(0)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(item.gracePeriodDeadline)}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(item.paymentDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
