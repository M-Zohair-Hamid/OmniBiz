import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

const LoginPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const { login, user, setUserDirect } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Hardcode companies - no API call needed
    setCompanies([
      { id: 1, name: 'UmarSons', code: 'PC' },
      { id: 2, name: 'Makkah Packages', code: 'QP' }
    ]);
    setCompaniesLoading(false);
  }, []);

  const handleCompanySelect = async (companyId, companyName, companyCode) => {
    setLoading(true);
    
    try {
      // Set user context directly
      const userData = {
        id: 'admin',
        username: 'admin',
        company_id: companyId,
        company_name: companyName,
        company_code: companyCode,
        token: 'mock-token-' + companyCode
      };
      
      // Save to localStorage BEFORE calling setUserDirect
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      localStorage.setItem('selectedCompanyId', companyId);
      localStorage.setItem('selectedCompanyCode', companyCode);
      localStorage.setItem('selectedCompanyName', companyName);
      
      // Call setUserDirect to update context (interceptor will handle headers)
      setUserDirect(userData);
      
      showToast(`Welcome to ${companyName}!`, 'success');
      
      // Navigate after a brief delay to allow state to update
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      showToast(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (companiesLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B]">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-[#00D4FF]"></div>
          <p className="mt-6 text-white text-lg font-semibold">{loading ? 'Logging in...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      
      {/* Glassmorphism background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#00D4FF] opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      
      <div className="w-full max-w-2xl relative z-10 px-4">
        <div className="backdrop-blur-xl bg-white bg-opacity-10 border border-white border-opacity-20 rounded-3xl shadow-glass-lg p-10">
          <h1 className="text-5xl font-bold text-center text-white mb-3 tracking-tight">Welcome</h1>
          <p className="text-center text-[#EBEEF5] mb-12 text-lg font-medium">Select Your Business</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company.id, company.name, company.code)}
                    disabled={loading}
                    className="group backdrop-blur-xl bg-white bg-opacity-20 hover:bg-opacity-30 border-2 border-white border-opacity-30 hover:border-opacity-50 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#00D4FF]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-center">
                      <div className="mb-4 text-6xl">{company.code === 'PC' ? '🏢' : '📦'}</div>
                      <h2 className="text-3xl font-bold text-white mb-2">{company.name}</h2>
                      <p className="text-[#EBEEF5] text-sm">Code: {company.code}</p>
                    </div>
                  </button>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-[#EBEEF5] text-sm">Click on your business to enter the system</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
