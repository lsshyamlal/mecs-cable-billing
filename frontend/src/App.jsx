import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import PortalHome from './pages/PortalHome';
import PortalHistory from './pages/PortalHistory';
import Dashboard from './pages/admin/Dashboard';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import CustomerForm from './pages/admin/CustomerForm';
import CustomerAddress from './pages/admin/CustomerAddress';
import Organisation from './pages/admin/Organisation';
import SubscriptionPacks from './pages/admin/SubscriptionPacks';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/AdminProfile';
const Help = lazy(() => import('./pages/admin/Help'));

function RequireCustomer({ children }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== 'ROLE_CUSTOMER') return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== 'ROLE_ADMIN') return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Customer portal */}
        <Route path="/portal" element={<RequireCustomer><PortalHome /></RequireCustomer>} />
        <Route path="/portal/history" element={<RequireCustomer><PortalHistory /></RequireCustomer>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/admin/customers" element={<RequireAdmin><Customers /></RequireAdmin>} />
        <Route path="/admin/customers/new" element={<RequireAdmin><CustomerForm /></RequireAdmin>} />
        <Route path="/admin/customers/:id" element={<RequireAdmin><CustomerDetail /></RequireAdmin>} />
        <Route path="/admin/customer-address" element={<RequireAdmin><CustomerAddress /></RequireAdmin>} />
        <Route path="/admin/areas" element={<Navigate to="/admin/customer-address" replace />} />
        <Route path="/admin/organisation" element={<RequireAdmin><Organisation /></RequireAdmin>} />
        <Route path="/admin/subscription-packs" element={<RequireAdmin><SubscriptionPacks /></RequireAdmin>} />
        <Route path="/admin/reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
        <Route path="/admin/profile" element={<RequireAdmin><AdminProfile /></RequireAdmin>} />
        <Route path="/admin/help" element={<RequireAdmin><Suspense fallback={<p className="p-6" role="status">Loading user guide…</p>}><Help /></Suspense></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
