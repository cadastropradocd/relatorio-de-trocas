import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../providers/AuthProvider';
import { ToastProvider } from '../providers/ToastProvider';
import { ProtectedRoute } from '../../modules/auth/components/ProtectedRoute';
import { Toast } from '../../shared/components/Toast';
import { Sidebar } from '../../shared/components/Sidebar';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { Dashboard } from '../../modules/dashboard/pages/Dashboard';
import { Login } from '../../modules/auth/pages/Login';
import { History } from '../../modules/history/pages/History';
import { Reports } from '../../modules/reports/pages/Reports';
import { Users } from '../../modules/users/pages/Users';
import { Departamentos } from '../../modules/departamentos/pages/Departamentos';

function App(): JSX.Element {
  const DEFAULT_DATE = new Date().toISOString().split('T')[0];
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ToastProvider>
          <Toast />
          <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="main-content">
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to={`/dashboard/${DEFAULT_DATE}`} />}
                      />
                      <Route path="/dashboard/:date" element={<Dashboard />} />
                      <Route path="/relatorios" element={<Reports />} />
                      <Route path="/history" element={<History />} />
                        <Route path="/usuarios" element={<ProtectedRoute requiredRole="admin"><Users /></ProtectedRoute>} />
                        <Route path="/departamentos" element={<ProtectedRoute requiredRole="admin"><Departamentos /></ProtectedRoute>} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
