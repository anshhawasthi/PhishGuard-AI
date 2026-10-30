import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, Mail, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthModalOpen, closeAuthModal, authMode, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(authMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setMode(authMode);
    setError(null);
  }, [authMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else {
        if (!fullName.trim()) {
          setError('Please provide your full name');
          setSubmitting(false);
          return;
        }
        await register(fullName, email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      if (msg === 'Network Error' || !err.response) {
        setError('Cannot reach backend server. If using Render free tier, please allow ~30 seconds for it to wake up.');
      } else {
        setError(msg || 'Authentication failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@phishguard.ai');
    setPassword('Admin@PhishGuard2026!');
    setMode('login');
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#090D1A] border border-cyan-500/30 rounded-2xl shadow-2xl p-7 text-slate-100 overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {mode === 'login' ? 'Sign in to PhishGuard' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Access your saved scan history and threat analytics'
                  : 'Start protecting your workflow with AI-driven threat intelligence'}
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#050814] p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full bg-[#050814] border border-slate-800 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@security.org"
                  className="w-full bg-[#050814] border border-slate-800 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#050814] border border-slate-800 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold text-xs shadow-cyber-cyan transition-all disabled:opacity-50"
            >
              {submitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Authenticate & Continue'
                : 'Create PhishGuard Account'}
            </button>
          </form>

          {/* Viva demo quick-fill helper */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Demo Admin Credentials (Viva Presentation)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
