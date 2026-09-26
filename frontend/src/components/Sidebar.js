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
  const [businessName, setBusinessName] = useState(companyName || 'Business');

  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const name = data.business_name || 'Business';
          setBusinessName(name);
          document.title = name;
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
      }
    };
    fetchBusinessName();
  }, []);

  const menuItems = [
    { label: 'Dashboard', id: 'dashboard', path: '/' },
    { label: 'Buyers',    id: 'buyers',    path: '/buyers' },
    { label: 'Items',     id: 'items',     path: '/items' },
    { label: 'Orders',    id: 'orders',    path: '/orders' },
    { label: 'Payments',  id: 'payments',  path: '/payments' },
    { label: 'Ledger',    id: 'ledger',    path: '/ledger' },
    { label: 'Reports',   id: 'reports',   path: '/reports' },
  ];

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className={`sidebar fixed left-0 top-0 h-screen bg-slate-900 border-r border-white/5 transition-all duration-200 ${isOpen ? 'w-64' : 'w-20'} z-50`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-white/10">
          <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
            {isOpen && (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
                  {(businessName || 'B').charAt(0).toUpperCase()}
                </div>
                <h1 className="text-white text-base font-semibold tracking-tight truncate">
                  {businessName || 'Business'}
                </h1>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-150 shrink-0 text-sm font-bold ${
                isOpen ? 'p-2' : 'flex items-center justify-center h-11 w-11 border border-white/10'
              }`}
            >
              {isOpen ? '<' : '>'}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              } ${isOpen ? '' : 'text-center'}`}
              title={item.label}
            >
              {isOpen ? item.label : item.label.charAt(0)}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-3 right-3 space-y-1">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-full px-3 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors duration-150 text-sm font-medium text-left"
          >
            {isOpen ? 'Settings' : 'S'}
          </button>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="w-full px-3 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors duration-150 text-sm font-medium text-left"
          >
            {isOpen ? 'Backup' : 'B'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 rounded-xl transition-colors duration-150 text-sm font-medium text-left"
          >
            {isOpen ? 'Logout' : 'X'}
          </button>
        </div>
      </div>

      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
      <BusinessSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
};

export default Sidebar;