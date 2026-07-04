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

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/apartments/:id" element={<ApartmentDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/owner" element={<Owner />} />
          <Route path="/reservations" element={<MyReservations />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/owner/reservations" element={<OwnerReservations />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} /> 
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
