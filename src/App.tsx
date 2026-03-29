import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Menu, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { FixMyRideUser } from './types/index';
import { useToast } from './hooks/useToast';

// Components
import Sidebar from './components/common/Sidebar';
import Auth from './components/common/Auth';
import GenericTableView from './components/common/GenericTableView';
import DashboardView from './components/core/DashboardView';
import CategoriesView from './components/core/CategoriesView';
import InventoryView from './components/core/InventoryView';

export default function App() {
  const [user, setUser] = useState<FixMyRideUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app-container">
        {authLoading ? (
          <div className="loading-screen">
            <Loader2 className="animate-spin" size={60} color="var(--primary)" />
          </div>
        ) : !user ? (
          <Auth onAuthSuccess={setUser} />
        ) : (
          <>
            <header className="mobile-header">
              <Link to="/" className="mobile-header-logo">
                <img src="/logo.png" alt="FixMyRide" height="30" />
              </Link>
              <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
              </button>
            </header>

            <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} user={user} />
            
            <main className="main-content">
              <Routes>
                <Route path="/" element={<DashboardView user={user} />} />
                <Route path="/categories" element={<CategoriesView showToast={showToast} />} />
                <Route path="/bookings" element={<GenericTableView
                  title="Booking Records"
                  tableName="booking_records"
                  onToast={showToast}
                  hideDelete={true}
                  columns={[
                    { key: 'order_number', label: 'Order #' },
                    { key: 'invoice_number', label: 'Invoice', formatter: (val: any) => val || 'N/A' },
                    { key: 'created_at', label: 'Date', formatter: (val: any) => new Date(val).toLocaleDateString() },
                    { key: 'customer_firstname', label: 'Customer', formatter: (val: any, row: any) => `${val || ''} ${row.customer_lastname || ''}` },
                    { key: 'customer_phone', label: 'Phone' },
                    { key: 'customer_email', label: 'Email' },
                    { key: 'address_city', label: 'City' },
                    { key: 'amount', label: 'Total', formatter: (val: any) => `AED ${val || 0}` },
                    { key: 'staff_name', label: 'Staff' },
                  ]}
                />} />
                <Route path="/payments" element={<GenericTableView
                  title="Payment Records"
                  tableName="payment_records"
                  onToast={showToast}
                  hideDelete={true}
                  columns={[
                    { key: 'created_at', label: 'Date', formatter: (val: any) => new Date(val).toLocaleDateString() },
                    { key: 'customer_firstname', label: 'Customer', formatter: (val: any, row: any) => `${val || ''} ${row.customer_lastname || ''}` },
                    { key: 'amount', label: 'Amount', formatter: (val: any) => `AED ${val}` },
                    { key: 'payment_method', label: 'Method' },
                    { key: 'status', label: 'Status', formatter: (val: any) => <span className="badge badge-success">{val}</span> },
                  ]}
                />} />
                <Route path="/invoices" element={<GenericTableView
                  title="Invoice Records"
                  tableName="invoice_recordings"
                  onToast={showToast}
                  primaryKey="invoice_number"
                  hideDelete={true}
                  columns={[
                    { key: 'invoice_number', label: 'Invoice No.' },
                    { key: 'invoice_date', label: 'Date', formatter: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
                    { key: 'customer_email', label: 'Customer Email' },
                    { key: 'total_tax', label: 'Tax', formatter: (val: any) => `AED ${val || 0}` },
                    { key: 'discount_value', label: 'Discount', formatter: (val: any) => `AED ${val || 0}` },
                    { key: 'due_date', label: 'Due Date', formatter: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
                    { key: 'invoice_link', label: 'Document', formatter: (val: any) => val ? <a href={val} target="_blank" style={{color: 'var(--primary)'}}>View PDF</a> : 'N/A' },
                  ]}
                />} />
                <Route path="/messages" element={<GenericTableView
                  title="Customer Messages"
                  tableName="customer_messages"
                  onToast={showToast}
                  columns={[
                    { key: 'phone', label: 'Phone' },
                    { key: 'message', label: 'Message' },
                    { key: 'role', label: 'Role' },
                    { key: 'created_at', label: 'Received' },
                  ]}
                />} />
                <Route path="/parts" element={<InventoryView showToast={showToast} />} />
                <Route path="/admin-users" element={<GenericTableView
                  title="Admin Users"
                  tableName="admin_users"
                  onToast={showToast}
                  columns={[
                    { key: 'full_name', label: 'Full Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'role', label: 'Role' },
                    { key: 'is_active', label: 'Status', formatter: (val: any) => <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>{val ? 'Active' : 'Inactive'}</span> },
                  ]}
                  fields={[
                    { name: 'full_name', label: 'Full Name' },
                    { name: 'email', label: 'Email' },
                    { name: 'role', label: 'Role', type: 'select', options: ['Super Admin', 'Admin', 'Editor'] },
                    { name: 'is_active', label: 'Active Account', type: 'checkbox' },
                  ]}
                />} />
                <Route path="*" element={<DashboardView user={user} />} />
              </Routes>
            </main>
          </>
        )}

        <div className="toast-container">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                className={`toast ${t.type}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {t.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}
