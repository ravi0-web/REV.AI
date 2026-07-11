import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial auth state
    if (api.isAuthenticated()) {
      const savedUser = api.getUser();
      if (savedUser) {
        setUser(savedUser);
      } else {
        // Fetch fresh profile if we have token but no user object
        api.getMe()
          .then(res => setUser(res.data.user))
          .catch(() => api.removeToken());
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    setUser(res.user);
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
