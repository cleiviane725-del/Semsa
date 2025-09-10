import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MedicationList from './pages/MedicationList';
import MedicationDetail from './pages/MedicationDetail';
import UtensilList from './pages/UtensilList';
import UtensilDetail from './pages/UtensilDetail';
import DistributionList from './pages/DistributionList';
import RequestList from './pages/RequestList';
import PatientDistribution from './pages/PatientDistribution';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import { seedInitialData } from './utils/seedData';

function App() {
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    // Initialize demo data on first load
    seedInitialData();
  }, []);

  // Protected route component
  const ProtectedRoute = ({ 
    children, 
    allowedRoles = ['admin', 'pharmacist', 'warehouse'] 
  }: { 
    children: React.ReactNode;
    allowedRoles?: string[];
  }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole || '')) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="medications" element={<MedicationList />} />
        <Route path="medications/:id" element={<MedicationDetail />} />
        <Route path="utensils" element={<UtensilList />} />
        <Route path="utensils/:id" element={<UtensilDetail />} />
        <Route path="inventory" element={
          <ProtectedRoute allowedRoles={['admin', 'warehouse']}>
            <DistributionList />
          </ProtectedRoute>
        } />
        <Route path="distributions" element={<DistributionList />} />
        <Route path="requests" element={<RequestList />} />
        <Route path="patient-distribution" element={<PatientDistribution />} />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin', 'warehouse']}>
            <Reports />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;