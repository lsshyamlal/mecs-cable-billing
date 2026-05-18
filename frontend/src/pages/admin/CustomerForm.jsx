import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { createCustomer, getAreas } from '../../api';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function CustomerForm() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    upiId: '', stbId: '', doorNumber: '', streetName: '',
    areaId: '', monthlyRate: '', subscriptionStartDate: '',
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
        monthlyRate: Number(form.monthlyRate),
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
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/admin/customers')} className="hover:text-blue-700 transition">Customers</button>
        <span>/</span>
        <span className="text-gray-800 font-medium">New Customer</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Customer</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Personal Details</h2>
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Address</h2>
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Subscription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Monthly Rate (₹)" required>
              <input name="monthlyRate" type="number" min="0" step="0.01" value={form.monthlyRate} onChange={onChange} required className={INPUT} />
            </Field>
            <Field label="Subscription Start Date">
              <input name="subscriptionStartDate" type="date" value={form.subscriptionStartDate} onChange={onChange} className={INPUT} />
              <p className="text-xs text-gray-400 mt-1">Leave blank to use today's date.</p>
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Portal Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Portal Password">
              <input name="portalPassword" type="password" value={form.portalPassword} onChange={onChange} className={INPUT} />
              <p className="text-xs text-gray-400 mt-1">Leave blank to disable portal login.</p>
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
            className="text-sm text-gray-600 border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
