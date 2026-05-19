import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  getCustomer, getAreas, updateCustomer, closeAccount,
  reEnrollCustomer, resetCustomerPassword, recordPayment,
  listPaymentsByCustomer, deleteCustomer,
} from '../../api';
import { StatusBadge, fmtDate, fmtDateTime, fmtCurrency } from '../../utils';

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

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function InputRow({ label, name, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function ModalError({ msg }) {
  if (!msg) return null;
  return (
    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{msg}</div>
  );
}

// ── Record Payment Modal ──────────────────────────────────────
function RecordPaymentModal({ customer, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    amount: customer.currentPaymentAmount ?? '',
    forMonth: today.substring(0, 7) + '-01',
    paymentDate: today,
    paymentMethod: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await recordPayment(customer.customerId, {
        amount: Number(form.amount),
        forMonth: form.forMonth || null,
        paymentDate: form.paymentDate || null,
        paymentMethod: form.paymentMethod || null,
        notes: form.notes || null,
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
        <InputRow label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={onChange} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">For Month<span className="text-red-500 ml-0.5">*</span></label>
          <input
            type="month"
            name="forMonth"
            value={form.forMonth?.substring(0, 7)}
            onChange={(e) => setForm((f) => ({ ...f, forMonth: e.target.value + '-01' }))}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <InputRow label="Payment Date" name="paymentDate" type="date" value={form.paymentDate} onChange={onChange} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select…</option>
            <option>CASH</option>
            <option>UPI</option>
            <option>BANK_TRANSFER</option>
            <option>CHEQUE</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Record Payment'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
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
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">Re-enrolls at the customer's existing subscription rate. Record payment separately after re-enrolling.</p>
        <InputRow label="Start Date" name="startDate" type="date" value={form.startDate} onChange={onChange} />
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Re-enroll'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password<span className="text-red-500 ml-0.5">*</span></label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Reset Password'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Customer Modal ───────────────────────────────────────
function EditCustomerModal({ customer, areas, onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    doorNumber: customer.doorNumber || '',
    streetName: customer.streetName || '',
    areaId: customer.areaId || '',
    phone: customer.phone || '',
    email: customer.email || '',
    upiId: customer.upiId || '',
    stbId: customer.stbId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await updateCustomer(customer.customerId, {
        ...form,
        areaId: form.areaId ? Number(form.areaId) : null,
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
        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Door No." name="doorNumber" value={form.doorNumber} onChange={onChange} />
          <InputRow label="Street" name="streetName" value={form.streetName} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <select
            name="areaId"
            value={form.areaId}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select area…</option>
            {areas.map((a) => (
              <option key={a.areaId} value={a.areaId}>{a.areaName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose}
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────
export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  const reload = () => {
    getCustomer(id).then((r) => setCustomer(r.data)).catch(() => setError('Failed to load customer.'));
    listPaymentsByCustomer(id).then((r) => setPayments(r.data)).catch(() => {});
  };

  useEffect(() => {
    getAreas().then((r) => setAreas(r.data)).catch(() => {});
    reload();
  }, [id]);

  const closeModal = () => setModal(null);
  const onSuccess = (msg) => { closeModal(); setActionMsg(msg); reload(); setTimeout(() => setActionMsg(''), 4000); };

  const handleCloseAccount = async () => {
    if (!window.confirm('Close this account? Any open subscription will be cancelled immediately.')) return;
    setSuspendLoading(true);
    setActionError('');
    try {
      await closeAccount(id);
      setActionMsg('Account closed.');
      reload();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to close account.');
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this customer? This cannot be undone.')) return;
    try {
      await deleteCustomer(id);
      navigate('/admin/customers');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  if (error) return (
    <AdminLayout>
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
    </AdminLayout>
  );

  if (!customer) return (
    <AdminLayout>
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    </AdminLayout>
  );

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  const address = [customer.doorNumber, customer.streetName, customer.areaName].filter(Boolean).join(', ');

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/admin/customers')} className="hover:text-blue-700 transition">Customers</button>
        <span>/</span>
        <span className="text-gray-800 font-medium">{fullName}</span>
      </div>

      {actionMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">
          {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{fullName}</h1>
          <StatusBadge status={customer.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModal('payment')}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Record Payment
          </button>
          <button
            onClick={() => setModal('edit')}
            className="bg-white text-gray-700 border border-gray-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Edit
          </button>
          {customer.status !== 'SUSPENDED' && customer.status !== 'ACCOUNT_CLOSED' && (
            <button
              onClick={handleCloseAccount}
              disabled={suspendLoading}
              className="bg-white text-red-600 border border-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {suspendLoading ? 'Closing…' : 'Close Account'}
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Customer Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
          <Field label="Phone" value={customer.phone} />
          <Field label="Email" value={customer.email} />
          <Field label="STB ID" value={customer.stbId} />
          <Field label="UPI ID" value={customer.upiId} />
          <Field label="Address" value={address} />
          <Field label="Member Since" value={fmtDateTime(customer.accountCreatedAt)} />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setModal('resetPassword')}
            className="text-xs text-gray-500 underline hover:text-gray-700 transition"
          >
            Reset Portal Password
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 underline hover:text-red-700 transition"
          >
            Delete Customer
          </button>
        </div>
      </div>

      {/* Subscription card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Subscription</h3>
        {customer.currentSubscriptionStart ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
            <Field label="Period" value={`${fmtDate(customer.currentSubscriptionStart)} – ${fmtDate(customer.currentSubscriptionEnd)}`} />
            <Field label="Monthly Rate" value={fmtCurrency(customer.currentPaymentAmount)} />
            {customer.subscriptionStatus !== 'PAID' && (
              <Field label="Due Date" value={fmtDate(customer.currentPaymentDueDate)} />
            )}
            {customer.subscriptionStatus !== 'PAID' && (
              <Field label="Grace Deadline" value={fmtDate(customer.gracePeriodDeadline)} />
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Payment Status</p>
              <StatusBadge status={customer.subscriptionStatus || customer.status} />
            </div>
            {customer.paymentPending && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-700 font-medium">
                  Payment pending for this period.
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active subscription.</p>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 px-6 py-5">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">For Month</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Recorded By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{fmtDate(p.forMonth)}</td>
                    <td className="px-4 py-3 text-gray-800 font-semibold">{fmtCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{fmtDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.paymentMethod || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.recordedByName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'payment' && (
        <RecordPaymentModal
          customer={customer}
          onClose={closeModal}
          onSuccess={() => onSuccess('Payment recorded.')}
        />
      )}
      {modal === 'edit' && (
        <EditCustomerModal
          customer={customer}
          areas={areas}
          onClose={closeModal}
          onSuccess={() => onSuccess('Customer updated.')}
        />
      )}
      {modal === 'reenroll' && (
        <ReEnrollModal
          customerId={id}
          onClose={closeModal}
          onSuccess={() => onSuccess('Customer re-enrolled.')}
        />
      )}
      {modal === 'resetPassword' && (
        <ResetPasswordModal
          customerId={id}
          onClose={closeModal}
          onSuccess={() => onSuccess('Password reset.')}
        />
      )}
    </AdminLayout>
  );
}
