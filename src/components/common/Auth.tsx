import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Auth = ({ onAuthSuccess }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Sign-up succeeded but email must be confirmed first (no session yet). */
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRedirectTo = `${window.location.origin}/`;
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName.trim() || null,
            },
          },
        });

    if (error) {
      setError(error.message);
      setAwaitingEmailConfirmation(false);
    } else if (data.session?.user) {
      // Only treat as signed-in when Supabase issued a session (confirmed or confirmations off).
      onAuthSuccess(data.session.user);
      setAwaitingEmailConfirmation(false);
    } else if (!isLogin && data.user && !data.session) {
      // Email confirmation required: do not set app user — avoids dashboard before confirm.
      setAwaitingEmailConfirmation(true);
    }
    setLoading(false);
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
        <h2>
          {awaitingEmailConfirmation ? 'Check your email' : isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p>
          {awaitingEmailConfirmation
            ? `We sent a confirmation link to ${email}. Open it to finish signing up.`
            : isLogin
              ? 'Admin dashboard login'
              : 'Sign up for a new admin account'}
        </p>

        {error && <div style={{ color: '#ef4444', padding: '12px', background: '#fef2f2', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>{error}</div>}

        {awaitingEmailConfirmation ? (
          <div className="auth-form" style={{ gap: '16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              After you confirm, return here and log in.
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                setAwaitingEmailConfirmation(false);
                setIsLogin(true);
                setPassword('');
              }}
            >
              Back to log in
            </button>
          </div>
        ) : (
        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Atif Farooq"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="admin@fixmyride.ae"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        )}

        {!awaitingEmailConfirmation && (
        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
