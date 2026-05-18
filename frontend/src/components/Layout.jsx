import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg tracking-wide">MECS Cable TV</span>
            <span className="ml-2 text-xs text-blue-200 font-medium bg-blue-600 px-2 py-0.5 rounded">Customer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {auth && (
              <span className="text-blue-100 text-sm hidden sm:block">
                Welcome, {auth.name}
              </span>
            )}
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
