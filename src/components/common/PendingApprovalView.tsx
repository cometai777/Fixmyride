import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const PendingApprovalView = ({ email }: { email?: string | null }) => {
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
        <h2>Waiting for admin approval</h2>
        <p>
          {email ? (
            <>
              Your account <strong>{email}</strong> is registered, but it must be approved by a super admin before you can access the dashboard.
            </>
          ) : (
            'Your account is registered, but it must be approved by a super admin before you can access the dashboard.'
          )}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            className="auth-submit"
            onClick={() => window.location.reload()}
          >
            Refresh status
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'transparent',
              border: '1px solid var(--input-border)',
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

export default PendingApprovalView;

