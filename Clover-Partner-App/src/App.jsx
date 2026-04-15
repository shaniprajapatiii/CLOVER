import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Otp } from './pages/Otp';
import { Register } from './pages/Register';
import { ProfilePage as CompleteProfile } from './pages/CompleteProfile';
import { RealTimePartnerDashboard } from './pages/RealTimeDashboard';
import { ActiveDeliveryPage } from './pages/ActiveDelivery';
import { Earnings } from './pages/Earnings';
import SupportPage from './pages/Support';
import LandingPage from './pages/LandingPage';
import ProofOfDelivery from './components/ProofOfDelivery';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/register" element={<Register />} />

        {/* Secure Application Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Main Dashboard - Real-time order notifications */}
          <Route path="/dashboard" element={<RealTimePartnerDashboard />} />
          
          {/* Profile & Account Management */}
          <Route path="/profile" element={<CompleteProfile />} />
          
          {/* Active Delivery Tracking with Live Map */}
          <Route path="/active-delivery" element={<ActiveDeliveryPage />} />
          
          {/* Proof of Delivery - Photo & Signature */}
          <Route path="/proof-of-delivery" element={<ProofOfDelivery />} />
          
          {/* Earnings & Analytics */}
          <Route path="/earnings" element={<Earnings />} />

          {/* Partner Support */}
          <Route path="/support" element={<SupportPage />} />
        </Route>

        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
