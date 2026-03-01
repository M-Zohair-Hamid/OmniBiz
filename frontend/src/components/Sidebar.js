import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import BackupModal from './BackupModal';
import BusinessSettingsModal from './BusinessSettingsModal';

const Sidebar = ({ companyName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [isOpen, setIsOpen] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState(companyName || 'Business Company');

  // Fetch business settings to get company name
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const name = data.business_name || 'Business Company';
          setBusinessName(name);
          // Update document title
          document.title = name;
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
      }
    };
    fetchBusinessName();
  }, []);

  // Map company names to logo paths
  const getCompanyLogo = (companyName) => {
    if (companyName?.toLowerCase().includes('umarsons')) {
      return '/umarsons-logo.png';
    }
    return null;
  };

  // Map database company names to display names
  const getDisplayCompanyName = (name) => {
    if (!name) return 'Business';
    return name;
  };

  const menuItems = [
    { label: 'Dashboard', id: 'dashboard', path: '/' },
    { label: 'Buyers', id: 'buyers', path: '/buyers' },
    { label: 'Items', id: 'items', path: '/items' },
    { label: 'Orders', id: 'orders', path: '/orders' },
    { label: 'Payments', id: 'payments', path: '/payments' },
    { label: 'Ledger', id: 'ledger', path: '/ledger' },
    { label: 'Reports', id: 'reports', path: '/reports' }
  ];

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className={`sidebar fixed left-0 top-0 h-screen bg-gradient-to-b from-[#17144B] via-[#3A3F8C] to-[#17144B] backdrop-blur-md transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} shadow-glass-lg z-50`}>
        <div className="p-4 border-b border-white border-opacity-15">
          <div className="flex items-center justify-between">
            {isOpen && (
              <h1 className="text-white text-xl font-bold tracking-wide">
                {getDisplayCompanyName(businessName)}
              </h1>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105"
            >
              {isOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        <nav className="p-3 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium ${
                isActive(item.path)
                  ? 'bg-white bg-opacity-25 text-white shadow-glass border border-white border-opacity-20 transform scale-105'
                  : 'text-white hover:bg-white hover:bg-opacity-15 hover:shadow-lg hover:shadow-[#00D4FF]/20 border border-transparent hover:border-white hover:border-opacity-20'
              } ${isOpen ? '' : 'text-center'} group`}
              title={item.label}
            >
              {isOpen ? item.label : item.label.charAt(0)}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/60 transform hover:scale-105 backdrop-blur-sm border border-blue-400 border-opacity-40"
          >
            {isOpen ? '⚙️ Settings' : '⚙️'}
          </button>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-green-500/60 transform hover:scale-105 backdrop-blur-sm border border-green-400 border-opacity-40"
          >
            {isOpen ? '💾 Backup' : '💾'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-red-500/60 transform hover:scale-105 backdrop-blur-sm border border-red-400 border-opacity-40"
          >
            {isOpen ? 'Logout' : '←'}
          </button>
        </div>
      </div>

      {/* Modals rendered outside sidebar to center in viewport */}
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
      <BusinessSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
};

export default Sidebar;
