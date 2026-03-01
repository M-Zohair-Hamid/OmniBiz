import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

const LoginPage = () => {
  const [businessSettings, setBusinessSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupLogoFile, setSetupLogoFile] = useState(null);
  const [setupLogoPreview, setSetupLogoPreview] = useState(null);
  const [setupData, setSetupData] = useState({
    business_name: '',
    address: ''
  });
  const { user, setUserDirect } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Fetch business settings
    const fetchBusinessSettings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/settings');
        if (response.ok) {
          const data = await response.json();
          setBusinessSettings(data);
          setNeedsSetup(!!data.needs_setup);
          setSetupData({
            business_name: data.business_name && data.business_name !== 'BUSINESS COMPANY' ? data.business_name : '',
            address: data.address && data.address !== 'Business District, City, Country' ? data.address : ''
          });
          document.title = data.business_name || 'Business Management System';
        } else {
          setBusinessSettings({
            business_name: 'Business Company',
            address: 'Business District, City, Country',
            logo_url: null
          });
          setNeedsSetup(true);
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
        setBusinessSettings({
          business_name: 'Business Company',
          address: 'Business District, City, Country',
          logo_url: null
        });
        setNeedsSetup(true);
      }
      setPageLoading(false);
    };
    fetchBusinessSettings();
  }, []);

  const handleSetupInputChange = (e) => {
    const { name, value } = e.target;
    setSetupData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSetupLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setSetupLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setSetupLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCompleteSetup = async (e) => {
    e.preventDefault();

    const businessName = (setupData.business_name || '').trim();
    const address = (setupData.address || '').trim();

    if (!businessName) {
      showToast('Business name is required', 'error');
      return;
    }

    if (!address) {
      showToast('Address is required', 'error');
      return;
    }

    if (!setupLogoFile) {
      showToast('Logo image is required for first-time setup', 'error');
      return;
    }

    setSetupSubmitting(true);
    try {
      const logoFormData = new FormData();
      logoFormData.append('logo', setupLogoFile);

      const uploadRes = await fetch('http://localhost:5000/api/settings/upload-logo', {
        method: 'POST',
        body: logoFormData
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || 'Failed to upload logo');
      }

      const saveRes = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_name: businessName,
          address
        })
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.error || 'Failed to save business settings');
      }

      const refreshRes = await fetch('http://localhost:5000/api/settings');
      if (refreshRes.ok) {
        const refreshedSettings = await refreshRes.json();
        setBusinessSettings(refreshedSettings);
        document.title = refreshedSettings.business_name || 'Business Management System';
      }

      setNeedsSetup(false);
      showToast('Setup completed successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to complete setup', 'error');
    } finally {
      setSetupSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      const userData = {
        id: 'admin',
        username: 'admin',
        company_id: 1,
        company_name: businessSettings.business_name,
        company_code: 'ORG',
        token: 'mock-token-ORG'
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      localStorage.setItem('selectedCompanyId', 1);
      localStorage.setItem('selectedCompanyCode', 'ORG');
      localStorage.setItem('selectedCompanyName', businessSettings.business_name);
      
      setUserDirect(userData);
      
      showToast(`Welcome to ${businessSettings.business_name}!`, 'success');
      
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      showToast(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B]">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-[#00D4FF]"></div>
          <p className="mt-6 text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
        <div className="w-full max-w-xl relative z-10 px-4">
          <div className="backdrop-blur-xl bg-white bg-opacity-10 border border-white border-opacity-20 rounded-3xl shadow-glass-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">First-Time Setup</h1>
            <p className="text-[#EBEEF5] text-sm text-center mb-6">Add your business name, logo, and address to continue.</p>

            <form onSubmit={handleCompleteSetup} className="space-y-5">
              <div>
                <label className="block text-white text-sm mb-2">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={setupData.business_name}
                  onChange={handleSetupInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-90 text-[#17144B] focus:outline-none"
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Business Address</label>
                <textarea
                  name="address"
                  value={setupData.address}
                  onChange={handleSetupInputChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-90 text-[#17144B] focus:outline-none"
                  placeholder="Enter business address"
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Business Logo</label>
                <input
                  id="setup-logo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleSetupLogoChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <label
                    htmlFor="setup-logo-input"
                    className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-all shadow-md"
                  >
                    Choose Logo
                  </label>
                  <span className="text-xs text-[#EBEEF5] text-center break-all">
                    {setupLogoFile ? setupLogoFile.name : 'No file selected'}
                  </span>
                </div>
                {setupLogoPreview && (
                  <div className="mt-3 p-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20">
                    <img src={setupLogoPreview} alt="Logo preview" className="h-24 w-auto object-contain mx-auto" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={setupSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
              >
                {setupSubmitting ? 'Saving Setup...' : 'Complete Setup'}
              </button>
            </form>
          </div>
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
      
      <div className="w-full max-w-md relative z-10 px-4">
        <div className="backdrop-blur-xl bg-white bg-opacity-10 border border-white border-opacity-20 rounded-3xl shadow-glass-lg p-10">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            {businessSettings?.logo_url ? (
              <img 
                src={`http://localhost:5000${businessSettings.logo_url}`} 
                alt={businessSettings.business_name}
                className="h-32 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`${businessSettings?.logo_url ? 'hidden' : 'flex'} items-center justify-center h-32 w-32 bg-white bg-opacity-20 rounded-2xl border-2 border-white border-opacity-30`}
            >
              <span className="text-5xl font-bold text-white">{businessSettings?.business_name?.charAt(0) || 'B'}</span>
            </div>
          </div>

          {/* Title Section */}
          <h1 className="text-4xl font-bold text-center text-white mb-2 tracking-tight">
            {businessSettings?.business_name || 'Business Company'}
          </h1>
          <p className="text-center text-[#EBEEF5] mb-8 text-sm">
            {businessSettings?.address || 'Business District, City, Country'}
          </p>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Logging in...
              </span>
            ) : (
              'Enter System'
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-[#EBEEF5] text-xs">Business Management System v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
