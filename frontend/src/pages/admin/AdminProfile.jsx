import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from '../../api';
import { fmtDateTime } from '../../utils';
import { useAuth } from '../../context/AuthContext';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputClass(disabled) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'
  }`;
}

export default function AdminProfile() {
  const { auth, signIn } = useAuth();

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    getAdminProfile()
      .then((r) => {
        setProfile(r.data);
        setProfileForm({
          firstName: r.data.firstName || '',
          lastName: r.data.lastName || '',
          email: r.data.email || '',
          phone: r.data.phone || '',
        });
      })
      .catch(() => setProfileError('Failed to load profile.'));
  }, []);

  const onProfileChange = (e) =>
    setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const r = await updateAdminProfile(profileForm);
      setProfile(r.data);
      setProfileEditing(false);
      setProfileSuccess('Profile updated successfully.');
      // Update the name shown in the header
      if (auth) {
        const fullName = [r.data.firstName, r.data.lastName].filter(Boolean).join(' ');
        signIn({ ...auth, name: fullName, email: r.data.email });
      }
    } catch (err) {
      const data = err.response?.data;
      setProfileError(data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileEditing(false);
    setProfileError('');
    setProfileForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
    });
  };

  const onPwChange = (e) =>
    setPwForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await changeAdminPassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setPwError('Current password is incorrect.');
      else {
        const data = err.response?.data;
        setPwError(data?.message || 'Failed to change password.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      {/* Profile information */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile Information</h2>
          {!profileEditing && profile && (
            <button
              onClick={() => { setProfileEditing(true); setProfileSuccess(''); setProfileError(''); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {profileError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{profileError}</div>
        )}
        {profileSuccess && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">{profileSuccess}</div>
        )}

        {profile === null ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-gray-100 rounded-lg" />)}
          </div>
        ) : (
          <form onSubmit={handleProfileSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="First Name">
                <input
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={onProfileChange}
                  disabled={!profileEditing}
                  required
                  className={inputClass(!profileEditing)}
                />
              </Field>
              <Field label="Last Name">
                <input
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={onProfileChange}
                  disabled={!profileEditing}
                  className={inputClass(!profileEditing)}
                />
              </Field>
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={onProfileChange}
                  disabled={!profileEditing}
                  required
                  className={inputClass(!profileEditing)}
                />
              </Field>
              <Field label="Phone">
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={onProfileChange}
                  disabled={!profileEditing}
                  className={inputClass(!profileEditing)}
                />
              </Field>
            </div>

            {profileEditing && (
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {profileLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Account info (read-only) */}
      {profile && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Account Created</p>
              <p className="font-medium text-gray-800">{fmtDateTime(profile.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Last Login</p>
              <p className="font-medium text-gray-800">{fmtDateTime(profile.lastLoginAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Change Password</h2>

        {pwError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{pwError}</div>
        )}
        {pwSuccess && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">{pwSuccess}</div>
        )}

        <form onSubmit={handlePwSave} className="space-y-4 max-w-sm">
          <Field label="Current Password">
            <input
              name="currentPassword"
              type="password"
              value={pwForm.currentPassword}
              onChange={onPwChange}
              required
              autoComplete="current-password"
              className={inputClass(false)}
            />
          </Field>
          <Field label="New Password">
            <input
              name="newPassword"
              type="password"
              value={pwForm.newPassword}
              onChange={onPwChange}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass(false)}
            />
          </Field>
          <Field label="Confirm New Password">
            <input
              name="confirmPassword"
              type="password"
              value={pwForm.confirmPassword}
              onChange={onPwChange}
              required
              autoComplete="new-password"
              className={inputClass(false)}
            />
          </Field>
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pwLoading ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
