import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getSubscriptionPacks, createSubscriptionPack, updateSubscriptionPack } from '../../api';

const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

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

const EMPTY_FORM = { packName: '', monthlyRate: '', description: '' };

function extractError(err) {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).join(' • ');
  return data?.message || 'An error occurred.';
}

export default function SubscriptionPacks() {
  const [packs, setPacks] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const reload = () => {
    getSubscriptionPacks().then((r) => setPacks(r.data)).catch(() => setPacks([]));
  };

  useEffect(() => { reload(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openEdit = (pack) => {
    setEditTarget(pack);
    setEditForm({
      packName: pack.packName,
      monthlyRate: String(pack.monthlyRate),
      description: pack.description ?? '',
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await createSubscriptionPack({
        packName: form.packName,
        monthlyRate: Number(form.monthlyRate),
        description: form.description || null,
      });
      setForm(EMPTY_FORM);
      setSuccess(`Pack "${form.packName}" created.`);
      reload();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true); setEditError('');
    try {
      await updateSubscriptionPack(editTarget.packId, {
        packName: editForm.packName,
        monthlyRate: Number(editForm.monthlyRate),
        description: editForm.description || null,
      });
      setSuccess(`Pack "${editForm.packName}" updated.`);
      closeEdit();
      reload();
    } catch (err) {
      setEditError(extractError(err));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Subscription Packs</h1>

      {/* Existing packs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">All Packs</h2>
        </div>
        {packs === null ? (
          <div className="space-y-2 p-4 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
          </div>
        ) : packs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No subscription packs yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pack Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monthly Rate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {packs.map((p) => (
                <tr key={p.packId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-100">{p.packName}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">₹{Number(p.monthlyRate).toFixed(2)}</td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{p.description || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add pack form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Add New Pack</h2>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mb-3">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 mb-3">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pack Name<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              name="packName"
              value={form.packName}
              onChange={onChange}
              required
              placeholder="e.g. Basic"
              className={`${INPUT} w-44`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly Rate (₹)<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              name="monthlyRate"
              type="number"
              min="0.01"
              step="0.01"
              value={form.monthlyRate}
              onChange={onChange}
              required
              placeholder="e.g. 250.00"
              className={`${INPUT} w-32`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Optional"
              className={`${INPUT} w-56`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Adding…' : 'Add Pack'}
          </button>
        </form>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit Pack — ${editTarget.packName}`} onClose={closeEdit}>
          {editError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mb-3">{editError}</div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pack Name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="packName"
                value={editForm.packName}
                onChange={onEditChange}
                required
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Rate (₹)<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="monthlyRate"
                type="number"
                min="0.01"
                step="0.01"
                value={editForm.monthlyRate}
                onChange={onEditChange}
                required
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={onEditChange}
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeEdit}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
              >
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
