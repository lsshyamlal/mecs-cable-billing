import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { listCustomers, runScheduler, getMonthlyPaymentSummary } from '../../api';

const CUSTOMER_STATUS_GROUPS = [
  { key: 'ACTIVE', label: 'Active', color: 'bg-green-200 border-green-300 text-green-900' },
  { key: 'SUSPENDED', label: 'Suspended', color: 'bg-red-200 border-red-300 text-red-900' },
  { key: 'ACCOUNT_CLOSED', label: 'Account Closed', color: 'bg-gray-200 border-gray-300 text-gray-800' },
];

const CURRENT_SUBSCRIPTION_GROUPS = [
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'PAID',            label: 'Paid',            color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'GRACE',           label: 'Grace Period',    color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'SUSPENDED',       label: 'Suspended',       color: 'bg-red-50 border-red-200 text-red-700' },
];

const FUTURE_SUBSCRIPTION_GROUPS = [
  { key: 'ACTIVE',    label: 'Next Month Ready', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'CANCELLED', label: 'Cancelled',        color: 'bg-gray-50 border-gray-200 text-gray-600' },
];

function toYearMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [customers, setCustomers] = useState(null);
  const [currentTotal, setCurrentTotal] = useState(null);
  const [lastTotal, setLastTotal] = useState(null);
  const [schedulerMsg, setSchedulerMsg] = useState('');
  const [schedulerOk, setSchedulerOk] = useState(false);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    listCustomers({}).then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
    getMonthlyPaymentSummary().then((r) => setCurrentTotal(r.data.total)).catch(() => setCurrentTotal(0));
    getMonthlyPaymentSummary(toYearMonth(lastMonth))
      .then((r) => setLastTotal(r.data.total))
      .catch(() => setLastTotal(0));
  }, []);

  const countFor = (groups, field) =>
    customers
      ? groups.map((g) => ({
          ...g,
          count: customers.filter((c) => c[field] === g.key).length,
        }))
      : groups.map((g) => ({ ...g, count: null }));

  const customerCounts = countFor(CUSTOMER_STATUS_GROUPS, 'status');
  const currentSubCounts = countFor(CURRENT_SUBSCRIPTION_GROUPS, 'subscriptionStatus');
  const futureSubCounts = countFor(FUTURE_SUBSCRIPTION_GROUPS, 'futureSubscriptionStatus');

  const handleRunScheduler = async () => {
    setSchedulerLoading(true);
    setSchedulerMsg('');
    setSchedulerOk(false);
    try {
      const { data } = await runScheduler();
      setSchedulerOk(true);
      setSchedulerMsg(
        `Billing scheduler complete: ${data.graceCount} moved to GRACE, ${data.pendingCount} moved to PAYMENT_PENDING`
      );
      listCustomers({}).then((r) => setCustomers(r.data)).catch(() => {});
    } catch {
      setSchedulerMsg('Failed to run scheduler.');
    } finally {
      setSchedulerLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Customer Status */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Status</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/admin/customers?status=${customerCounts[0].key}`)}
            className={`w-full border-4 rounded-xl p-5 text-left shadow-md transition ${customerCounts[0].color}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{customerCounts[0].label}</p>
            <p className="text-3xl font-bold mt-1">{customerCounts[0].count === null ? '…' : customerCounts[0].count}</p>
            <p className="text-xs mt-1 opacity-60">customers</p>
          </button>
          <div className="grid grid-cols-2 gap-3">
            {customerCounts.slice(1).map((g) => (
              <button
                key={g.key}
                onClick={() => navigate(`/admin/customers?status=${g.key}`)}
                className={`border rounded-xl p-3 text-left shadow-inner transition ${g.color}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{g.label}</p>
                <p className="text-xl font-bold mt-1">{g.count === null ? '…' : g.count}</p>
                <p className="text-xs mt-1 opacity-60">customers</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Subscription Status</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/admin/customers?status=${currentSubCounts[0].key}`)}
            className={`w-full border-4 rounded-xl p-5 text-left shadow-md transition ${currentSubCounts[0].color}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{currentSubCounts[0].label}</p>
            <p className="text-3xl font-bold mt-1">{currentSubCounts[0].count === null ? '…' : currentSubCounts[0].count}</p>
            <p className="text-xs mt-1 opacity-60">customers</p>
          </button>
          <div className="grid grid-cols-3 gap-3">
            {currentSubCounts.slice(1).map((g) => (
              <button
                key={g.key}
                onClick={() => navigate(`/admin/customers?status=${g.key}`)}
                className={`border rounded-xl p-3 text-left shadow-inner transition ${g.color}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{g.label}</p>
                <p className="text-xl font-bold mt-1">{g.count === null ? '…' : g.count}</p>
                <p className="text-xs mt-1 opacity-60">customers</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Future Subscription Status */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Future Subscription Status</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/admin/customers?futureStatus=${futureSubCounts[0].key}`)}
            className={`w-full border-4 rounded-xl p-5 text-left shadow-md transition ${futureSubCounts[0].color}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{futureSubCounts[0].label}</p>
            <p className="text-3xl font-bold mt-1">{futureSubCounts[0].count === null ? '…' : futureSubCounts[0].count}</p>
            <p className="text-xs mt-1 opacity-60">customers</p>
          </button>
          <div className="grid grid-cols-1 gap-3">
            {futureSubCounts.slice(1).map((g) => (
              <button
                key={g.key}
                onClick={() => navigate(`/admin/customers?futureStatus=${g.key}`)}
                className={`border rounded-xl p-3 text-left shadow-inner transition ${g.color}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{g.label}</p>
                <p className="text-xl font-bold mt-1">{g.count === null ? '…' : g.count}</p>
                <p className="text-xs mt-1 opacity-60">customers</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Total */}
      {customers && (
        <p className="text-sm text-gray-500 mb-8">
          Total customers: <span className="font-semibold text-gray-700">{customers.length}</span>
        </p>
      )}

      {/* Payments */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payments Collected</p>
        <div className="space-y-3">
          <div
            className="w-full border-4 rounded-xl p-5 bg-indigo-200 border-indigo-300 text-indigo-900 cursor-pointer shadow-md transition"
            onClick={() => navigate('/admin/reports')}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-3xl font-bold mt-1">
              {currentTotal === null
                ? '…'
                : `₹${Number(currentTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs mt-1 opacity-60">total collected</p>
          </div>
          <div
            className="border rounded-xl p-3 bg-purple-50 border-purple-200 text-purple-900 cursor-pointer shadow-inner transition"
            onClick={() => navigate('/admin/reports')}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toLocaleString('default', { month: 'long', year: 'numeric' }); })()}
            </p>
            <p className="text-xl font-bold mt-1">
              {lastTotal === null
                ? '…'
                : `₹${Number(lastTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs mt-1 opacity-60">total collected</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            + Add Customer
          </button>
          <button
            onClick={() => navigate('/admin/areas')}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            + Add Area
          </button>

          <button
            onClick={handleRunScheduler}
            disabled={schedulerLoading}
            className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {schedulerLoading ? 'Running…' : 'Run Billing Scheduler'}
          </button>
        </div>
        {schedulerMsg && (
          <p className={`mt-3 text-sm ${schedulerOk ? 'text-green-700' : 'text-red-600'}`}>
            {schedulerMsg}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
