import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Layers, Cpu, LogIn, LogOut, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout, openAuthModal } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#050814]/85 border-b border-cyber-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-500/40 group-hover:border-cyan-400 group-hover:shadow-cyber-cyan transition-all duration-300">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                PhishGuard <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-wider font-mono">AUTOMATED DEFENSE</p>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Scanner
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              Dashboard
            </Link>

            <Link
              to="/bulk"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/bulk')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              Bulk Scanner
            </Link>

            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              Admin & ML {isAdmin && <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40 font-mono">STAFF</span>}
            </Link>
          </div>

          {/* User profile / Auth buttons */}
          <div className="flex items-center gap-3">
            <a
              href="#extension-section"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded-md hover:bg-cyan-900/40 transition-colors"
            >
              <Chrome className="w-3.5 h-3.5 text-cyan-400" />
              Chrome Ext V3
            </a>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-200">{user.full_name}</div>
                  <div className="text-[10px] font-mono text-cyan-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-1.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-lg shadow-cyber-cyan transition-all"
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
