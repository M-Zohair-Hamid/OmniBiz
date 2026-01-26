import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Restore session from localStorage without clearing on refresh
    const storedToken = localStorage.getItem('token');
    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedCompanyId) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // Ignore parse errors and let verify/login reset user
        }
      }
    }

    setLoading(false);
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify-token');
      console.log('Token verified successfully');
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error.response?.data || error.message);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, companyId) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
        company_id: companyId
      });
      
      const { access_token, user: userData } = response.data;
      console.log('Login successful, token received:', access_token?.substring(0, 20) + '...');
      
      // Save token to localStorage (interceptor will handle headers)
      localStorage.setItem('token', access_token);
      console.log('Token saved to localStorage');
      
      // Update state
      setToken(access_token);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyCode');
    localStorage.removeItem('selectedCompanyName');
    setToken(null);
    setUser(null);
  };

  const setUserDirect = (userData) => {
    console.log('Setting user directly:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUserDirect }}>
      {children}
    </AuthContext.Provider>
  );
};
