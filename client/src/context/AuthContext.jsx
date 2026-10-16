import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chat_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => setCurrentUser(res.data.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { user, token: newToken } = res.data.data;
    localStorage.setItem('chat_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    return user;
  };

  const register = async (userData) => {
    const res = await axios.post('/api/auth/register', userData);
    const { user, token: newToken } = res.data.data;
    localStorage.setItem('chat_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('chat_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
