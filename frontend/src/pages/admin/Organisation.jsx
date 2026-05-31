import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  getCompanies, createCompany, updateCompany, deleteCompany,
  getCities, createCity, updateCity, deleteCity,
  getGroups, createGroup, updateGroup, deleteGroup,
  getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  resetEmployeePassword,
  getAreas, assignEmployeeAreas, removeEmployeeArea,
} from '../../api';

const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

// ── Shared helpers ────────────────────────────────────────────
function extractErr(err, fallback) {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).join(' • ');
  return data?.message || fallback;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mb-3">{msg}</div>
  );
}

function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 mb-4">{msg}</div>
  );
}

function DeleteModal({ title, message, onConfirm, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleConfirm = async () => {
    setLoading(true); setError('');
    try { await onConfirm(); onSuccess(); }
    catch (err) { setError(extractErr(err, 'Failed to delete.')); }
    finally { setLoading(false); }
  };
  return (
    <Modal title={title} onClose={onClose}>
      <ErrorMsg msg={error} />
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">{message}</p>
      <div className="flex gap-2">
        <button onClick={handleConfirm} disabled={loading}
          className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
          {loading ? 'Deleting…' : 'Delete'}
        </button>
        <button onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────
function Breadcrumb({ level, company, city, group, employee, onNavigate }) {
  const crumbs = [
    { label: 'All Companies', targetLevel: 'companies' },
    company && { label: company.companyName, targetLevel: 'cities' },
    city && { label: city.cityName, targetLevel: 'groups' },
    group && { label: group.groupName, targetLevel: 'employees' },
    employee && { label: `${employee.firstName}${employee.lastName ? ' ' + employee.lastName : ''}`, targetLevel: 'employee-detail' },
  ].filter(Boolean);

  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm mb-6">
      {crumbs.map((crumb, i) => (
        <span key={crumb.targetLevel} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-400 dark:text-gray-500">›</span>}
          {crumb.targetLevel === level ? (
            <span className="font-semibold text-gray-800 dark:text-gray-100">{crumb.label}</span>
          ) : (
            <button onClick={() => onNavigate(crumb.targetLevel)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{crumb.label}</button>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────
function Panel({ title, badge, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</h2>
        {badge && <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-2 p-4 animate-pulse">
      {[...Array(rows)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
    </div>
  );
}

// ── Companies panel ───────────────────────────────────────────
function CompaniesPanel({ onDrillInto, setFlash }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ companyName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = () => getCompanies().then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { reload(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await createCompany({ companyName: form.companyName.trim() });
      setForm({ companyName: '' });
      setFlash(`Company "${form.companyName}" added.`);
      reload();
    } catch (err) { setError(extractErr(err, 'Failed to add company.')); }
    finally { setLoading(false); }
  };

  return (
    <Panel title="Companies">
      {items === null ? <Skeleton /> : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No companies yet. Add one below.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {items.map((c) => (
              <tr key={c.companyId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3">
                  <button onClick={() => onDrillInto(c)}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition text-left">
                    {c.companyName} ›
                  </button>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.active ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setEditTarget(c)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3">Edit</button>
                  <button onClick={() => setDeleteTarget(c)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add Company</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name<span className="text-red-500 ml-0.5">*</span></label>
            <input value={form.companyName} onChange={(e) => setForm({ companyName: e.target.value })} required placeholder="e.g. MECS Cable" className={`${INPUT} w-64`} />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Adding…' : 'Add Company'}
          </button>
        </form>
      </div>

      {editTarget && (
        <Modal title={`Edit — ${editTarget.companyName}`} onClose={() => setEditTarget(null)}>
          <EditCompanyForm company={editTarget}
            onSuccess={(name) => { setEditTarget(null); setFlash(`Company "${name}" updated.`); reload(); }}
            onClose={() => setEditTarget(null)} />
        </Modal>
      )}
      {deleteTarget && (
        <DeleteModal title="Delete Company" message={`Delete company "${deleteTarget.companyName}"? This cannot be undone.`}
          onConfirm={() => deleteCompany(deleteTarget.companyId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash(`Company "${deleteTarget.companyName}" deleted.`); reload(); }} />
      )}
    </Panel>
  );
}

function EditCompanyForm({ company, onSuccess, onClose }) {
  const [form, setForm] = useState({ companyName: company.companyName, active: company.active });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await updateCompany(company.companyId, { companyName: form.companyName.trim(), active: form.active });
      onSuccess(form.companyName.trim());
    } catch (err) { setError(extractErr(err, 'Failed to update.')); }
    finally { setLoading(false); }
  };
  return (
    <>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name<span className="text-red-500 ml-0.5">*</span></label>
          <input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} required className={INPUT} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="co-active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded" />
          <label htmlFor="co-active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

// ── Cities panel ──────────────────────────────────────────────
function CitiesPanel({ company, onDrillInto, setFlash }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ cityName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = () => getCities(company.companyId).then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { reload(); }, [company.companyId]);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await createCity({ cityName: form.cityName.trim(), companyId: company.companyId });
      setForm({ cityName: '' });
      setFlash(`City "${form.cityName}" added.`);
      reload();
    } catch (err) { setError(extractErr(err, 'Failed to add city.')); }
    finally { setLoading(false); }
  };

  return (
    <Panel title="Cities" badge={company.companyName}>
      {items === null ? <Skeleton /> : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No cities linked to this company yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {items.map((c) => (
              <tr key={c.cityId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3">
                  <button onClick={() => onDrillInto(c)}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition text-left">
                    {c.cityName} ›
                  </button>
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setEditTarget(c)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3">Edit</button>
                  <button onClick={() => setDeleteTarget(c)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add City to {company.companyName}</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City Name<span className="text-red-500 ml-0.5">*</span></label>
            <input value={form.cityName} onChange={(e) => setForm({ cityName: e.target.value })} required placeholder="e.g. Madurai" className={`${INPUT} w-64`} />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Adding…' : 'Add City'}
          </button>
        </form>
      </div>

      {editTarget && (
        <Modal title={`Edit — ${editTarget.cityName}`} onClose={() => setEditTarget(null)}>
          <EditCityForm city={editTarget} companyId={company.companyId}
            onSuccess={(name) => { setEditTarget(null); setFlash(`City "${name}" updated.`); reload(); }}
            onClose={() => setEditTarget(null)} />
        </Modal>
      )}
      {deleteTarget && (
        <DeleteModal title="Delete City" message={`Delete city "${deleteTarget.cityName}"? This cannot be undone.`}
          onConfirm={() => deleteCity(deleteTarget.cityId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash(`City "${deleteTarget.cityName}" deleted.`); reload(); }} />
      )}
    </Panel>
  );
}

function EditCityForm({ city, companyId, onSuccess, onClose }) {
  const [name, setName] = useState(city.cityName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await updateCity(city.cityId, { cityName: name.trim(), companyId });
      onSuccess(name.trim());
    } catch (err) { setError(extractErr(err, 'Failed to update.')); }
    finally { setLoading(false); }
  };
  return (
    <>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City Name<span className="text-red-500 ml-0.5">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

// ── Groups panel ──────────────────────────────────────────────
function GroupsPanel({ company, city, onDrillInto, setFlash }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ groupName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = () =>
    getGroups(company.companyId)
      .then((r) => setItems(r.data.filter((g) => g.cityId === city.cityId)))
      .catch(() => setItems([]));
  useEffect(() => { reload(); }, [company.companyId, city.cityId]);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await createGroup({ companyId: company.companyId, cityId: city.cityId, groupName: form.groupName.trim() });
      setForm({ groupName: '' });
      setFlash(`Group "${form.groupName}" added.`);
      reload();
    } catch (err) { setError(extractErr(err, 'Failed to add group.')); }
    finally { setLoading(false); }
  };

  return (
    <Panel title="Groups" badge={`${company.companyName} › ${city.cityName}`}>
      {items === null ? <Skeleton /> : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No groups in this city yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {items.map((g) => (
              <tr key={g.groupId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3">
                  <button onClick={() => onDrillInto(g)}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition text-left">
                    {g.groupName} ›
                  </button>
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setEditTarget(g)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3">Edit</button>
                  <button onClick={() => setDeleteTarget(g)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add Group</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name<span className="text-red-500 ml-0.5">*</span></label>
            <input value={form.groupName} onChange={(e) => setForm({ groupName: e.target.value })} required placeholder="e.g. North Zone" className={`${INPUT} w-64`} />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Adding…' : 'Add Group'}
          </button>
        </form>
      </div>

      {editTarget && (
        <Modal title={`Edit — ${editTarget.groupName}`} onClose={() => setEditTarget(null)}>
          <EditGroupForm group={editTarget} company={company} city={city}
            onSuccess={(name) => { setEditTarget(null); setFlash(`Group "${name}" updated.`); reload(); }}
            onClose={() => setEditTarget(null)} />
        </Modal>
      )}
      {deleteTarget && (
        <DeleteModal title="Delete Group" message={`Delete group "${deleteTarget.groupName}"? This cannot be undone.`}
          onConfirm={() => deleteGroup(deleteTarget.groupId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash(`Group "${deleteTarget.groupName}" deleted.`); reload(); }} />
      )}
    </Panel>
  );
}

function EditGroupForm({ group, company, city, onSuccess, onClose }) {
  const [name, setName] = useState(group.groupName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await updateGroup(group.groupId, { companyId: company.companyId, cityId: city.cityId, groupName: name.trim() });
      onSuccess(name.trim());
    } catch (err) { setError(extractErr(err, 'Failed to update.')); }
    finally { setLoading(false); }
  };
  return (
    <>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name<span className="text-red-500 ml-0.5">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

// ── Employees panel ───────────────────────────────────────────
function EmployeesPanel({ group, onDrillInto, setFlash }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetPwTarget, setResetPwTarget] = useState(null);

  const reload = () => getEmployees(group.groupId).then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { reload(); }, [group.groupId]);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await createEmployee({
        groupId: group.groupId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        password: form.password,
      });
      setForm({ firstName: '', lastName: '', phone: '', email: '', password: '' });
      setFlash(`Employee "${form.firstName}" added.`);
      reload();
    } catch (err) { setError(extractErr(err, 'Failed to add employee.')); }
    finally { setLoading(false); }
  };

  return (
    <Panel title="Employees" badge={group.groupName}>
      {items === null ? <Skeleton /> : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No employees in this group yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {items.map((emp) => (
              <tr key={emp.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3">
                  <button onClick={() => onDrillInto(emp)}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition text-left">
                    {emp.firstName}{emp.lastName ? ' ' + emp.lastName : ''} ›
                  </button>
                </td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{emp.phone}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emp.active ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {emp.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setEditTarget(emp)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3">Edit</button>
                  <button onClick={() => setResetPwTarget(emp)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3">Reset Password</button>
                  <button onClick={() => setDeleteTarget(emp)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add Employee to {group.groupName}</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          {[
            { key: 'firstName', label: 'First Name', required: true, placeholder: 'First name' },
            { key: 'lastName', label: 'Last Name', placeholder: 'Last name' },
            { key: 'phone', label: 'Phone', required: true, placeholder: '9876543210' },
            { key: 'email', label: 'Email', placeholder: 'email@example.com' },
            { key: 'password', label: 'Password', required: true, type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, required, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                placeholder={placeholder}
                className={`${INPUT} w-36`}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Adding…' : 'Add Employee'}
          </button>
        </form>
      </div>

      {editTarget && (
        <Modal title={`Edit — ${editTarget.firstName}`} onClose={() => setEditTarget(null)}>
          <EditEmployeeForm employee={editTarget}
            onSuccess={(name) => { setEditTarget(null); setFlash(`Employee "${name}" updated.`); reload(); }}
            onClose={() => setEditTarget(null)} />
        </Modal>
      )}
      {resetPwTarget && (
        <Modal title={`Reset Password — ${resetPwTarget.firstName}${resetPwTarget.lastName ? ' ' + resetPwTarget.lastName : ''}`} onClose={() => setResetPwTarget(null)}>
          <ResetEmployeePasswordForm employeeId={resetPwTarget.employeeId}
            onSuccess={() => { const name = `${resetPwTarget.firstName}${resetPwTarget.lastName ? ' ' + resetPwTarget.lastName : ''}`; setResetPwTarget(null); setFlash(`Password reset for "${name}".`); }}
            onClose={() => setResetPwTarget(null)} />
        </Modal>
      )}
      {deleteTarget && (
        <DeleteModal title="Delete Employee"
          message={`Delete employee "${deleteTarget.firstName}${deleteTarget.lastName ? ' ' + deleteTarget.lastName : ''}"? This cannot be undone.`}
          onConfirm={() => deleteEmployee(deleteTarget.employeeId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash('Employee deleted.'); reload(); }} />
      )}
    </Panel>
  );
}

function EditEmployeeForm({ employee, onSuccess, onClose }) {
  const [form, setForm] = useState({ firstName: employee.firstName, lastName: employee.lastName || '', phone: employee.phone || '', email: employee.email || '', active: employee.active });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phoneChanged = form.phone.trim() !== (employee.phone || '');
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await updateEmployee(employee.employeeId, { firstName: form.firstName.trim(), lastName: form.lastName.trim() || null, phone: form.phone.trim(), email: form.email.trim() || null, active: form.active });
      onSuccess(form.firstName.trim());
    } catch (err) { setError(extractErr(err, 'Failed to update.')); }
    finally { setLoading(false); }
  };
  return (
    <>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'firstName', label: 'First Name', required: true },
          { key: 'lastName', label: 'Last Name' },
          { key: 'phone', label: 'Phone (login ID)', required: true, hint: phoneChanged ? 'Changing the phone signs the employee out of any active session.' : null },
          { key: 'email', label: 'Email' },
        ].map(({ key, label, required, hint }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required={required} className={INPUT} />
            {hint && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{hint}</p>}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="emp-active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded" />
          <label htmlFor="emp-active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </>
  );
}

function ResetEmployeePasswordForm({ employeeId, onSuccess, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await resetEmployeePassword(employeeId, { newPassword });
      onSuccess();
    } catch (err) { setError(extractErr(err, 'Failed to reset password.')); }
    finally { setLoading(false); }
  };
  return (
    <>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">Resets the employee's login password and signs them out of any active session.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password<span className="text-red-500 ml-0.5">*</span></label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password<span className="text-red-500 ml-0.5">*</span></label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className={INPUT} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Reset Password'}</button>
        </div>
      </form>
    </>
  );
}

// ── Employee detail panel ─────────────────────────────────────
function EmployeeDetailPanel({ employeeId, group, setFlash }) {
  const [emp, setEmp] = useState(null);
  const [allAreas, setAllAreas] = useState([]);
  const [groupEmployees, setGroupEmployees] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [resetPwModal, setResetPwModal] = useState(false);

  const reload = () => getEmployee(employeeId).then((r) => setEmp(r.data)).catch(() => {});
  useEffect(() => {
    reload();
    getAreas().then((r) => setAllAreas(r.data)).catch(() => {});
    if (group) getEmployees(group.groupId).then((r) => setGroupEmployees(r.data)).catch(() => {});
  }, [employeeId, group?.groupId]);

  if (!emp) return <Skeleton rows={4} />;

  const assignedAreaIds = new Set((emp.assignedAreas || []).map((a) => a.areaId));
  const takenByOthers = new Set(
    groupEmployees
      .filter((e) => e.employeeId !== employeeId)
      .flatMap((e) => (e.assignedAreas || []).map((a) => a.areaId))
  );
  const availableAreas = allAreas.filter((a) => !assignedAreaIds.has(a.areaId) && !takenByOthers.has(a.areaId));
  const fullName = emp.firstName + (emp.lastName ? ' ' + emp.lastName : '');

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{fullName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{emp.phone}{emp.email ? ` · ${emp.email}` : ''}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Group: {emp.groupName} · {emp.companyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emp.active ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              {emp.active ? 'Active' : 'Inactive'}
            </span>
            <button onClick={() => setResetPwModal(true)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg transition">
              Reset Password
            </button>
            <button onClick={() => setEditModal(true)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg transition">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Assigned areas */}
      <Panel title="Assigned Areas">
        {(emp.assignedAreas || []).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No areas assigned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {emp.assignedAreas.map((a) => (
                <tr key={a.areaId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-100">{a.areaName}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{a.cityName}</td>
                  <td className="px-6 py-3 text-right flex items-center justify-end gap-3">
                    <Link to={`/admin/customers?areaId=${a.areaId}`}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition">
                      View Customers →
                    </Link>
                    <button onClick={() => setRemoveTarget(a)}
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => setAssignModal(true)} disabled={availableAreas.length === 0}
            className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {availableAreas.length === 0 ? 'All areas assigned' : 'Assign Areas'}
          </button>
        </div>
      </Panel>

      {/* Edit modal */}
      {editModal && (
        <Modal title={`Edit — ${fullName}`} onClose={() => setEditModal(false)}>
          <EditEmployeeForm employee={emp}
            onSuccess={(name) => { setEditModal(false); setFlash(`Employee "${name}" updated.`); reload(); }}
            onClose={() => setEditModal(false)} />
        </Modal>
      )}

      {/* Reset password modal */}
      {resetPwModal && (
        <Modal title={`Reset Password — ${fullName}`} onClose={() => setResetPwModal(false)}>
          <ResetEmployeePasswordForm employeeId={emp.employeeId}
            onSuccess={() => { setResetPwModal(false); setFlash(`Password reset for "${fullName}".`); }}
            onClose={() => setResetPwModal(false)} />
        </Modal>
      )}

      {/* Assign areas modal */}
      {assignModal && (
        <AssignAreasModal employee={emp} availableAreas={availableAreas}
          onClose={() => setAssignModal(false)}
          onSuccess={() => { setAssignModal(false); setFlash('Areas assigned.'); reload(); }} />
      )}

      {/* Remove area confirm */}
      {removeTarget && (
        <DeleteModal title="Remove Area"
          message={`Remove area "${removeTarget.areaName}" from ${fullName}?`}
          onConfirm={() => removeEmployeeArea(emp.employeeId, removeTarget.areaId)}
          onClose={() => setRemoveTarget(null)}
          onSuccess={() => { setRemoveTarget(null); setFlash(`Area "${removeTarget.areaName}" removed.`); reload(); }} />
      )}
    </div>
  );
}

function AssignAreasModal({ employee, availableAreas, onClose, onSuccess }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (areaId) =>
    setSelected((prev) => prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) return;
    setLoading(true); setError('');
    try {
      await assignEmployeeAreas(employee.employeeId, { areaIds: selected });
      onSuccess();
    } catch (err) { setError(extractErr(err, 'Failed to assign areas.')); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Assign Areas" onClose={onClose}>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
          {availableAreas.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No unassigned areas available.</p>
          ) : availableAreas.map((a) => (
            <label key={a.areaId} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 py-1 rounded">
              <input type="checkbox" checked={selected.includes(a.areaId)} onChange={() => toggle(a.areaId)} className="rounded" />
              <span>{a.areaName}</span>
              {a.cityName && <span className="text-xs text-gray-400 dark:text-gray-500">({a.cityName})</span>}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading || selected.length === 0} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Assigning…' : `Assign ${selected.length > 0 ? selected.length : ''} Area${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Organisation() {
  const [level, setLevel] = useState('companies');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const navigate = (targetLevel) => {
    setLevel(targetLevel);
    if (targetLevel === 'companies') { setSelectedCompany(null); setSelectedCity(null); setSelectedGroup(null); setSelectedEmployee(null); }
    else if (targetLevel === 'cities') { setSelectedCity(null); setSelectedGroup(null); setSelectedEmployee(null); }
    else if (targetLevel === 'groups') { setSelectedGroup(null); setSelectedEmployee(null); }
    else if (targetLevel === 'employees') { setSelectedEmployee(null); }
  };

  const drillCompany = (company) => { setSelectedCompany(company); setLevel('cities'); };
  const drillCity = (city) => { setSelectedCity(city); setLevel('groups'); };
  const drillGroup = (group) => { setSelectedGroup(group); setLevel('employees'); };
  const drillEmployee = (emp) => { setSelectedEmployee(emp); setLevel('employee-detail'); };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Manage Organisation</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Manage companies, cities, groups, employees, and their area assignments.</p>

      <SuccessMsg msg={flash} />

      <Breadcrumb
        level={level}
        company={selectedCompany}
        city={selectedCity}
        group={selectedGroup}
        employee={selectedEmployee}
        onNavigate={navigate}
      />

      {level === 'companies' && (
        <CompaniesPanel onDrillInto={drillCompany} setFlash={setFlash} />
      )}
      {level === 'cities' && selectedCompany && (
        <CitiesPanel company={selectedCompany} onDrillInto={drillCity} setFlash={setFlash} />
      )}
      {level === 'groups' && selectedCompany && selectedCity && (
        <GroupsPanel company={selectedCompany} city={selectedCity} onDrillInto={drillGroup} setFlash={setFlash} />
      )}
      {level === 'employees' && selectedGroup && (
        <EmployeesPanel group={selectedGroup} onDrillInto={drillEmployee} setFlash={setFlash} />
      )}
      {level === 'employee-detail' && selectedEmployee && (
        <EmployeeDetailPanel employeeId={selectedEmployee.employeeId} group={selectedGroup} setFlash={setFlash} />
      )}
    </AdminLayout>
  );
}
