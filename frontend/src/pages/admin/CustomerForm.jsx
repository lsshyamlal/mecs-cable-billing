import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { createCustomer, getCities, getAreas, getStreets, getCompanies } from '../../api';

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
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [streets, setStreets] = useState([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    upiId: '', stbId: '', doorNumber: '',
    companyId: '', cityId: '', areaId: '', streetId: '',
    subscriptionStartDate: '',
    monthlyRate: '',
    portalPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  useEffect(() => {
    getCompanies().then((r) => setCompanies(r.data.filter((c) => c.active))).catch(() => {});
    getCities().then((r) => setCities(r.data)).catch(() => {});
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
    getStreets().then((r) => setStreets(r.data)).catch(() => {});
  }, []);

  const selectedCompany = companies.find((c) => String(c.companyId) === form.companyId);
  const companyCityIds = selectedCompany
    ? new Set((selectedCompany.cities || []).map((c) => c.cityId))
    : null;
  const filteredCities = companyCityIds
    ? cities.filter((c) => companyCityIds.has(c.cityId))
    : cities;
  const filteredAreas = form.cityId
    ? areas.filter((a) => String(a.cityId) === form.cityId)
    : [];
  const filteredStreets = form.areaId
    ? streets.filter((s) => String(s.areaId) === form.areaId)
    : [];

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onCompanyChange = (e) =>
    setForm((f) => ({ ...f, companyId: e.target.value, cityId: '', areaId: '', streetId: '' }));
  const onCityChange = (e) =>
    setForm((f) => ({ ...f, cityId: e.target.value, areaId: '', streetId: '' }));
  const onAreaChange = (e) =>
    setForm((f) => ({ ...f, areaId: e.target.value, streetId: '' }));

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
        companyId: form.companyId ? Number(form.companyId) : null,
        areaId: form.areaId ? Number(form.areaId) : null,
        streetId: form.streetId ? Number(form.streetId) : null,
        subscriptionStartDate: form.subscriptionStartDate || null,
        monthlyRate: Number(form.monthlyRate),
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
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Company</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company" required>
              <select name="companyId" value={form.companyId} onChange={onCompanyChange} required className={INPUT}>
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required>
              <select
                name="cityId"
                value={form.cityId}
                onChange={onCityChange}
                required
                disabled={!form.companyId}
                className={`${INPUT} ${!form.companyId ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">{form.companyId ? 'Select city…' : 'Pick company first'}</option>
                {filteredCities.map((c) => (
                  <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
                ))}
              </select>
            </Field>
            <Field label="Area" required>
              <select
                name="areaId"
                value={form.areaId}
                onChange={onAreaChange}
                required
                disabled={!form.cityId}
                className={`${INPUT} ${!form.cityId ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">{form.cityId ? 'Select area…' : 'Pick city first'}</option>
                {filteredAreas.map((a) => (
                  <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
                ))}
              </select>
            </Field>
            <Field label="Street">
              <select
                name="streetId"
                value={form.streetId}
                onChange={onChange}
                disabled={!form.areaId}
                className={`${INPUT} ${!form.areaId ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">{form.areaId ? 'Select street (optional)…' : 'Pick area first'}</option>
                {filteredStreets.map((s) => (
                  <option key={s.streetId} value={s.streetId}>{s.streetName}</option>
                ))}
              </select>
            </Field>
            <Field label="Door Number">
              <input name="doorNumber" value={form.doorNumber} onChange={onChange} className={INPUT} />
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                required
                disabled={!form.areaId}
                placeholder={form.areaId ? '' : 'Pick area first'}
                className={`${INPUT} ${!form.areaId ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </Field>
            <Field label="Last Name">
              <input name="lastName" value={form.lastName} onChange={onChange} className={INPUT} />
            </Field>
            <Field label="Phone" required>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                disabled={!form.firstName.trim()}
                placeholder={form.firstName.trim() ? '10-digit mobile number' : 'Enter first name first'}
                className={`${INPUT} ${!form.firstName.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
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
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Subscription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Subscription Start Date">
              <input name="subscriptionStartDate" type="date" value={form.subscriptionStartDate} onChange={onChange} className={INPUT} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Leave blank to use today's date.</p>
            </Field>
            <Field label="Monthly Rate (₹)" required>
              <input name="monthlyRate" type="number" step="0.01" min="0.01" value={form.monthlyRate} onChange={onChange} required className={INPUT} />
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Portal Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Portal Password">
              <div className="relative">
                <input
                  name="portalPassword"
                  type={showPortalPassword ? 'text' : 'password'}
                  value={form.portalPassword}
                  onChange={onChange}
                  className={`${INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPortalPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  tabIndex={-1}
                  aria-label={showPortalPassword ? 'Hide password' : 'Show password'}
                >
                  {showPortalPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
