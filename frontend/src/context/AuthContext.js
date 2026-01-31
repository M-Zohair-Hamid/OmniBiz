import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Only restore session if it hasn't expired due to inactivity
    const storedToken = localStorage.getItem('token');
    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    const storedUser = localStorage.getItem('user');
    const lastActivity = localStorage.getItem('lastActivity');

    if (storedToken && storedCompanyId && lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // Session expired, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedCompanyId');
        localStorage.removeItem('selectedCompanyCode');
        localStorage.removeItem('selectedCompanyName');
        localStorage.removeItem('lastActivity');
      } else if (storedUser) {
        // Session still valid, restore it
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          localStorage.setItem('lastActivity', Date.now().toString());
        } catch (e) {
          // Invalid data, clear session
          localStorage.clear();
        }
      }
    }

    setLoading(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Update activity on these events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check for inactivity every minute
    const inactivityCheck = setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          logout();
        }
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheck);
    };
  }, [user]);


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
    localStorage.removeItem('lastActivity');
    setToken(null);
    setUser(null);
  };

  const setUserDirect = (userData) => {
    console.log('Setting user directly:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUserDirect }}>
      {children}
    </AuthContext.Provider>
  );
};
