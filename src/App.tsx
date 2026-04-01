import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Menu, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { FixMyRideUser } from './types/index';
import { useToast } from './hooks/useToast';
import { validateAdminAccessByAuthUserId } from './lib/validateAdminAccess';

// Components
import Sidebar from './components/common/Sidebar';
import Auth from './components/common/Auth';
import VerifyEmailView from './components/common/VerifyEmailView';
import PendingApprovalView from './components/common/PendingApprovalView';
import GenericTableView from './components/common/GenericTableView';
import DashboardView from './components/core/DashboardView';
import CategoriesView from './components/core/CategoriesView';
import InventoryView from './components/core/InventoryView';
import { BOOKING_SUMMARY_COLUMNS } from './constants/bookingColumns';
import BookingDetailContent from './components/common/BookingDetailContent';
import { PAYMENT_SUMMARY_COLUMNS } from './constants/paymentColumns';
import { INVOICE_SUMMARY_COLUMNS } from './constants/invoiceColumns';
import PaymentDetailContent from './components/common/PaymentDetailContent';
import InvoiceDetailContent from './components/common/InvoiceDetailContent';

export default function App() {
  const [user, setUser] = useState<FixMyRideUser | null>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const nextUser = (session?.user || null) as FixMyRideUser | null;
      if (!nextUser) {
        setUser(null);
        setAdminProfile(null);
        setAuthLoading(false);
        return;
      }

      const admin = await validateAdminAccessByAuthUserId(nextUser.id);
      if (!admin.ok) {
        console.warn('Admin access denied:', admin.reason);
        showToast(admin.reason, 'error');
        await supabase.auth.signOut();
        setUser(null);
        setAdminProfile(null);
        setAuthLoading(false);
        return;
      }

      setUser(nextUser);
      setAdminProfile(admin.admin);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const nextUser = (session?.user || null) as FixMyRideUser | null;
        if (!nextUser) {
          setUser(null);
          setAdminProfile(null);
          return;
        }

        const admin = await validateAdminAccessByAuthUserId(nextUser.id);
        if (!admin.ok) {
          console.warn('Admin access denied:', admin.reason);
          showToast(admin.reason, 'error');
          await supabase.auth.signOut();
          setUser(null);
          setAdminProfile(null);
          return;
        }

        setUser(nextUser);
        setAdminProfile(admin.admin);
      })();
    });

    return () => subscription.unsubscribe();
  }, [showToast]);

  // Keep the current user's admin role in sync (e.g. if super admin demotes themselves).
  useEffect(() => {
    if (!user?.id) return;
    const channel = (supabase as any)
      .channel('admin_users_self')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users',
          filter: `auth_user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const next = payload?.new;
          if (!next) return;
          setAdminProfile((prev: any) => ({ ...(prev || {}), ...next }));
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <Router>
      <div className="app-container">
        {authLoading ? (
          <div className="loading-screen">
            <Loader2 className="animate-spin" size={60} color="var(--primary)" />
          </div>
        ) : !user ? (
          <Auth onAuthSuccess={() => {}} />
        ) : user.email && !user.email_confirmed_at ? (
          <VerifyEmailView user={user} />
        ) : adminProfile?.role === 'user' ? (
          <PendingApprovalView email={user.email} />
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

            <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} user={user} adminRole={adminProfile?.role} />
            
            <main className="main-content">
              <Routes>
                <Route path="/" element={<DashboardView user={user} />} />
                <Route path="/categories" element={<CategoriesView showToast={showToast} />} />
                <Route path="/bookings" element={<GenericTableView
                  key="booking_records"
                  title="Booking Records"
                  tableName="booking_records"
                  onToast={showToast}
                  hideDelete={true}
                  columns={BOOKING_SUMMARY_COLUMNS}
                  renderRowDetail={(row, onClose) => (
                    <BookingDetailContent row={row as Record<string, unknown>} onClose={onClose} />
                  )}
                />} />
                <Route path="/payments" element={<GenericTableView
                  key="payment_records"
                  title="Payment Records"
                  tableName="payment_records"
                  onToast={showToast}
                  hideDelete={true}
                  columns={PAYMENT_SUMMARY_COLUMNS}
                  renderRowDetail={(row, onClose) => (
                    <PaymentDetailContent row={row as Record<string, unknown>} onClose={onClose} />
                  )}
                />} />
                <Route path="/invoices" element={<GenericTableView
                  key="invoice_recordings"
                  title="Invoice Records"
                  tableName="invoice_recordings"
                  onToast={showToast}
                  primaryKey="invoice_number"
                  hideDelete={true}
                  columns={INVOICE_SUMMARY_COLUMNS}
                  renderRowDetail={(row, onClose) => (
                    <InvoiceDetailContent row={row as Record<string, unknown>} onClose={onClose} />
                  )}
                />} />
                <Route path="/messages" element={<GenericTableView
                  key="customer_messages"
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
                <Route
                  path="/admin-users"
                  element={
                    String(adminProfile?.role || '').trim().toLowerCase() === 'super admin'
                      ? (
                        <GenericTableView
                          key="admin_users"
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
                            {
                              name: 'role',
                              label: 'Role',
                              type: 'select',
                              options: ['super admin', 'admin', 'user'],
                            },
                            { name: 'is_active', label: 'Active Account', type: 'checkbox' },
                          ]}
                        />
                      )
                      : <Navigate to="/" replace />
                  }
                />
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
