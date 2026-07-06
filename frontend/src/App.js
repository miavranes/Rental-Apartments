import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import ApartmentDetail from './pages/ApartmentDetail';
import Profile from './pages/Profile';
import Owner from './pages/Owner';
import MyReservations from './pages/MyReservations';
import OwnerReservations from './pages/OwnerReservations';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

         <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/apartments" element={<ProtectedRoute><Apartments /></ProtectedRoute>} />
          <Route path="/apartments/:id" element={<ProtectedRoute><ApartmentDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute><Owner /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/owner/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/owner/reservations" element={<ProtectedRoute><OwnerReservations /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}