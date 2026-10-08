import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import BackupModal from './BackupModal';
import BusinessSettingsModal from './BusinessSettingsModal';

const Sidebar = ({ companyName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
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
    { label: 'Dashboard', id: 'dashboard', path: '/', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
    ) },
    { label: 'Buyers',    id: 'buyers',    path: '/buyers', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ) },
    { label: 'Items',     id: 'items',     path: '/items', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
    ) },
    { label: 'Orders',    id: 'orders',    path: '/orders', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    ) },
    { label: 'Payments',  id: 'payments',  path: '/payments', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
    ) },
    { label: 'Ledger',    id: 'ledger',    path: '/ledger', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
    ) },
    { label: 'Reports',   id: 'reports',   path: '/reports', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
    ) },
  ];

  const settingsIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
  );

  const backupIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
  );

  const logoutIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
  );

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
              className={`flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 rounded-lg border border-white/10 transition-all duration-150 shrink-0 text-sm font-bold ${
                isOpen ? 'h-9 w-9' : 'h-11 w-11'
              }`}
            >
              {isOpen ? '<' : '>'}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-indigo-600 border-indigo-400/40 text-white shadow-sm'
                  : 'border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
              } ${isOpen ? '' : 'justify-center'}`}
              title={item.label}
            >
              {item.icon}
              {isOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-3 right-3 space-y-1">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-xl transition-all duration-150 text-sm font-medium ${isOpen ? '' : 'justify-center'}`}
            title="Settings"
          >
            {settingsIcon}
            {isOpen && <span className="truncate">Settings</span>}
          </button>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-xl transition-all duration-150 text-sm font-medium ${isOpen ? '' : 'justify-center'}`}
            title="Backup"
          >
            {backupIcon}
            {isOpen && <span className="truncate">Backup</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border border-rose-500/20 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 hover:border-rose-400/40 rounded-xl transition-all duration-150 text-sm font-medium ${isOpen ? '' : 'justify-center'}`}
            title="Logout"
          >
            {logoutIcon}
            {isOpen && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>

      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
      <BusinessSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
};

export default Sidebar;