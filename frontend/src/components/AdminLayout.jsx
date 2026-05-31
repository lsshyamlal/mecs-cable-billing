import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../api';

const NAV = [
  {
    to: '/admin', end: true,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    label: 'Dashboard',
  },
  {
    to: '/admin/customers', end: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
    label: 'Customers',
  },
  {
    to: '/admin/customer-address', end: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    ),
    label: 'Manage Address',
  },
  {
    to: '/admin/organisation', end: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    label: 'Manage Organisation',
  },
  {
    to: '/admin/subscription-packs', end: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    ),
    label: 'Manage Plans',
  },
  {
    to: '/admin/reports', end: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    label: 'Reports',
  },
  {
    to: '/admin/profile', end: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    label: 'Profile',
  },
];

function ThemeToggle() {
  const { dark, toggleDark } = useTheme();
  return (
    <button
      onClick={toggleDark}
      className="text-blue-100 hover:text-white transition p-1 rounded"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function AdminLayout({ children }) {
  const { auth, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } finally {
      signOut();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-x-hidden">
      {/* Top bar */}
      <header className="bg-blue-800 dark:bg-blue-900 shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg tracking-wide">MECS Cable TV</span>
            <span className="text-xs text-blue-200 font-medium bg-blue-700 dark:bg-blue-800 px-2 py-0.5 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            {auth && (
              <Link to="/admin/profile" className="text-blue-100 text-sm hidden sm:block hover:text-white transition">
                {auth.name}
              </Link>
            )}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-sm text-white border border-white/40 px-3 py-1 rounded hover:bg-white/10 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 hidden sm:block">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 z-10">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded text-xs font-medium ${
                  isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-16 sm:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
