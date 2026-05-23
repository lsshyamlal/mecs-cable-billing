import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSubscriptionHistory } from '../api';
import { STATUS_COLORS, fmtDate, fmtDateTime, fmtMonth } from '../utils';

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
      <button
        onClick={() => navigate('/portal')}
        className="flex items-center gap-1 text-blue-700 dark:text-blue-400 text-sm font-medium hover:text-blue-900 dark:hover:text-blue-300 transition mb-1"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Subscription History</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last 12 months</p>

      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {!error && !history && (
        <div className="space-y-2 animate-pulse">
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
        </div>
      )}

      {history && history.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
          No subscription records found for the last 12 months.
        </div>
      )}

      {history && history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Month</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Rate</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Payment Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Grace Deadline</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {history.map((item) => (
                  <tr key={item.subscriptionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">{fmtMonth(item.startDate)}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDate(item.startDate)} – {fmtDate(item.endDate)}</td>
                    <td className="px-5 py-3 text-gray-800 dark:text-gray-100 whitespace-nowrap">₹{Number(item.monthlyRate).toFixed(0)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDate(item.gracePeriodDeadline)}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDateTime(item.paymentDate)}</td>
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
