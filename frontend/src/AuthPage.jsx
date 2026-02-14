import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import './index.css';

const AuthPage = ({ mode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, bypassLogin } = useAuth();
  const navigate = useNavigate();

  const toggleMode = () => setIsLogin(!isLogin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await login(username, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } else {
      // Sign up logic (not implemented in MVP backend yet)
      setError("Sign up is restricted in this demo. Please use Login or ask admin.");
    }
    setLoading(false);
  };

  const handleBypass = async () => {
    setLoading(true);
    const result = await bypassLogin();
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError("Bypass failed. Check backend.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] flex items-center justify-center relative overflow-hidden p-6">

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-[#ff9f43] rounded-full blur-[120px] opacity-10 top-[-100px] left-[-100px] animate-float" />
        <div className="absolute w-[400px] h-[400px] bg-[#ff6b35] rounded-full blur-[100px] opacity-10 bottom-[-50px] right-[-50px] animate-float" style={{ animationDelay: '2s' }} />
      </div>
      <div className="grain-overlay" />

      {/* Auth Card */}
      <div className="glass-card w-full max-w-md p-8 md:p-10 rounded-3xl relative z-10 border border-[#ff9f43]/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold gradient-text inline-block mb-2">Helper</Link>
          <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-[#a89d94] text-sm">
            {isLogin ? 'Enter your details to access your workspace.' : 'Start your 14-day free trial today.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm text-center border border-red-500/30">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#a89d94] ml-1">Business Name</label>
              <input
                type="text"
                placeholder="e.g. Sharma Traders"
                className="w-full bg-[#1a0f0a]/60 border border-[#ff9f43]/20 rounded-xl px-4 py-3 text-[#f5f3f0] focus:outline-none focus:border-[#ff9f43] focus:ring-1 focus:ring-[#ff9f43] transition-all placeholder-[#a89d94]/50"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#a89d94] ml-1">Username / Email</label>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a0f0a]/60 border border-[#ff9f43]/20 rounded-xl px-4 py-3 text-[#f5f3f0] focus:outline-none focus:border-[#ff9f43] focus:ring-1 focus:ring-[#ff9f43] transition-all placeholder-[#a89d94]/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#a89d94] ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a0f0a]/60 border border-[#ff9f43]/20 rounded-xl px-4 py-3 text-[#f5f3f0] focus:outline-none focus:border-[#ff9f43] focus:ring-1 focus:ring-[#ff9f43] transition-all placeholder-[#a89d94]/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff9f43] text-[#0a0808] font-bold text-lg py-3.5 rounded-xl hover:bg-[#ffb366] transition-all hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,159,67,0.3)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Start Free Trial')}
          </button>
        </form>

        {/* Bypass Button */}
        {isLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={handleBypass}
              type="button"
              className="text-xs text-[#ff9f43]/70 hover:text-[#ff9f43] underline transition-colors"
            >
              rocket_launch Dev Bypass (Instant Login)
            </button>
          </div>
        )}

        {/* Toggle */}
        <div className="mt-8 text-center">
          <p className="text-[#a89d94] text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={toggleMode} className="text-[#ff9f43] font-semibold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
