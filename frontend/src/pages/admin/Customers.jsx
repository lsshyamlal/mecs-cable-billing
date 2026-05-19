import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { listCustomers, getAreas } from '../../api';
import { StatusBadge, fmtDate, fmtCurrency } from '../../utils';

const STATUS_OPTIONS = ['', 'ACTIVE', 'GRACE', 'PAYMENT_PENDING', 'SUSPENDED', 'CANCELLED'];

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState(null);
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const statusFilter = searchParams.get('status') || '';
  const areaFilter = searchParams.get('areaId') || '';

  useEffect(() => {
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setCustomers(null);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (areaFilter) params.areaId = areaFilter;
    listCustomers(params)
      .then((r) => setCustomers(r.data))
      .catch(() => setError('Failed to load customers.'));
  }, [statusFilter, areaFilter]);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
  };

  const displayed = customers
    ? customers.filter((c) => {
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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
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
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setFilter('areaId', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
          ))}
        </select>
        {(statusFilter || areaFilter || search) && (
          <button
            onClick={() => { setSearch(''); setSearchParams({}); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      {customers === null ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 text-center">
          No customers found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">STB ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Area</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((c) => (
                  <tr
                    key={c.customerId}
                    onClick={() => navigate(`/admin/customers/${c.customerId}`)}
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.stbId || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.areaName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.phone}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.subscriptionStatus || c.status} /></td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{fmtDate(c.currentPaymentDueDate)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{fmtCurrency(c.currentPaymentAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {displayed.length} customer{displayed.length !== 1 ? 's' : ''}
            {customers.length !== displayed.length && ` (filtered from ${customers.length})`}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
