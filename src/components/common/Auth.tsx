import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Auth = ({ onAuthSuccess }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      onAuthSuccess(data.user);
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
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{isLogin ? 'Admin dashboard login' : 'Sign up for a new admin account'}</p>

        {error && <div style={{ color: '#ef4444', padding: '12px', background: '#fef2f2', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>{error}</div>}

        <form onSubmit={handleAuth} className="auth-form">
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

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
