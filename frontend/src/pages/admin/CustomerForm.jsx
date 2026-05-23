import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { createCustomer, getAreas } from '../../api';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function CustomerForm() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    upiId: '', stbId: '', doorNumber: '', streetName: '',
    areaId: '', subscriptionStartDate: '',
    portalPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await createCustomer({
        firstName: form.firstName,
        lastName: form.lastName || null,
        phone: form.phone,
        email: form.email || null,
        upiId: form.upiId || null,
        stbId: form.stbId || null,
        doorNumber: form.doorNumber || null,
        streetName: form.streetName || null,
        areaId: form.areaId ? Number(form.areaId) : null,
        subscriptionStartDate: form.subscriptionStartDate || null,
        portalPassword: form.portalPassword || null,
      });
      navigate(`/admin/customers/${res.data.customerId}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setError(Object.values(data.errors).join(' • '));
      } else {
        setError(data?.message || 'Failed to create customer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button onClick={() => navigate('/admin/customers')} className="hover:text-blue-700 dark:hover:text-blue-400 transition">Customers</button>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200 font-medium">New Customer</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Add Customer</h1>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-5">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input name="firstName" value={form.firstName} onChange={onChange} required className={INPUT} />
            </Field>
            <Field label="Last Name">
              <input name="lastName" value={form.lastName} onChange={onChange} className={INPUT} />
            </Field>
            <Field label="Phone" required>
              <input name="phone" value={form.phone} onChange={onChange} required className={INPUT} placeholder="10-digit mobile number" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={form.email} onChange={onChange} className={INPUT} />
            </Field>
            <Field label="UPI ID">
              <input name="upiId" value={form.upiId} onChange={onChange} className={INPUT} />
            </Field>
            <Field label="STB ID">
              <input name="stbId" value={form.stbId} onChange={onChange} className={INPUT} />
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Door Number">
              <input name="doorNumber" value={form.doorNumber} onChange={onChange} className={INPUT} />
            </Field>
            <Field label="Street Name">
              <input name="streetName" value={form.streetName} onChange={onChange} className={INPUT} />
            </Field>
            <Field label="Area" required>
              <select name="areaId" value={form.areaId} onChange={onChange} required className={INPUT}>
                <option value="">Select area…</option>
                {areas.map((a) => (
                  <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Subscription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Subscription Start Date">
              <input name="subscriptionStartDate" type="date" value={form.subscriptionStartDate} onChange={onChange} className={INPUT} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Leave blank to use today's date.</p>
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Portal Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Portal Password">
              <input name="portalPassword" type="password" value={form.portalPassword} onChange={onChange} className={INPUT} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Leave blank to disable portal login.</p>
            </Field>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Customer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/customers')}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
