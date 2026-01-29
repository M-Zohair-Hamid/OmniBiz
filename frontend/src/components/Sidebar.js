import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

const Sidebar = ({ companyName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [isOpen, setIsOpen] = useState(true);

  // Map database company names to display names
  const getDisplayCompanyName = (companyName) => {
    if (!companyName) return 'Business';
    // Database now has correct names, return as-is
    return companyName;
  };

  const menuItems = [
    { label: 'Dashboard', id: 'dashboard', path: '/' },
    { label: 'Buyers', id: 'buyers', path: '/buyers' },
    { label: 'Items', id: 'items', path: '/items' },
    { label: 'Orders', id: 'orders', path: '/orders' },
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
    <div className={`sidebar fixed left-0 top-0 h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-950 backdrop-blur-md transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} shadow-glass-lg z-50`}>
      <div className="p-4 border-b border-white border-opacity-15">
        <div className="flex items-center justify-between">
          {isOpen && (
            <h1 className="text-white text-2xl font-bold tracking-tight">{getDisplayCompanyName(user?.company_name)}</h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105"
          >
            {isOpen ? '←' : '→'}
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white border-opacity-15 bg-red-800 bg-opacity-20 backdrop-blur-sm">
        {isOpen && (
          <div>
            <p className="text-white text-sm font-semibold opacity-90">{companyName}</p>
            <p className="text-white text-xs opacity-70 mt-1">{user?.full_name}</p>
          </div>
        )}
      </div>

      <nav className="p-3 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium ${
              isActive(item.path)
                ? 'bg-white bg-opacity-25 text-white shadow-glass border border-white border-opacity-20 transform scale-105'
                : 'text-white hover:bg-white hover:bg-opacity-15 hover:shadow-lg hover:shadow-orange-500/20 border border-transparent hover:border-white hover:border-opacity-20'
            } ${isOpen ? '' : 'text-center'} group`}
            title={item.label}
          >
            {isOpen ? item.label : item.label.charAt(0)}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-red-600/60 transform hover:scale-105 backdrop-blur-sm border border-red-300 border-opacity-40"
        >
          {isOpen ? 'Logout' : '←'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
