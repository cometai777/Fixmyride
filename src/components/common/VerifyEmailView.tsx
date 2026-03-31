import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { FixMyRideUser } from '../../types/index';

const VerifyEmailView = ({ user }: { user: FixMyRideUser }) => {
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const email = user.email || '';

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setResendMsg(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (error) {
      setResendMsg(error.message);
    } else {
      setResendMsg('Confirmation email sent. Check your inbox.');
    }
  };

  const handleSignOut = () => {
    void supabase.auth.signOut();
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="auth-logo-brand">
          <img src="/logo.png" alt="FixMyRide" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
          <Mail size={40} strokeWidth={1.5} />
        </div>
        <h2>Confirm your email</h2>
        <p style={{ marginBottom: '8px' }}>
          We sent a confirmation link to <strong>{email || 'your email'}</strong>. Open the link to activate your account.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
          You need to confirm before you can use the dashboard.
        </p>

        {resendMsg && (
          <div
            style={{
              color: resendMsg.startsWith('Confirmation') ? '#16a34a' : '#ef4444',
              padding: '12px',
              background: resendMsg.startsWith('Confirmation') ? '#f0fdf4' : '#fef2f2',
              borderRadius: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {resendMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="button" className="auth-submit" disabled={loading || !email} onClick={handleResend}>
            {loading ? <Loader2 className="animate-spin" /> : 'Resend confirmation email'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailView;
