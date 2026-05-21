import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PortalHome from './pages/PortalHome';
import PortalHistory from './pages/PortalHistory';
import Dashboard from './pages/admin/Dashboard';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import CustomerForm from './pages/admin/CustomerForm';
import Areas from './pages/admin/Areas';
import SubscriptionPacks from './pages/admin/SubscriptionPacks';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/AdminProfile';

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
        <Route path="/admin/areas" element={<RequireAdmin><Areas /></RequireAdmin>} />
        <Route path="/admin/subscription-packs" element={<RequireAdmin><SubscriptionPacks /></RequireAdmin>} />
        <Route path="/admin/reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
        <Route path="/admin/profile" element={<RequireAdmin><AdminProfile /></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
