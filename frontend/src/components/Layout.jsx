import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../api';

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

export default function Layout({ children }) {
  const { auth, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      signOut();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <nav className="bg-blue-700 dark:bg-blue-900 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg tracking-wide">MECS Cable TV</span>
            <span className="ml-2 text-xs text-blue-200 font-medium bg-blue-600 dark:bg-blue-800 px-2 py-0.5 rounded">Customer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {auth && (
              <span className="text-blue-100 text-sm hidden sm:block">
                Welcome, {auth.name}
              </span>
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
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
