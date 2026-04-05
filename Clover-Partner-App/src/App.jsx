import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedLayout } from './components/ProtectedLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Otp } from './pages/Otp';
import { Profile } from './pages/Profile';
import { Earnings } from './pages/Earnings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Application Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<Otp />} />

        {/* Secure Application Routes nested natively inside generic UI Context blocks */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/earnings" element={<Earnings />} />
          </Route>
        </Route>

        {/* Global Fallback directly mapping generically matching root to defaults efficiently */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
