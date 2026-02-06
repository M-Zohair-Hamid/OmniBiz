import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BuyersPage from './pages/BuyersPage';
import ItemsPage from './pages/ItemsPage';
import OrdersPage from './pages/OrdersPage';
import LedgerPage from './pages/LedgerPage';
import ReportsPage from './pages/ReportsPage';
import BuyerReportPage from './pages/BuyerReportPage';
import InvoicePage from './pages/InvoicePage';
import BillPage from './pages/BillPage';
import PaymentsPage from './pages/PaymentsPage';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/buyers" element={<ProtectedRoute><BuyersPage /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/invoice/:orderId" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
            <Route path="/bill/:orderId" element={<ProtectedRoute><BillPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/ledger" element={<ProtectedRoute><LedgerPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><BuyerReportPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
