import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Settings, Calendar, CreditCard, FileText, Package, Users, 
  ChevronRight, X, LogOut 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { FixMyRideUser, NavItem } from '../../types/index';

const Sidebar = ({ isOpen, onToggle, user }: { isOpen: boolean, onToggle: (open: boolean) => void, user: FixMyRideUser | null }) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { name: 'Home', icon: <TrendingUp size={20} />, path: '/' },
    { name: 'Services', icon: <Settings size={20} />, path: '/categories' },
    { name: 'Bookings', icon: <Calendar size={20} />, path: '/bookings' },
    { name: 'Payments', icon: <CreditCard size={20} />, path: '/payments' },
    { name: 'Invoices', icon: <FileText size={20} />, path: '/invoices' },
    { name: 'Inventory', icon: <Package size={20} />, path: '/parts' },
    { name: 'Admins', icon: <Users size={20} />, path: '/admin-users' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onToggle(false)}
            className="sidebar-overlay"
          />
        )}
      </AnimatePresence>

      <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <button className="mobile-close-btn" onClick={() => onToggle(false)}>
          <X size={24} color="white" />
        </button>
        <div className="logo-section" style={{ padding: '20px 0 40px', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="FixMyRide Logo"
            className="brand-logo-img"
          />
        </div>

        <nav className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => onToggle(false)}
              >
                {item.icon}
                <span>{item.name}</span>
                {location.pathname === item.path && <ChevronRight size={16} className="active-arrow" />}
              </Link>
            ))}
          </div>
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800' }}>
              {user?.email?.[0].toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px' }}>
                Super Admin
              </div>
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              fontSize: '13px', 
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
