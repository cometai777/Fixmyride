import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Package, CreditCard, TrendingUp, AlertCircle, 
  Loader2, CalendarCheck, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, supabaseUrl } from '../../lib/supabase';
import Header from '../common/Header';
import type { FixMyRideUser, DashboardStats } from '../../types/index';

const DashboardView = ({ user }: { user: FixMyRideUser | null }) => {
  const isSupabaseLive = !supabaseUrl.includes('placeholder');
  
  const [stats, setStats] = useState<DashboardStats>({ bookings: 0, services: 0, revenue: 0, parts: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const adminName = user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    async function fetchStats() {
      if (!isSupabaseLive) {
        setStats({ bookings: 0, services: 0, revenue: 0, parts: 0 });
        setRecent([]);
        setLoading(false);
        return;
      }
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
        const dataFetchPromise = Promise.all([
          (supabase as any).from('booking_records').select('*', { count: 'exact', head: true }),
          (supabase as any).from('service_categories').select('*', { count: 'exact', head: true }),
          (supabase as any).from('payment_records').select('amount'),
          (supabase as any).from('booking_records').select('*').limit(3).order('created_at', { ascending: false }),
          (supabase as any).from('parts').select('*', { count: 'exact', head: true })
        ]);

        const [bookings, services, payments, latest, parts]: any = await Promise.race([dataFetchPromise, timeoutPromise]);

        const totalRevenue = (payments.data || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        setStats({
          bookings: bookings.count || 0,
          services: services.count || 0,
          revenue: totalRevenue,
          parts: parts.count || 0
        });
        setRecent(latest.data || []);
      } catch (err) {
        console.warn("Using empty dashboard state due to connection error:", err);
        setStats({ bookings: 0, services: 0, revenue: 0, parts: 0 });
        setRecent([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [isSupabaseLive]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="var(--primary)" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {!isSupabaseLive && (
        <div className="config-banner">
          <AlertCircle size={20} />
          <span><strong>Action Required:</strong> Please configure your <code>.env</code> file with real Supabase credentials to view live data.</span>
        </div>
      )}
      <Header title={`Welcome, ${adminName}`} />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Calendar size={28} /></div>
          <div className="stat-info">
            <h3>Active Bookings</h3>
            <div className="value">{stats.bookings.toLocaleString()}</div>
            <div style={{ color: '#16a34a', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
              <TrendingUp size={12} /> Live from DB
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}><Package size={28} /></div>
          <div className="stat-info">
            <h3>Parts Inventory</h3>
            <div className="value">{stats.parts.toLocaleString()}</div>
            <div style={{ color: '#16a34a', fontSize: '11px', fontWeight: '700' }}>In stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><CreditCard size={28} /></div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <div className="value">AED {stats.revenue.toLocaleString()}</div>
            <div style={{ color: '#22c55e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
              <TrendingUp size={12} /> Positive Growth
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Trend (Weekly)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', paddingBottom: '20px' }}>
          {[30, 45, 25, 60, 40, 75, 55, 90, 65, 80].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.8 }}
              style={{
                flex: 1,
                background: i === 7 ? 'var(--primary)' : 'var(--primary-light)',
                borderRadius: '4px',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', bottom: '-20px', left: '0', right: '0', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                {['M','T','W','T','F','S','S','M','T','W'][i]}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>Recent Bookings</h2>
            <Link to="/bookings" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recent.map(row => (
              <div key={row.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarCheck size={20} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>Booking from {row.customer_firstname} {row.customer_lastname}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleDateString()}</div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
            {recent.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No recent activity</div>}
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ebedf0 100%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '800', color: 'var(--text-main)' }}>FIXMYRIDE <span style={{ color: 'var(--primary)' }}>PRO</span></h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5', maxWidth: '80%' }}>Get access to detailed shop analytics and fleet management tools.</p>
            <button className="btn-primary" style={{ width: 'fit-content' }}>
              Enhance Experience <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0, 163, 255, 0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, color: 'var(--primary)' }}>
            <TrendingUp size={140} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardView;
