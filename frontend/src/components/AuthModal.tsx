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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white dark:bg-[#090D1A] border border-slate-200 dark:border-cyan-500/30 rounded-2xl shadow-2xl p-7 text-slate-900 dark:text-slate-100 overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Sign in to PhishGuard' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Access your saved scan history and threat analytics'
                  : 'Start protecting your workflow with AI-driven threat intelligence'}
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 dark:bg-[#050814] p-1 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ansh Awasthi"
                    className="w-full bg-slate-50 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 focus:border-blue-500 dark:focus:border-cyan-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@phishguard.ai"
                  required
                  className="w-full bg-slate-50 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 focus:border-blue-500 dark:focus:border-cyan-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-50 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 focus:border-blue-500 dark:focus:border-cyan-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 rounded-xl text-red-600 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-sky-400 dark:hover:from-cyan-300 dark:hover:to-sky-300 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md dark:shadow-cyber-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Authenticating...' : 'Creating Account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In to Dashboard' : 'Register & Continue'
              )}
            </button>
          </form>

          {/* Quick Admin fill for viva evaluation */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Project Evaluator / Demo:</span>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:underline font-mono"
            >
              <Sparkles className="w-3 h-3" /> Auto-fill Admin
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
