import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAreas, getPaymentReport, getCustomerReport, exportReportUrl } from '../../api';
import { StatusBadge, fmtDate, fmtCurrency } from '../../utils';

const STATUS_OPTIONS = ['ACTIVE', 'GRACE', 'PAYMENT_PENDING', 'SUSPENDED', 'CANCELLED'];

function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
      <h2 className="text-base font-semibold text-gray-700">{title}</h2>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function ExportBtn({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
    >
      {label}
    </a>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('payments');
  const [areas, setAreas] = useState([]);

  // Payment report state
  const [pFrom, setPFrom] = useState('');
  const [pTo, setPTo] = useState('');
  const [pArea, setPArea] = useState('');
  const [pRows, setPRows] = useState(null);
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState('');

  // Customer report state
  const [cStatus, setCStatus] = useState('');
  const [cArea, setCArea] = useState('');
  const [cRows, setCRows] = useState(null);
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState('');

  useEffect(() => {
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
  }, []);

  const runPaymentReport = async (e) => {
    e?.preventDefault();
    setPLoading(true); setPError(''); setPRows(null);
    try {
      const params = {};
      if (pFrom) params.from = pFrom;
      if (pTo) params.to = pTo;
      if (pArea) params.areaId = pArea;
      const r = await getPaymentReport(params);
      setPRows(r.data);
    } catch {
      setPError('Failed to load payment report.');
    } finally {
      setPLoading(false);
    }
  };

  const runCustomerReport = async (e) => {
    e?.preventDefault();
    setCLoading(true); setCError(''); setCRows(null);
    try {
      const params = {};
      if (cStatus) params.status = cStatus;
      if (cArea) params.areaId = cArea;
      const r = await getCustomerReport(params);
      setCRows(r.data);
    } catch {
      setCError('Failed to load customer report.');
    } finally {
      setCLoading(false);
    }
  };

  const pTotal = pRows ? pRows.reduce((s, r) => s + Number(r.amount), 0) : 0;

  const pExportParams = {};
  if (pFrom) pExportParams.from = pFrom;
  if (pTo) pExportParams.to = pTo;
  if (pArea) pExportParams.areaId = pArea;

  const cExportParams = {};
  if (cStatus) cExportParams.status = cStatus;
  if (cArea) cExportParams.areaId = cArea;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-5">Reports</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['payments', 'customers'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'payments' ? 'Payments' : 'Customers'}
          </button>
        ))}
      </div>

      {/* ── Payment Report ── */}
      {tab === 'payments' && (
        <div>
          <form onSubmit={runPaymentReport} className="flex flex-wrap gap-3 items-end mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date" value={pFrom} onChange={(e) => setPFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date" value={pTo} onChange={(e) => setPTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
              <select
                value={pArea} onChange={(e) => setPArea(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Areas</option>
                {areas.map((a) => <option key={a.areaId} value={a.areaId}>{a.areaName}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={pLoading}
              className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
            >
              {pLoading ? 'Loading…' : 'Run Report'}
            </button>
          </form>

          {pError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{pError}</div>
          )}

          {pRows !== null && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionHeader title={`${pRows.length} payment${pRows.length !== 1 ? 's' : ''} · Total: ${fmtCurrency(pTotal)}`}>
                  <ExportBtn href={exportReportUrl('reports/payments/export', { ...pExportParams, format: 'csv' })} label="Export CSV" />
                  <ExportBtn href={exportReportUrl('reports/payments/export', { ...pExportParams, format: 'excel' })} label="Export Excel" />
                </SectionHeader>
              </div>
              {pRows.length === 0 ? (
                <p className="text-sm text-gray-500 px-6 py-5">No payments found for the selected filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Area</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">For Month</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Method</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pRows.map((row) => (
                        <tr key={row.paymentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{fmtDate(row.paymentDate)}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{row.customerName}</td>
                          <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{row.areaName}</td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.phone}</td>
                          <td className="px-4 py-3 text-gray-600">{fmtDate(row.forMonth)}</td>
                          <td className="px-4 py-3 text-gray-800 font-semibold text-right">{fmtCurrency(row.amount)}</td>
                          <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{row.paymentMethod || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{row.recordedByName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{fmtCurrency(pTotal)}</td>
                        <td colSpan={2} className="hidden lg:table-cell" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Customer Report ── */}
      {tab === 'customers' && (
        <div>
          <form onSubmit={runCustomerReport} className="flex flex-wrap gap-3 items-end mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={cStatus} onChange={(e) => setCStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
              <select
                value={cArea} onChange={(e) => setCArea(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Areas</option>
                {areas.map((a) => <option key={a.areaId} value={a.areaId}>{a.areaName}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={cLoading}
              className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
            >
              {cLoading ? 'Loading…' : 'Run Report'}
            </button>
          </form>

          {cError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{cError}</div>
          )}

          {cRows !== null && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionHeader title={`${cRows.length} customer${cRows.length !== 1 ? 's' : ''}`}>
                  <ExportBtn href={exportReportUrl('reports/customers/export', { ...cExportParams, format: 'csv' })} label="Export CSV" />
                  <ExportBtn href={exportReportUrl('reports/customers/export', { ...cExportParams, format: 'excel' })} label="Export Excel" />
                </SectionHeader>
              </div>
              {cRows.length === 0 ? (
                <p className="text-sm text-gray-500 px-6 py-5">No customers found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">STB ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Area</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cRows.map((c) => (
                        <tr key={c.customerId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden sm:table-cell">{c.stbId || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.areaName || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.phone}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{fmtDate(c.currentPaymentDueDate)}</td>
                          <td className="px-4 py-3 text-gray-600 text-right hidden lg:table-cell">{fmtCurrency(c.currentPaymentAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
