import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  listCustomers,
  runScheduler,
  getSchedulerLogs,
  getMonthlyPaymentSummary,
  getCompanies,
  getCities,
  getAreas,
  getGroups,
  getEmployees,
} from '../../api';

const SELECT_CLS =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const CUSTOMER_STATUS_GROUPS = [
  { key: 'ACTIVE', label: 'Active', color: 'bg-green-200 border-green-300 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-200' },
  { key: 'SUSPENDED', label: 'Suspended', color: 'bg-red-200 border-red-300 text-red-900 dark:bg-red-900 dark:border-red-700 dark:text-red-200' },
  { key: 'ACCOUNT_CLOSED', label: 'Account Closed', color: 'bg-gray-200 border-gray-300 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
];

const CURRENT_SUBSCRIPTION_GROUPS = [
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300' },
  { key: 'PAID',            label: 'Paid',            color: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' },
  { key: 'GRACE',           label: 'Grace Period',    color: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300' },
  { key: 'SUSPENDED',       label: 'Suspended',       color: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300' },
];

const FUTURE_SUBSCRIPTION_GROUPS = [
  { key: 'ACTIVE',    label: 'Next Month Ready', color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' },
  { key: 'CANCELLED', label: 'Cancelled',        color: 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-400' },
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

  const [schedulerLogs, setSchedulerLogs] = useState(null);
  const [schedulerLogsPage, setSchedulerLogsPage] = useState(0);
  const [schedulerLogsTotalPages, setSchedulerLogsTotalPages] = useState(0);
  const [schedulerLogsLoading, setSchedulerLogsLoading] = useState(false);

  // Hierarchy data
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Hierarchy filter state (empty string = no filter at that level)
  const [companyId, setCompanyId] = useState('');
  const [cityId, setCityId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [areaId, setAreaId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    listCustomers({}).then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
    getMonthlyPaymentSummary().then((r) => setCurrentTotal(r.data.total)).catch(() => setCurrentTotal(0));
    getMonthlyPaymentSummary(toYearMonth(lastMonth))
      .then((r) => setLastTotal(r.data.total))
      .catch(() => setLastTotal(0));

    getCompanies().then((r) => setCompanies(r.data)).catch(() => setCompanies([]));
    getCities().then((r) => setCities(r.data)).catch(() => setCities([]));
    getAreas().then((r) => setAreas(r.data)).catch(() => setAreas([]));
    getGroups().then((r) => setGroups(r.data)).catch(() => setGroups([]));
    getEmployees().then((r) => setEmployees(r.data)).catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    setSchedulerLogsLoading(true);
    getSchedulerLogs(schedulerLogsPage)
      .then((r) => {
        setSchedulerLogs(r.data.content);
        setSchedulerLogsTotalPages(r.data.totalPages);
      })
      .catch(() => setSchedulerLogs([]))
      .finally(() => setSchedulerLogsLoading(false));
  }, [schedulerLogsPage]);

  // Cascading dropdown options
  // City ↔ company is now many-to-many — a city no longer carries a single companyId.
  // Resolve the company's served city IDs via companies[].cities.
  const companyCityIds = useMemo(() => {
    if (!companyId) return null;
    const co = companies.find((c) => String(c.companyId) === companyId);
    return new Set((co?.cities || []).map((c) => c.cityId));
  }, [companies, companyId]);

  const availableCities = useMemo(
    () => (companyCityIds ? cities.filter((c) => companyCityIds.has(c.cityId)) : cities),
    [cities, companyCityIds]
  );

  const availableGroups = useMemo(() => {
    let g = groups;
    if (companyId) g = g.filter((x) => String(x.companyId) === companyId);
    if (cityId) g = g.filter((x) => String(x.cityId) === cityId);
    return g;
  }, [groups, companyId, cityId]);

  const availableEmployees = useMemo(() => {
    let emp = employees;
    if (companyId) emp = emp.filter((x) => String(x.companyId) === companyId);
    if (groupId) {
      emp = emp.filter((x) => String(x.groupId) === groupId);
    } else if (cityId) {
      const groupsInCity = new Set(
        groups.filter((g) => String(g.cityId) === cityId).map((g) => g.groupId)
      );
      emp = emp.filter((x) => groupsInCity.has(x.groupId));
    }
    return emp;
  }, [employees, groups, companyId, cityId, groupId]);

  const availableAreas = useMemo(() => {
    if (employeeId) {
      const emp = employees.find((e) => String(e.employeeId) === employeeId);
      const assigned = new Set((emp?.assignedAreas || []).map((aa) => aa.areaId));
      return areas.filter((x) => assigned.has(x.areaId));
    }
    let a = areas;
    if (groupId) {
      const empsInGroup = employees.filter((e) => String(e.groupId) === groupId);
      const assigned = new Set(empsInGroup.flatMap((e) => (e.assignedAreas || []).map((aa) => aa.areaId)));
      a = a.filter((x) => assigned.has(x.areaId));
    }
    if (cityId) {
      a = a.filter((x) => String(x.cityId) === cityId);
    } else if (companyCityIds) {
      a = a.filter((x) => companyCityIds.has(x.cityId));
    }
    return a;
  }, [areas, employees, companyCityIds, cityId, groupId, employeeId]);

  // Apply hierarchy filter to customers (client-side, since the listCustomers API
  // doesn't accept companyId / groupId / employeeId).
  const filteredCustomers = useMemo(() => {
    if (!customers) return null;
    return customers.filter((c) => {
      if (areaId) return String(c.areaId) === areaId;
      if (employeeId) {
        const emp = employees.find((e) => String(e.employeeId) === employeeId);
        const assigned = new Set((emp?.assignedAreas || []).map((aa) => aa.areaId));
        return assigned.has(c.areaId);
      }
      if (groupId) {
        const empsInGroup = employees.filter((e) => String(e.groupId) === groupId);
        const assigned = new Set(empsInGroup.flatMap((e) => (e.assignedAreas || []).map((aa) => aa.areaId)));
        return assigned.has(c.areaId);
      }
      if (cityId) return String(c.cityId) === cityId;
      if (companyId) return String(c.companyId) === companyId;
      return true;
    });
  }, [customers, employees, companyId, cityId, groupId, employeeId, areaId]);

  const countFor = (defs, field) =>
    filteredCustomers
      ? defs.map((g) => ({
          ...g,
          count: filteredCustomers.filter((c) => c[field] === g.key).length,
        }))
      : defs.map((g) => ({ ...g, count: null }));

  const customerCounts = countFor(CUSTOMER_STATUS_GROUPS, 'status');
  const currentSubCounts = countFor(CURRENT_SUBSCRIPTION_GROUPS, 'subscriptionStatus');
  const futureSubCounts = countFor(FUTURE_SUBSCRIPTION_GROUPS, 'futureSubscriptionStatus');

  // Cascading reset: changing a level clears every level below it.
  const handleCompanyChange = (val) => {
    setCompanyId(val);
    setCityId(''); setGroupId(''); setEmployeeId(''); setAreaId('');
  };
  const handleCityChange = (val) => {
    setCityId(val);
    setGroupId(''); setEmployeeId(''); setAreaId('');
  };
  const handleGroupChange = (val) => {
    setGroupId(val);
    setEmployeeId(''); setAreaId('');
  };
  const handleEmployeeChange = (val) => {
    setEmployeeId(val);
    setAreaId('');
  };
  const clearFilters = () => {
    setCompanyId(''); setCityId(''); setGroupId(''); setEmployeeId(''); setAreaId('');
  };

  const hasFilter = Boolean(companyId || cityId || groupId || employeeId || areaId);

  // Build the click-through URL for a status card so the filter survives navigation.
  // The Customers page reads each hierarchy level from the URL — company/group/
  // employee are applied client-side there, the rest server-side.
  const navUrl = (statusParam, key) => {
    const p = new URLSearchParams();
    p.set(statusParam, key);
    if (companyId) p.set('companyId', companyId);
    if (cityId) p.set('cityId', cityId);
    if (groupId) p.set('groupId', groupId);
    if (employeeId) p.set('employeeId', employeeId);
    if (areaId) p.set('areaId', areaId);
    return `/admin/customers?${p}`;
  };

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
      // Refresh logs, jump to first page to show the new entry
      setSchedulerLogsPage(0);
      getSchedulerLogs(0)
        .then((r) => { setSchedulerLogs(r.data.content); setSchedulerLogsTotalPages(r.data.totalPages); })
        .catch(() => {});
    } catch {
      setSchedulerMsg('Failed to run scheduler.');
    } finally {
      setSchedulerLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
      </div>

      <div className="space-y-6">

        {/* Hierarchy Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Filter by Hierarchy</p>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="mb-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-4">
            <label className="block text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">Company</label>
            <select
              value={companyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full border-2 border-blue-300 dark:border-blue-700 rounded-lg px-4 py-3 text-base font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.filter((c) => c.active).map((c) => (
                <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
              ))}
              {companies.some((c) => !c.active) && (
                <optgroup label="Inactive">
                  {companies.filter((c) => !c.active).map((c) => (
                    <option key={c.companyId} value={c.companyId}>{c.companyName} (Inactive)</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
              <select value={cityId} onChange={(e) => handleCityChange(e.target.value)} className={SELECT_CLS}>
                <option value="">All Cities</option>
                {availableCities.map((c) => (
                  <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Group</label>
              <select value={groupId} onChange={(e) => handleGroupChange(e.target.value)} className={SELECT_CLS}>
                <option value="">All Groups</option>
                {availableGroups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Employee</label>
              <select value={employeeId} onChange={(e) => handleEmployeeChange(e.target.value)} className={SELECT_CLS}>
                <option value="">All Employees</option>
                {availableEmployees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.firstName}{e.lastName ? ' ' + e.lastName : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Area</label>
              <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={SELECT_CLS}>
                <option value="">All Areas</option>
                {availableAreas.map((a) => (
                  <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
                ))}
              </select>
            </div>
          </div>
          {customers && filteredCustomers && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              {hasFilter
                ? `Showing ${filteredCustomers.length} of ${customers.length} customers`
                : `Showing all ${customers.length} customers`}
            </p>
          )}
        </div>

        {/* Customer Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Customer Status</p>
          {filteredCustomers && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Total: <span className="font-semibold text-gray-600 dark:text-gray-300">{filteredCustomers.length}</span>
            </p>
          )}
          <div className="space-y-3">
            <button
              onClick={() => navigate(navUrl('status', customerCounts[0].key))}
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
                  onClick={() => navigate(navUrl('status', g.key))}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Current Subscription Status</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(navUrl('status', currentSubCounts[0].key))}
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
                  onClick={() => navigate(navUrl('status', g.key))}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Future Subscription Status</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(navUrl('futureStatus', futureSubCounts[0].key))}
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
                  onClick={() => navigate(navUrl('futureStatus', g.key))}
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

        {/* Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Payments Collected</p>
            {hasFilter && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">aggregate · not filtered</p>
            )}
          </div>
          <div className="space-y-3">
            <div
              className="w-full border-4 rounded-xl p-5 bg-indigo-200 border-indigo-300 text-indigo-900 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-200 cursor-pointer shadow-md transition"
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
              className="border rounded-xl p-3 bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300 cursor-pointer shadow-inner transition"
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

        {/* Billing Scheduler Log */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Billing Scheduler Log</p>
            <button
              onClick={handleRunScheduler}
              disabled={schedulerLoading}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              {schedulerLoading ? 'Running…' : 'Run Billing Scheduler'}
            </button>
          </div>
          {schedulerMsg && (
            <p className={`mb-3 text-sm ${schedulerOk ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {schedulerMsg}
            </p>
          )}
          {schedulerLogsLoading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
          ) : schedulerLogs && schedulerLogs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No scheduler runs recorded yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Run At</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Triggered By</th>
                      <th className="text-right py-2 pr-4 text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">→ Grace</th>
                      <th className="text-right py-2 pr-4 text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">→ Pending</th>
                      <th className="text-right py-2 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Deactivated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(schedulerLogs || []).map((log) => {
                      const runAt = new Date(log.runAt);
                      const total = log.graceCount + log.pendingCount + log.deactivatedCount;
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                        >
                          <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                            {log.runDate}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {runAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              log.triggeredBy === 'SYSTEM'
                                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}>
                              {log.triggeredBy}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {log.graceCount > 0 ? (
                              <span className="font-semibold text-yellow-700 dark:text-yellow-400">{log.graceCount}</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {log.pendingCount > 0 ? (
                              <span className="font-semibold text-orange-700 dark:text-orange-400">{log.pendingCount}</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            {log.deactivatedCount > 0 ? (
                              <span className="font-semibold text-red-700 dark:text-red-400">{log.deactivatedCount}</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {schedulerLogsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setSchedulerLogsPage((p) => Math.max(0, p - 1))}
                    disabled={schedulerLogsPage === 0}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 disabled:text-gray-300 dark:disabled:text-gray-600 hover:underline disabled:no-underline transition"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Page {schedulerLogsPage + 1} of {schedulerLogsTotalPages}
                  </span>
                  <button
                    onClick={() => setSchedulerLogsPage((p) => Math.min(schedulerLogsTotalPages - 1, p + 1))}
                    disabled={schedulerLogsPage >= schedulerLogsTotalPages - 1}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 disabled:text-gray-300 dark:disabled:text-gray-600 hover:underline disabled:no-underline transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
