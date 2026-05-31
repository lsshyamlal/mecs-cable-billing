import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  getCustomer, getCities, getAreas, getStreets, updateCustomer, closeAccount,
  reEnrollCustomer, resetCustomerPassword, recordPayment,
  listPaymentsByCustomer, deleteCustomer, getSubscriptionPacks,
  getCustomerStatusHistory, deactivateSubscription,
} from '../../api';
import { StatusBadge, CustomerStatusBadge, fmtDate, fmtDateTime, fmtCurrency } from '../../utils';

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

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

function InputRow({ label, name, value, onChange, type = 'text', required, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={type === 'number' ? (e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault() : undefined}
        required={required}
        disabled={disabled}
        className={`${INPUT} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

function ModalError({ msg }) {
  if (!msg) return null;
  return (
    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mb-3">{msg}</div>
  );
}

// ── Record Payment Modal ──────────────────────────────────────
function RecordPaymentModal({ customer, onClose, onSuccess }) {
  const nowIST = () => {
    const [datePart, timePart] = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).split(' ');
    return `${datePart}T${timePart.substring(0, 5)}`;
  };
  const todayIST = nowIST().substring(0, 10);
  const [form, setForm] = useState({
    amount: customer.currentPaymentAmount ?? '',
    forMonth: customer.currentSubscriptionStart ?? todayIST.substring(0, 7) + '-01',
    paymentDate: todayIST,
    paymentMethod: '',
    notes: '',
  });
  const [packs, setPacks] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const packRateRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubscriptionPacks().then((r) => setPacks(r.data)).catch(() => {});
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onAmountChange = (e) => {
    setForm((f) => ({ ...f, amount: e.target.value }));
    if (selectedPackId && selectedPackId !== '__manual__') {
      setSelectedPackId('__manual__');
      packRateRef.current = null;
    }
  };

  const onPackChange = (e) => {
    const id = e.target.value;
    setSelectedPackId(id);
    if (id && id !== '__manual__') {
      const pack = packs.find((p) => String(p.packId) === id);
      if (pack) {
        packRateRef.current = String(pack.monthlyRate);
        setForm((f) => ({ ...f, amount: String(pack.monthlyRate) }));
      }
    } else {
      packRateRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const packId = (selectedPackId && selectedPackId !== '__manual__') ? Number(selectedPackId) : null;
    const manualOverride = selectedPackId === '__manual__';
    try {
      await recordPayment(customer.customerId, {
        amount: Number(form.amount),
        forMonth: form.forMonth || null,
        paymentMethod: form.paymentMethod || null,
        notes: form.notes || null,
        packId,
        manualOverride,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Record Payment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ModalError msg={error} />
        {packs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pack</label>
            <select
              value={selectedPackId}
              onChange={onPackChange}
              className={INPUT}
            >
              <option value="">Select pack to fill amount…</option>
              <option value="__manual__">Manual Override</option>
              {packs.map((p) => (
                <option key={p.packId} value={p.packId}>
                  {p.packName} — ₹{Number(p.monthlyRate).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}
        <InputRow label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={onAmountChange} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">For Month<span className="text-red-500 ml-0.5">*</span></label>
          <div className="flex gap-2">
            <select
              value={form.forMonth ? form.forMonth.substring(5, 7) : ''}
              onChange={(e) => {
                const yr = form.forMonth ? form.forMonth.substring(0, 4) : new Date().getFullYear().toString();
                setForm((f) => ({ ...f, forMonth: `${yr}-${e.target.value}-01` }));
              }}
              required
              className={INPUT.replace('w-full', 'flex-1')}
            >
              <option value="">Month</option>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                <option key={m} value={m}>
                  {new Date(2000, i).toLocaleString('en-IN', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={form.forMonth ? form.forMonth.substring(0, 4) : ''}
              onChange={(e) => {
                const mo = form.forMonth ? form.forMonth.substring(5, 7) : '01';
                setForm((f) => ({ ...f, forMonth: `${e.target.value}-${mo}-01` }));
              }}
              required
              className={INPUT.replace('w-full', 'w-28')}
            >
              <option value="">Year</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>
        <InputRow label="Payment Date" name="paymentDate" type="date" value={form.paymentDate} onChange={onChange} disabled />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method<span className="text-red-500 ml-0.5">*</span></label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={onChange} required className={INPUT}>
            <option value="">Select…</option>
            <option>CASH</option>
            <option>UPI</option>
            <option>BANK_TRANSFER</option>
            <option>CHEQUE</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            rows={2}
            className={`${INPUT} resize-none`}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Record Payment'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Re-enroll Modal ───────────────────────────────────────────
function ReEnrollModal({ customerId, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ startDate: today });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await reEnrollCustomer(customerId, { startDate: form.startDate || null });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to re-enroll customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Re-enroll Customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ModalError msg={error} />
        <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2">Re-enrolls at the customer's existing subscription rate. Record payment separately after re-enrolling.</p>
        <InputRow label="Start Date" name="startDate" type="date" value={form.startDate} onChange={onChange} />
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Re-enroll'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Reset Password Modal ──────────────────────────────────────
function ResetPasswordModal({ customerId, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await resetCustomerPassword(customerId, { newPassword });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Reset Portal Password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ModalError msg={error} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password<span className="text-red-500 ml-0.5">*</span></label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className={INPUT}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Reset Password'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Customer Modal ───────────────────────────────────────
function EditCustomerModal({ customer, cities, areas, streets, onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    doorNumber: customer.doorNumber || '',
    cityId: customer.cityId ? String(customer.cityId) : '',
    areaId: customer.areaId ? String(customer.areaId) : '',
    streetId: customer.streetId ? String(customer.streetId) : '',
    phone: customer.phone || '',
    email: customer.email || '',
    upiId: customer.upiId || '',
    stbId: customer.stbId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const filteredAreas = form.cityId
    ? areas.filter((a) => String(a.cityId) === form.cityId)
    : areas;
  const filteredStreets = form.areaId
    ? streets.filter((s) => String(s.areaId) === form.areaId)
    : [];

  const onCityChange = (e) =>
    setForm((f) => ({ ...f, cityId: e.target.value, areaId: '', streetId: '' }));
  const onAreaChange = (e) =>
    setForm((f) => ({ ...f, areaId: e.target.value, streetId: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await updateCustomer(customer.customerId, {
        firstName: form.firstName,
        lastName: form.lastName,
        doorNumber: form.doorNumber,
        phone: form.phone,
        email: form.email,
        upiId: form.upiId,
        stbId: form.stbId,
        areaId: form.areaId ? Number(form.areaId) : null,
        streetId: form.streetId ? Number(form.streetId) : null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <ModalError msg={error} />
        <div className="grid grid-cols-2 gap-3">
          <InputRow label="First Name" name="firstName" value={form.firstName} onChange={onChange} required />
          <InputRow label="Last Name" name="lastName" value={form.lastName} onChange={onChange} />
        </div>
        <InputRow label="Phone" name="phone" value={form.phone} onChange={onChange} required />
        <InputRow label="Email" name="email" type="email" value={form.email} onChange={onChange} />
        <InputRow label="UPI ID" name="upiId" value={form.upiId} onChange={onChange} />
        <InputRow label="STB ID" name="stbId" value={form.stbId} onChange={onChange} />
        <InputRow label="Door No." name="doorNumber" value={form.doorNumber} onChange={onChange} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City<span className="text-red-500 ml-0.5">*</span></label>
          <select name="cityId" value={form.cityId} onChange={onCityChange} required className={INPUT}>
            <option value="">Select city…</option>
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>{c.cityName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area<span className="text-red-500 ml-0.5">*</span></label>
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street</label>
          <select
            name="streetId"
            value={form.streetId}
            onChange={onChange}
            disabled={!form.areaId}
            className={`${INPUT} ${!form.areaId ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <option value="">{form.areaId ? 'No street' : 'Pick area first'}</option>
            {filteredStreets.map((s) => (
              <option key={s.streetId} value={s.streetId}>{s.streetName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

const AUTO_NOTES = { true: 'Payment collected', false: 'Closed without payment' };

// ── Deactivate Subscription Modal ─────────────────────────────
function DeactivateSubscriptionModal({ customerId, subscriptionId, isFuture, endDate, subscriptionStatus, onClose, onSuccess }) {
  const todayIST = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' })
    .substring(0, 10);
  const hasOutstanding = !isFuture
    && (subscriptionStatus === 'GRACE' || subscriptionStatus === 'PAYMENT_PENDING');
  const [deactivationDate, setDeactivationDate] = useState(isFuture ? '' : (endDate || todayIST));
  const [notes, setNotes] = useState('');
  const [paymentCollected, setPaymentCollected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmedNotes = notes.trim();
  const canSubmit = trimmedNotes.length > 0
    && (isFuture || !!deactivationDate)
    && (!hasOutstanding || paymentCollected !== null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError('');
    try {
      await deactivateSubscription(customerId, subscriptionId, {
        deactivationDate: isFuture ? null : deactivationDate,
        notes: trimmedNotes,
        paymentCollected: hasOutstanding ? paymentCollected : null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isFuture ? 'Cancel Future Subscription' : 'Deactivate Subscription'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalError msg={error} />
        {isFuture ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This future subscription will be cancelled immediately.
          </p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deactivation date<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="date"
              value={deactivationDate}
              min={todayIST}
              max={endDate || undefined}
              onChange={(e) => setDeactivationDate(e.target.value)}
              required
              className={INPUT}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Service stops on this date. Must be on or before {fmtDate(endDate)}.
            </p>
          </div>
        )}
        {hasOutstanding && (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              This subscription has an outstanding{' '}
              <span className="font-semibold">
                {subscriptionStatus === 'GRACE' ? 'Grace Period' : 'Payment Pending'}
              </span>{' '}
              balance. Was payment collected?<span className="text-red-500 ml-0.5">*</span>
            </p>
            <div className="flex gap-3">
              <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition ${paymentCollected === true ? 'bg-green-600 border-green-600 text-white' : 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
                <input type="radio" name="paymentCollected" checked={paymentCollected === true}
                  onChange={() => setPaymentCollected(true)} className="sr-only" />
                Yes, payment collected
              </label>
              <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition ${paymentCollected === false ? 'bg-red-600 border-red-600 text-white' : 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                <input type="radio" name="paymentCollected" checked={paymentCollected === false}
                  onChange={() => setPaymentCollected(false)} className="sr-only" />
                No, write off
              </label>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason / notes<span className="text-red-500 ml-0.5">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Why is this subscription being deactivated?"
            required
            className={`${INPUT} resize-none`}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading || !canSubmit}
            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Saving…' : (isFuture ? 'Cancel Subscription' : 'Schedule Deactivation')}
          </button>
          <button type="button" onClick={onClose} disabled={loading}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Close Account Confirm Modal ───────────────────────────────
function CloseAccountModal({ customer, onClose, onSuccess }) {
  const hasOutstanding = customer.subscriptionStatus === 'GRACE' || customer.subscriptionStatus === 'PAYMENT_PENDING';

  const [paymentCollected, setPaymentCollected] = useState(hasOutstanding ? null : false);
  const [notes, setNotes] = useState(hasOutstanding ? '' : AUTO_NOTES[false]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onPaymentChoice = (collected) => {
    const otherAuto = AUTO_NOTES[!collected];
    if (notes === '' || notes === otherAuto) setNotes(AUTO_NOTES[collected]);
    setPaymentCollected(collected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await closeAccount(customer.customerId, {
        paymentCollected: paymentCollected ?? false,
        notes: notes.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Close Account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalError msg={error} />

        {hasOutstanding && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This customer has an outstanding{' '}
            <span className="font-semibold">
              {customer.subscriptionStatus === 'GRACE' ? 'Grace Period' : 'Payment Pending'}
            </span>{' '}
            subscription.
          </p>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Was payment collected before closing?
          </p>
          <div className="flex gap-3">
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition ${paymentCollected === true ? 'bg-green-600 border-green-600 text-white' : 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
              <input type="radio" name="paymentCollected" checked={paymentCollected === true}
                onChange={() => onPaymentChoice(true)} className="sr-only" />
              Yes, payment collected
            </label>
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition ${paymentCollected === false ? 'bg-red-600 border-red-600 text-white' : 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
              <input type="radio" name="paymentCollected" checked={paymentCollected === false}
                onChange={() => onPaymentChoice(false)} className="sr-only" />
              No, write off
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes…"
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit"
            disabled={loading || (hasOutstanding && paymentCollected === null)}
            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Closing…' : 'Close Account'}
          </button>
          <button type="button" onClick={onClose} disabled={loading}
            className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Delete Customer Confirm Modal ─────────────────────────────
function DeleteCustomerModal({ customerId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      await deleteCustomer(customerId);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Delete Customer" onClose={onClose}>
      <ModalError msg={error} />
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">Permanently delete this customer? This cannot be undone.</p>
      <div className="flex gap-2">
        <button onClick={handleConfirm} disabled={loading}
          className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
          {loading ? 'Deleting…' : 'Delete Customer'}
        </button>
        <button type="button" onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────
export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [streets, setStreets] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  const reload = () => {
    getCustomer(id).then((r) => setCustomer(r.data)).catch(() => setError('Failed to load customer.'));
    listPaymentsByCustomer(id).then((r) => setPayments(r.data)).catch(() => {});
    getCustomerStatusHistory(id).then((r) => setStatusHistory(r.data)).catch(() => {});
  };

  useEffect(() => {
    getCities().then((r) => setCities(r.data)).catch(() => {});
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
    getStreets().then((r) => setStreets(r.data)).catch(() => {});
    reload();
  }, [id]);

  const closeModal = () => setModal(null);
  const onSuccess = (msg) => { closeModal(); setActionMsg(msg); reload(); setTimeout(() => setActionMsg(''), 4000); };

  const handleCloseAccount = () => setModal('closeAccount');
  const handleDelete = () => setModal('deleteCustomer');

  if (error) return (
    <AdminLayout>
      <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
    </AdminLayout>
  );

  if (!customer) return (
    <AdminLayout>
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
        <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
      </div>
    </AdminLayout>
  );

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  const address = [customer.doorNumber, customer.streetName, customer.areaName, customer.cityName].filter(Boolean).join(', ');

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button onClick={() => navigate('/admin/customers')} className="hover:text-blue-700 dark:hover:text-blue-400 transition">Customers</button>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200 font-medium">{fullName}</span>
      </div>

      {actionMsg && (
        <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg px-4 py-2 mb-4">
          {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4">
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{fullName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModal('payment')}
            disabled={customer.status === 'SUSPENDED' || customer.status === 'ACCOUNT_CLOSED'}
            title={customer.status === 'SUSPENDED' || customer.status === 'ACCOUNT_CLOSED' ? 'Re-enroll the customer before recording a payment' : undefined}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Record Payment
          </button>
          <button
            onClick={() => setModal('edit')}
            className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Edit
          </button>
          {customer.status !== 'SUSPENDED' && customer.status !== 'ACCOUNT_CLOSED' && (
            <button
              onClick={handleCloseAccount}
              className="bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
            >
              Close Account
            </button>
          )}
          {(customer.status === 'SUSPENDED' || customer.status === 'ACCOUNT_CLOSED') && (
            <button
              onClick={() => setModal('reenroll')}
              className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Re-enroll
            </button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Customer Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
          <Field label="Phone" value={customer.phone} />
          <Field label="Email" value={customer.email} />
          <Field label="STB ID" value={customer.stbId} />
          <Field label="UPI ID" value={customer.upiId} />
          <Field label="City" value={customer.cityName} />
          <Field label="Area" value={customer.areaName} />
          <Field label="Street" value={customer.streetName} />
          <Field label="Address" value={address} />
          <Field label="Member Since" value={fmtDateTime(customer.accountCreatedAt)} />
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Status</p>
            <CustomerStatusBadge status={customer.status} />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setModal('resetPassword')}
            className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            Reset Portal Password
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 dark:text-red-400 underline hover:text-red-700 dark:hover:text-red-300 transition"
          >
            Delete Customer
          </button>
        </div>
      </div>

      {/* Subscription card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Current Subscription</h3>
          {customer.currentSubscriptionId
            && customer.subscriptionStatus
            && customer.subscriptionStatus !== 'SUSPENDED'
            && customer.subscriptionStatus !== 'CANCELLED'
            && !customer.currentSubscriptionDeactivationDate && (
            <button
              onClick={() => setModal('deactivateCurrent')}
              className="bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
            >
              Deactivate Subscription
            </button>
          )}
        </div>
        {customer.currentSubscriptionStart ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
            <Field label="Period" value={`${fmtDate(customer.currentSubscriptionStart)} – ${fmtDate(customer.currentSubscriptionEnd)}`} />
            <Field label="Monthly Rate" value={fmtCurrency(customer.currentPaymentAmount)} />
            {customer.currentPackName && (
              <Field label="Pack" value={customer.currentPackName} />
            )}
            {customer.subscriptionStatus !== 'PAID' && (
              <Field label="Due Date" value={fmtDate(customer.currentPaymentDueDate)} />
            )}
            {customer.subscriptionStatus !== 'PAID' && (
              <Field label="Grace Deadline" value={fmtDate(customer.gracePeriodDeadline)} />
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Status</p>
              <StatusBadge status={customer.subscriptionStatus || customer.status} />
            </div>
            {customer.currentSubscriptionDeactivationDate && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Deactivation scheduled for {fmtDate(customer.currentSubscriptionDeactivationDate)}. Service will be suspended on that date.
                </div>
              </div>
            )}
            {customer.paymentPending && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="bg-orange-50 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-sm text-orange-700 dark:text-orange-300 font-medium">
                  Payment pending for this period.
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No active subscription.</p>
        )}
      </div>

      {/* Future subscription card */}
      {customer.futureSubscriptionId && customer.futureSubscriptionStatus === 'SCHEDULED' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Future Subscription</h3>
            <button
              onClick={() => setModal('deactivateFuture')}
              className="bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
            >
              Cancel Subscription
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <StatusBadge status={customer.futureSubscriptionStatus} />
            </div>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">For Month</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Recorded By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{fmtDate(p.forMonth)}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100 font-semibold">{fmtCurrency(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.subscriptionStatus} /></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{fmtDateTime(p.paymentDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{p.paymentMethod || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{p.recordedByName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 hidden lg:table-cell text-xs">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account history */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account History</h3>
        </div>
        {statusHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 px-6 py-5">No history recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Done By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {statusHistory.map((h) => (
                  <tr key={h.historyId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.fromStatus ? (
                          <>
                            <CustomerStatusBadge status={h.fromStatus} />
                            <span className="text-gray-400 dark:text-gray-500 text-xs">→</span>
                            <CustomerStatusBadge status={h.toStatus} />
                          </>
                        ) : (
                          <CustomerStatusBadge status={h.toStatus} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDateTime(h.changedAt)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{h.changedByName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 hidden md:table-cell text-xs">{h.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'payment' && (
        <RecordPaymentModal customer={customer} onClose={closeModal} onSuccess={() => onSuccess('Payment recorded.')} />
      )}
      {modal === 'edit' && (
        <EditCustomerModal customer={customer} cities={cities} areas={areas} streets={streets} onClose={closeModal} onSuccess={() => onSuccess('Customer updated.')} />
      )}
      {modal === 'reenroll' && (
        <ReEnrollModal customerId={id} onClose={closeModal} onSuccess={() => onSuccess('Customer re-enrolled.')} />
      )}
      {modal === 'resetPassword' && (
        <ResetPasswordModal customerId={id} onClose={closeModal} onSuccess={() => onSuccess('Password reset.')} />
      )}
      {modal === 'closeAccount' && (
        <CloseAccountModal customer={customer} onClose={closeModal} onSuccess={() => onSuccess('Account closed.')} />
      )}
      {modal === 'deleteCustomer' && (
        <DeleteCustomerModal customerId={id} onClose={closeModal} onSuccess={() => navigate('/admin/customers')} />
      )}
      {modal === 'deactivateCurrent' && customer.currentSubscriptionId && (
        <DeactivateSubscriptionModal
          customerId={id}
          subscriptionId={customer.currentSubscriptionId}
          isFuture={false}
          endDate={customer.currentSubscriptionEnd}
          subscriptionStatus={customer.subscriptionStatus}
          onClose={closeModal}
          onSuccess={() => onSuccess('Subscription deactivation scheduled.')}
        />
      )}
      {modal === 'deactivateFuture' && customer.futureSubscriptionId && (
        <DeactivateSubscriptionModal
          customerId={id}
          subscriptionId={customer.futureSubscriptionId}
          isFuture={true}
          endDate={null}
          subscriptionStatus={customer.futureSubscriptionStatus}
          onClose={closeModal}
          onSuccess={() => onSuccess('Future subscription cancelled.')}
        />
      )}
    </AdminLayout>
  );
}
