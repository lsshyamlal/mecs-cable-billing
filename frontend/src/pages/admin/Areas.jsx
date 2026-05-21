import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAreas, createArea, updateArea } from '../../api';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function Areas() {
  const [areas, setAreas] = useState(null);
  const [form, setForm] = useState({ areaName: '', gracePeriodDay: '5' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editTarget, setEditTarget] = useState(null); // { areaId, areaName, gracePeriodDay }
  const [editForm, setEditForm] = useState({ areaName: '', gracePeriodDay: '5' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const reload = () => {
    getAreas().then((r) => setAreas(r.data)).catch(() => setAreas([]));
  };

  useEffect(() => { reload(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openEdit = (area) => {
    setEditTarget(area);
    setEditForm({ areaName: area.areaName, gracePeriodDay: String(area.gracePeriodDay) });
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
      await createArea({ areaName: form.areaName, gracePeriodDay: Number(form.gracePeriodDay) });
      setForm({ areaName: '', gracePeriodDay: '5' });
      setSuccess(`Area "${form.areaName}" created.`);
      reload();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setError(Object.values(data.errors).join(' • '));
      else setError(data?.message || 'Failed to create area.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true); setEditError('');
    try {
      await updateArea(editTarget.areaId, {
        areaName: editForm.areaName,
        gracePeriodDay: Number(editForm.gracePeriodDay),
      });
      setSuccess(`Area "${editForm.areaName}" updated.`);
      closeEdit();
      reload();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setEditError(Object.values(data.errors).join(' • '));
      else setEditError(data?.message || 'Failed to update area.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Areas</h1>

      {/* Existing areas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Areas</h2>
        </div>
        {areas === null ? (
          <div className="space-y-2 p-4 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        ) : areas.length === 0 ? (
          <p className="text-sm text-gray-500 px-6 py-5">No areas yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Area Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Grace Period Day</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {areas.map((a) => (
                <tr key={a.areaId} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{a.areaName}</td>
                  <td className="px-6 py-3 text-gray-600">Day {a.gracePeriodDay} of the month</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(a)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
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

      {/* Add area form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Add New Area</h2>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area Name<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              name="areaName"
              value={form.areaName}
              onChange={onChange}
              required
              placeholder="e.g. North Street"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grace Period Day<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              name="gracePeriodDay"
              type="number"
              min="1"
              max="28"
              value={form.gracePeriodDay}
              onChange={onChange}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
            />
            <p className="text-xs text-gray-400 mt-1">Day 1–28 of the month</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Adding…' : 'Add Area'}
          </button>
        </form>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit Area — ${editTarget.areaName}`} onClose={closeEdit}>
          {editError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{editError}</div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area Name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="areaName"
                value={editForm.areaName}
                onChange={onEditChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grace Period Day<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                name="gracePeriodDay"
                value={editForm.gracePeriodDay}
                onChange={onEditChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeEdit}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition"
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
