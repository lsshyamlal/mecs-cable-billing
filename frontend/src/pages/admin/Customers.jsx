import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  listCustomers,
  getCities,
  getAreas,
  getStreets,
  getCompanies,
  getGroups,
  getEmployees,
} from '../../api';
import { StatusBadge, fmtDate, fmtCurrency } from '../../utils';

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [streets, setStreets] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const statusFilter = searchParams.get('status') || '';
  const futureStatusFilter = searchParams.get('futureStatus') || '';
  const companyFilter = searchParams.get('companyId') || '';
  const cityFilter = searchParams.get('cityId') || '';
  const groupFilter = searchParams.get('groupId') || '';
  const employeeFilter = searchParams.get('employeeId') || '';
  const areaFilter = searchParams.get('areaId') || '';
  const streetFilter = searchParams.get('streetId') || '';

  useEffect(() => {
    getCompanies().then((r) => setCompanies(r.data)).catch(() => {});
    getCities().then((r) => setCities(r.data)).catch(() => {});
    getGroups().then((r) => setGroups(r.data)).catch(() => {});
    getEmployees().then((r) => setEmployees(r.data)).catch(() => {});
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
    getStreets().then((r) => setStreets(r.data)).catch(() => {});
  }, []);

  // company/street/area/city are all server-side; group/employee are client-side.
  useEffect(() => {
    setCustomers(null);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (futureStatusFilter) params.futureStatus = futureStatusFilter;
    if (streetFilter) {
      params.streetId = streetFilter;
    } else if (areaFilter) {
      params.areaId = areaFilter;
    } else if (cityFilter) {
      params.cityId = cityFilter;
    } else if (companyFilter) {
      params.companyId = companyFilter;
    }
    listCustomers(params)
      .then((r) => setCustomers(r.data))
      .catch(() => setError('Failed to load customers.'));
  }, [statusFilter, futureStatusFilter, companyFilter, cityFilter, areaFilter, streetFilter]);

  // Cascading dropdown options
  const filteredCities = useMemo(() => {
    if (!companyFilter) return cities;
    const co = companies.find((c) => String(c.companyId) === companyFilter);
    return co?.cityId ? cities.filter((c) => c.cityId === co.cityId) : cities;
  }, [cities, companies, companyFilter]);

  const filteredGroups = useMemo(() => {
    let g = groups;
    if (companyFilter) g = g.filter((x) => String(x.companyId) === companyFilter);
    return g;
  }, [groups, companyFilter]);

  const filteredEmployees = useMemo(() => {
    let emp = employees;
    if (companyFilter) emp = emp.filter((x) => String(x.companyId) === companyFilter);
    if (groupFilter) emp = emp.filter((x) => String(x.groupId) === groupFilter);
    return emp;
  }, [employees, companyFilter, groupFilter]);

  const filteredAreas = useMemo(() => {
    if (employeeFilter) {
      const emp = employees.find((e) => String(e.employeeId) === employeeFilter);
      const assigned = new Set((emp?.assignedAreas || []).map((aa) => aa.areaId));
      return areas.filter((x) => assigned.has(x.areaId));
    }
    let a = areas;
    if (groupFilter) {
      const empsInGroup = employees.filter((e) => String(e.groupId) === groupFilter);
      const assigned = new Set(empsInGroup.flatMap((e) => (e.assignedAreas || []).map((aa) => aa.areaId)));
      a = a.filter((x) => assigned.has(x.areaId));
    }
    if (cityFilter) {
      a = a.filter((x) => String(x.cityId) === cityFilter);
    } else if (companyFilter) {
      const co = companies.find((c) => String(c.companyId) === companyFilter);
      if (co?.cityId) a = a.filter((x) => x.cityId === co.cityId);
    }
    return a;
  }, [areas, companies, employees, companyFilter, cityFilter, groupFilter, employeeFilter]);

  const filteredStreets = useMemo(() => {
    if (areaFilter) return streets.filter((s) => String(s.areaId) === areaFilter);
    const allowedAreaIds = new Set(filteredAreas.map((a) => a.areaId));
    return streets.filter((s) => allowedAreaIds.has(s.areaId));
  }, [streets, filteredAreas, areaFilter]);

  // Cascading reset on every level change (URL-driven).
  const setCompany = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('companyId', val); else next.delete('companyId');
    next.delete('cityId'); next.delete('groupId'); next.delete('employeeId');
    next.delete('areaId'); next.delete('streetId');
    setSearchParams(next);
  };
  const setCity = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('cityId', val); else next.delete('cityId');
    next.delete('groupId'); next.delete('employeeId');
    next.delete('areaId'); next.delete('streetId');
    setSearchParams(next);
  };
  const setGroup = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('groupId', val); else next.delete('groupId');
    next.delete('employeeId'); next.delete('areaId'); next.delete('streetId');
    setSearchParams(next);
  };
  const setEmployee = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('employeeId', val); else next.delete('employeeId');
    next.delete('areaId'); next.delete('streetId');
    setSearchParams(next);
  };
  const setArea = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('areaId', val); else next.delete('areaId');
    next.delete('streetId');
    setSearchParams(next);
  };
  const setStreet = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('streetId', val); else next.delete('streetId');
    setSearchParams(next);
  };

  // Client-side hierarchy filter (group / employee — company is now server-side).
  const hierarchyMatches = (c) => {
    if (employeeFilter) {
      const emp = employees.find((e) => String(e.employeeId) === employeeFilter);
      const assigned = new Set((emp?.assignedAreas || []).map((aa) => aa.areaId));
      return assigned.has(c.areaId);
    }
    if (groupFilter) {
      const empsInGroup = employees.filter((e) => String(e.groupId) === groupFilter);
      const assigned = new Set(empsInGroup.flatMap((e) => (e.assignedAreas || []).map((aa) => aa.areaId)));
      return assigned.has(c.areaId);
    }
    return true;
  };

  const displayed = customers
    ? customers.filter(hierarchyMatches).filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          c.firstName?.toLowerCase().includes(q) ||
          c.lastName?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.stbId?.toLowerCase().includes(q)
        );
      })
    : [];

  const inputCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400';

  const anyFilter =
    statusFilter || futureStatusFilter || companyFilter || cityFilter ||
    groupFilter || employeeFilter || areaFilter || streetFilter || search;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Customers</h1>
        <button
          onClick={() => navigate('/admin/customers/new')}
          className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          + Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search name, phone, STB ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} w-full sm:w-56`}
        />
        <select
          value={futureStatusFilter ? `f:${futureStatusFilter}` : statusFilter ? `s:${statusFilter}` : ''}
          onChange={(e) => {
            const val = e.target.value;
            const next = new URLSearchParams(searchParams);
            next.delete('status');
            next.delete('futureStatus');
            if (val.startsWith('s:')) next.set('status', val.slice(2));
            else if (val.startsWith('f:')) next.set('futureStatus', val.slice(2));
            setSearchParams(next);
          }}
          className={inputCls}
        >
          <option value="">All Status</option>
          <optgroup label="Customer Status">
            <option value="s:ACTIVE">Active</option>
            <option value="s:ACCOUNT_CLOSED">Account Closed</option>
          </optgroup>
          <optgroup label="Current Subscription">
            <option value="s:PAID">Paid</option>
            <option value="s:GRACE">Grace Period</option>
            <option value="s:PAYMENT_PENDING">Payment Pending</option>
            <option value="s:SUSPENDED">Suspended</option>
          </optgroup>
          <optgroup label="Future Subscription">
            <option value="f:ACTIVE">Next Month Ready</option>
            <option value="f:CANCELLED">Cancelled</option>
          </optgroup>
        </select>
        <select
          value={companyFilter}
          onChange={(e) => setCompany(e.target.value)}
          className={inputCls}
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
        <select
          value={cityFilter}
          onChange={(e) => setCity(e.target.value)}
          className={inputCls}
        >
          <option value="">All Cities</option>
          {filteredCities.map((c) => (
            <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroup(e.target.value)}
          className={inputCls}
        >
          <option value="">All Groups</option>
          {filteredGroups.map((g) => (
            <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
          ))}
        </select>
        <select
          value={employeeFilter}
          onChange={(e) => setEmployee(e.target.value)}
          className={inputCls}
        >
          <option value="">All Employees</option>
          {filteredEmployees.map((e) => (
            <option key={e.employeeId} value={e.employeeId}>
              {e.firstName}{e.lastName ? ' ' + e.lastName : ''}
            </option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setArea(e.target.value)}
          className={inputCls}
        >
          <option value="">All Areas</option>
          {filteredAreas.map((a) => (
            <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
          ))}
        </select>
        <select
          value={streetFilter}
          onChange={(e) => setStreet(e.target.value)}
          className={inputCls}
        >
          <option value="">All Streets</option>
          {filteredStreets.map((s) => (
            <option key={s.streetId} value={s.streetId}>{s.streetName}</option>
          ))}
        </select>
        {anyFilter && (
          <button
            onClick={() => { setSearch(''); setSearchParams({}); }}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      {customers === null ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
          No customers found.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">STB ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">City</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Area</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Grace Deadline</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {displayed.map((c) => (
                  <tr
                    key={c.customerId}
                    onClick={() => navigate(`/admin/customers/${c.customerId}`)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{c.stbId || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{c.cityName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{c.areaName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{c.phone}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.subscriptionStatus || c.status} /></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{fmtDate(c.currentPaymentDueDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden xl:table-cell">{fmtDate(c.gracePeriodDeadline)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{fmtCurrency(c.currentPaymentAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
            {displayed.length} customer{displayed.length !== 1 ? 's' : ''}
            {customers.length !== displayed.length && ` (filtered from ${customers.length})`}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
