import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { listCustomers, runScheduler } from '../../api';

const CUSTOMER_STATUS_GROUPS = [
  { key: 'ACTIVE', label: 'Active', color: 'bg-green-200 border-green-300 text-green-900' },
  { key: 'SUSPENDED', label: 'Suspended', color: 'bg-red-200 border-red-300 text-red-900' },
  { key: 'ACCOUNT_CLOSED', label: 'Account Closed', color: 'bg-gray-200 border-gray-300 text-gray-800' },
];

const CURRENT_SUBSCRIPTION_GROUPS = [
  { key: 'PAID',            label: 'Paid',            color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'GRACE',           label: 'Grace Period',    color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'SUSPENDED',       label: 'Suspended',       color: 'bg-red-50 border-red-200 text-red-700' },
];

const FUTURE_SUBSCRIPTION_GROUPS = [
  { key: 'ACTIVE',    label: 'Next Month Ready', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'CANCELLED', label: 'Cancelled',        color: 'bg-gray-50 border-gray-200 text-gray-600' },
];

export default function Dashboard() {
  const [customers, setCustomers] = useState(null);
  const [schedulerMsg, setSchedulerMsg] = useState('');
  const [schedulerOk, setSchedulerOk] = useState(false);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listCustomers({}).then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
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
        <div className="grid grid-cols-3 gap-4">
          {customerCounts.map((g) => (
            <button
              key={g.key}
              onClick={() => navigate(`/admin/customers?status=${g.key}`)}
              className={`border rounded-xl p-4 text-left hover:shadow-md transition ${g.color}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{g.label}</p>
              <p className="text-3xl font-bold mt-1">
                {g.count === null ? '…' : g.count}
              </p>
              <p className="text-xs mt-1 opacity-60">customers</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current Subscription Status */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Subscription Status</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {currentSubCounts.map((g) => (
            <button
              key={g.key}
              onClick={() => navigate(`/admin/customers?status=${g.key}`)}
              className={`border rounded-xl p-4 text-left hover:shadow-md transition ${g.color}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{g.label}</p>
              <p className="text-3xl font-bold mt-1">{g.count === null ? '…' : g.count}</p>
              <p className="text-xs mt-1 opacity-60">customers</p>
            </button>
          ))}
        </div>
      </div>

      {/* Future Subscription Status */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Future Subscription Status</p>
        <div className="grid grid-cols-2 gap-4">
          {futureSubCounts.map((g) => (
            <div key={g.key} className={`border rounded-xl p-4 ${g.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{g.label}</p>
              <p className="text-3xl font-bold mt-1">{g.count === null ? '…' : g.count}</p>
              <p className="text-xs mt-1 opacity-60">customers</p>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      {customers && (
        <p className="text-sm text-gray-500 mb-8">
          Total customers: <span className="font-semibold text-gray-700">{customers.length}</span>
        </p>
      )}

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
