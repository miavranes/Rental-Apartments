import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user, token } = await authService.login(email, password);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const register = async (payload) => {
    const { user, token } = await authService.register(payload);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const updateProfile = async (payload) => {
  const updatedUser = await authService.updateProfile(payload);
  setUser(updatedUser);
  return updatedUser;
};

const switchRole = async () => {
  const { user, token } = await authService.switchRole();
  localStorage.setItem('token', token);
  setUser(user);
  return user;
};

const deleteAccount = async () => {
  await authService.deleteAccount();
  localStorage.removeItem('token');
  setUser(null);
  window.location.href = '/';
};


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, switchRole, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth mora biti unutar AuthProvider-a');
  return ctx;
};