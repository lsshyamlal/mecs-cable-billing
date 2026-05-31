import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  getCities, createCity, updateCity, deleteCity,
  getAreas, createArea, updateArea, deleteArea,
  getStreets, createStreet, updateStreet, deleteStreet,
} from '../../api';

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

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mb-3">{msg}</div>
  );
}

function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 mb-3">{msg}</div>
  );
}

function extractErr(err, fallback) {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).join(' • ');
  return data?.message || fallback;
}

// ── Cities section ────────────────────────────────────────────
function CitiesSection({ cities, reload, flash, setFlash }) {
  const [form, setForm] = useState({ cityName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await createCity({ cityName: form.cityName.trim() });
      setForm({ cityName: '' });
      setFlash(`City "${form.cityName}" added.`);
      reload();
    } catch (err) {
      setError(extractErr(err, 'Failed to add city.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cities</h2>
      </div>

      {cities === null ? (
        <div className="space-y-2 p-4 animate-pulse">
          {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
        </div>
      ) : cities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No cities yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {cities.map((c) => (
              <tr key={c.cityId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-100">{c.cityName}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => setEditTarget(c)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3"
                  >Edit</button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add City</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              value={form.cityName}
              onChange={(e) => setForm({ cityName: e.target.value })}
              required
              placeholder="e.g. Madurai City"
              className={`${INPUT} w-64`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add City'}
          </button>
        </form>
      </div>

      {editTarget && (
        <EditCityModal
          city={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={(name) => { setEditTarget(null); setFlash(`City "${name}" updated.`); reload(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          title="Delete City"
          message={`Delete city "${deleteTarget.cityName}"? This cannot be undone.`}
          onConfirm={() => deleteCity(deleteTarget.cityId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash(`City "${deleteTarget.cityName}" deleted.`); reload(); }}
        />
      )}
    </div>
  );
}

function EditCityModal({ city, onClose, onSuccess }) {
  const [name, setName] = useState(city.cityName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await updateCity(city.cityId, { cityName: name.trim() });
      onSuccess(name.trim());
    } catch (err) {
      setError(extractErr(err, 'Failed to update city.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Edit City — ${city.cityName}`} onClose={onClose}>
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
    </Modal>
  );
}

// ── Areas section ─────────────────────────────────────────────
function AreasSection({ areas, cities, reload, setFlash }) {
  const [form, setForm] = useState({ cityId: '', areaName: '', gracePeriodDay: '5' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await createArea({
        cityId: Number(form.cityId),
        areaName: form.areaName.trim(),
        gracePeriodDay: Number(form.gracePeriodDay),
      });
      setForm({ cityId: '', areaName: '', gracePeriodDay: '5' });
      setFlash(`Area "${form.areaName}" added.`);
      reload();
    } catch (err) {
      setError(extractErr(err, 'Failed to add area.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Areas</h2>
      </div>

      {areas === null ? (
        <div className="space-y-2 p-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
        </div>
      ) : areas.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No areas yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grace Day</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {areas.map((a) => (
              <tr key={a.areaId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-100">{a.areaName}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{a.cityName}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">Day {a.gracePeriodDay}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => setEditTarget(a)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3"
                  >Edit</button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add Area</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City<span className="text-red-500 ml-0.5">*</span></label>
            <select
              value={form.cityId}
              onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
              required
              className={`${INPUT} w-48`}
            >
              <option value="">Select city…</option>
              {(cities || []).map((c) => (
                <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              value={form.areaName}
              onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))}
              required
              placeholder="e.g. North Street"
              className={`${INPUT} w-52`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period Day<span className="text-red-500 ml-0.5">*</span></label>
            <input
              type="number"
              min="1"
              max="28"
              value={form.gracePeriodDay}
              onChange={(e) => setForm((f) => ({ ...f, gracePeriodDay: e.target.value }))}
              required
              className={`${INPUT} w-24`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add Area'}
          </button>
        </form>
      </div>

      {editTarget && (
        <EditAreaModal
          area={editTarget}
          cities={cities || []}
          onClose={() => setEditTarget(null)}
          onSuccess={(name) => { setEditTarget(null); setFlash(`Area "${name}" updated.`); reload(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          title="Delete Area"
          message={`Delete area "${deleteTarget.areaName}" (${deleteTarget.cityName})? This cannot be undone.`}
          onConfirm={() => deleteArea(deleteTarget.areaId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash(`Area "${deleteTarget.areaName}" deleted.`); reload(); }}
        />
      )}
    </div>
  );
}

function EditAreaModal({ area, cities, onClose, onSuccess }) {
  const [form, setForm] = useState({
    cityId: String(area.cityId),
    areaName: area.areaName,
    gracePeriodDay: String(area.gracePeriodDay),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await updateArea(area.areaId, {
        cityId: Number(form.cityId),
        areaName: form.areaName.trim(),
        gracePeriodDay: Number(form.gracePeriodDay),
      });
      onSuccess(form.areaName.trim());
    } catch (err) {
      setError(extractErr(err, 'Failed to update area.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Edit Area — ${area.areaName}`} onClose={onClose}>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={form.cityId}
            onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
            required
            className={INPUT}
          >
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area Name<span className="text-red-500 ml-0.5">*</span></label>
          <input
            value={form.areaName}
            onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))}
            required
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period Day<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={form.gracePeriodDay}
            onChange={(e) => setForm((f) => ({ ...f, gracePeriodDay: e.target.value }))}
            required
            className={INPUT}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Streets section ───────────────────────────────────────────
function StreetsSection({ streets, areas, cities, reload, setFlash }) {
  const [form, setForm] = useState({ cityId: '', areaId: '', streetName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredAreas = form.cityId
    ? (areas || []).filter((a) => String(a.cityId) === form.cityId)
    : (areas || []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await createStreet({
        areaId: Number(form.areaId),
        streetName: form.streetName.trim(),
      });
      setForm({ cityId: '', areaId: '', streetName: '' });
      setFlash(`Street "${form.streetName}" added.`);
      reload();
    } catch (err) {
      setError(extractErr(err, 'Failed to add street.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Streets</h2>
      </div>

      {streets === null ? (
        <div className="space-y-2 p-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />)}
        </div>
      ) : streets.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No streets yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Street</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {streets.map((s) => (
              <tr key={s.streetId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-100">{s.streetName}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{s.areaName}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{s.cityName}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => setEditTarget(s)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition mr-3"
                  >Edit</button>
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Add Street</h3>
        <ErrorMsg msg={error} />
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City<span className="text-red-500 ml-0.5">*</span></label>
            <select
              value={form.cityId}
              onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value, areaId: '' }))}
              required
              className={`${INPUT} w-44`}
            >
              <option value="">Select city…</option>
              {(cities || []).map((c) => (
                <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area<span className="text-red-500 ml-0.5">*</span></label>
            <select
              value={form.areaId}
              onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
              required
              disabled={!form.cityId}
              className={`${INPUT} w-44 ${!form.cityId ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="">{form.cityId ? 'Select area…' : 'Pick city first'}</option>
              {filteredAreas.map((a) => (
                <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Name<span className="text-red-500 ml-0.5">*</span></label>
            <input
              value={form.streetName}
              onChange={(e) => setForm((f) => ({ ...f, streetName: e.target.value }))}
              required
              placeholder="e.g. Anna Salai"
              className={`${INPUT} w-52`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add Street'}
          </button>
        </form>
      </div>

      {editTarget && (
        <EditStreetModal
          street={editTarget}
          areas={areas || []}
          cities={cities || []}
          onClose={() => setEditTarget(null)}
          onSuccess={(name) => { setEditTarget(null); setFlash(`Street "${name}" updated.`); reload(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          title="Delete Street"
          message={`Delete street "${deleteTarget.streetName}" (${deleteTarget.areaName}, ${deleteTarget.cityName})? This cannot be undone.`}
          onConfirm={() => deleteStreet(deleteTarget.streetId)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); setFlash(`Street "${deleteTarget.streetName}" deleted.`); reload(); }}
        />
      )}
    </div>
  );
}

function EditStreetModal({ street, areas, cities, onClose, onSuccess }) {
  const [form, setForm] = useState({
    cityId: String(street.cityId),
    areaId: String(street.areaId),
    streetName: street.streetName,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredAreas = form.cityId
    ? areas.filter((a) => String(a.cityId) === form.cityId)
    : areas;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await updateStreet(street.streetId, {
        areaId: Number(form.areaId),
        streetName: form.streetName.trim(),
      });
      onSuccess(form.streetName.trim());
    } catch (err) {
      setError(extractErr(err, 'Failed to update street.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Edit Street — ${street.streetName}`} onClose={onClose}>
      <ErrorMsg msg={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={form.cityId}
            onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value, areaId: '' }))}
            required
            className={INPUT}
          >
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={form.areaId}
            onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
            required
            className={INPUT}
          >
            <option value="">Select area…</option>
            {filteredAreas.map((a) => (
              <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Name<span className="text-red-500 ml-0.5">*</span></label>
          <input
            value={form.streetName}
            onChange={(e) => setForm((f) => ({ ...f, streetName: e.target.value }))}
            required
            className={INPUT}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition">Cancel</button>
          <button type="submit" disabled={loading} className="bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Shared delete modal ───────────────────────────────────────
function DeleteModal({ title, message, onConfirm, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      await onConfirm();
      onSuccess();
    } catch (err) {
      setError(extractErr(err, 'Failed to delete.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <ErrorMsg msg={error} />
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function CustomerAddress() {
  const [cities, setCities] = useState(null);
  const [areas, setAreas] = useState(null);
  const [streets, setStreets] = useState(null);
  const [flash, setFlash] = useState('');

  const reload = () => {
    getCities().then((r) => setCities(r.data)).catch(() => setCities([]));
    getAreas().then((r) => setAreas(r.data)).catch(() => setAreas([]));
    getStreets().then((r) => setStreets(r.data)).catch(() => setStreets([]));
  };

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Customer Address</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage the cities, areas, and streets that customers can be assigned to.</p>

      <SuccessMsg msg={flash} />

      <CitiesSection
        cities={cities}
        reload={reload}
        flash={flash}
        setFlash={setFlash}
      />
      <AreasSection
        areas={areas}
        cities={cities}
        reload={reload}
        setFlash={setFlash}
      />
      <StreetsSection
        streets={streets}
        areas={areas}
        cities={cities}
        reload={reload}
        setFlash={setFlash}
      />
    </AdminLayout>
  );
}
