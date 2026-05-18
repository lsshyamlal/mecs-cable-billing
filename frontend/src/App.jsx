import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PortalHome from './pages/PortalHome';
import PortalHistory from './pages/PortalHistory';

function RequireCustomer({ children }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== 'ROLE_CUSTOMER') return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={
          <RequireCustomer><PortalHome /></RequireCustomer>
        } />
        <Route path="/portal/history" element={
          <RequireCustomer><PortalHistory /></RequireCustomer>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
