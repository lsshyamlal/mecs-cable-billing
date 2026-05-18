import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getProfile, getCurrentSubscription } from '../api';
import { StatusBadge, fmtDate, fmtDateTime } from '../utils';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function fmtExpiryInIST(isoStr) {
  if (!isoStr) return null;
  const expiry = new Date(isoStr);
  expiry.setFullYear(expiry.getFullYear() + 2);
  return expiry.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export default function PortalHome() {
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getProfile(), getCurrentSubscription()])
      .then(([p, s]) => {
        setProfile(p.data);
        setSub(s.data);
      })
      .catch(() => setError('Failed to load account details. Please refresh the page.'));
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      </Layout>
    );
  }

  if (!profile || !sub) {
    return (
      <Layout>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-28 bg-gray-100 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const address = [profile.doorNumber, profile.streetName].filter(Boolean).join(', ');
  const portalAccessExpiry = fmtExpiryInIST(profile.suspendedAt);

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Account</h2>

      {profile.status === 'SUSPENDED' && portalAccessExpiry && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
          <span className="font-semibold">Your account is suspended.</span> Your information is available in
          read-only mode until <span className="font-semibold">{portalAccessExpiry}</span>.
          Contact your cable operator to re-activate your subscription.
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <Field label="Name" value={fullName} />
          <Field label="Phone" value={profile.phone} />
          <Field label="Email" value={profile.email || '—'} />
          <Field label="STB ID" value={profile.stbId || '—'} />
          <Field label="Address" value={address || '—'} />
          <Field label="Area" value={profile.area || '—'} />
          <Field label="Member Since" value={fmtDateTime(profile.accountCreatedAt)} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Account Status</p>
            <StatusBadge status={profile.status} />
          </div>
        </div>
      </div>

      {/* Current subscription card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Subscription</h3>
        {sub.startDate ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <Field
              label="Period"
              value={`${fmtDate(sub.startDate)} – ${fmtDate(sub.endDate)}`}
            />
            <Field
              label="Monthly Rate"
              value={sub.monthlyRate ? `₹${Number(sub.monthlyRate).toFixed(0)}` : '—'}
            />
            <Field label="Due Date" value={fmtDate(sub.dueDate)} />
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <StatusBadge status={sub.status} />
            </div>
            {sub.gracePeriodDeadline && (
              <Field
                label="Grace Period Deadline"
                value={fmtDate(sub.gracePeriodDeadline)}
              />
            )}
            {sub.paymentPending && (
              <div className="sm:col-span-2 mt-1">
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-700 font-medium">
                  Payment is pending for this subscription period.
                  {sub.gracePeriodDeadline && (
                    <span> Please pay by {fmtDate(sub.gracePeriodDeadline)} to avoid service interruption.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active subscription on record.</p>
        )}
      </div>

      {/* History navigation */}
      <button
        onClick={() => navigate('/portal/history')}
        className="flex items-center gap-1.5 text-blue-700 text-sm font-medium hover:text-blue-900 transition"
      >
        View Subscription History
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </Layout>
  );
}
