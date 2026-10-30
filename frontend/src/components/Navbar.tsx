import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Layers, Cpu, LogIn, LogOut, Chrome, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#050814]/85 border-b border-slate-200 dark:border-cyber-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-purple-600/30 border border-blue-200 dark:border-cyan-500/40 group-hover:border-blue-500 dark:group-hover:border-cyan-400 group-hover:shadow-md dark:group-hover:shadow-cyber-cyan transition-all duration-300">
              <Shield className="w-5 h-5 text-blue-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-sky-300 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
                PhishGuard <span className="text-blue-600 dark:text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30">AI</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider font-mono">AUTOMATED DEFENSE</p>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/')
                  ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              Scanner
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/dashboard')
                  ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-500 dark:text-purple-400" />
              Dashboard
            </Link>

            <Link
              to="/bulk"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/bulk')
                  ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              Bulk Scanner
            </Link>

            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Admin & ML {isAdmin && <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 font-mono">STAFF</span>}
            </Link>
          </div>

          {/* User profile / Theme Toggle / Auth buttons */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button (Light ☀️ / Dark 🌙) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center shadow-xs"
              title={theme === 'light' ? 'Switch to Cyberpunk Dark Mode (🌙)' : 'Switch to Clean Light Theme (☀️)'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700 hover:text-blue-600 transition-colors" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
              )}
            </button>

            <a
              href="#extension-section"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-800/50 rounded-md hover:bg-blue-100 dark:hover:bg-cyan-900/40 transition-colors"
            >
              <Chrome className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              Chrome Ext V3
            </a>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.full_name}</div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-1.5 text-sm font-semibold text-white dark:text-slate-950 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-sky-400 dark:hover:from-cyan-300 dark:hover:to-sky-300 rounded-lg shadow-sm dark:shadow-cyber-cyan transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
