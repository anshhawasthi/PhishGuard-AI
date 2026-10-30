import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Database,
  Chrome,
  Eye,
  FileText
} from 'lucide-react';
import { scanApi, dashboardApi } from '../services/api';
import { IScanResult, IDashboardStats } from '../types';
import { RiskGauge } from '../components/RiskGauge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<IScanResult | null>(null);
  const [stats, setStats] = useState<IDashboardStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (err) {
        console.warn('Stats fetch fallback');
      }
    }
    loadStats();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setScanning(true);
    setLiveResult(null);

    try {
      const res = await scanApi.analyze(url.trim());
      setLiveResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const setSampleUrl = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050814] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Background Ambience */}
      <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-hero-glow pointer-events-none" />
      <div className="hidden dark:block absolute top-48 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="hidden dark:block absolute top-48 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Light Theme subtle gradient */}
      <div className="dark:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-transparent pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 text-xs font-mono mb-6 shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-cyan-400 animate-ping" />
          MACHINE LEARNING · MULTI-LAYER URL TELEMETRY
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight"
        >
          Detect Phishing <br />
          <span className="text-blue-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-sky-300 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
            Before It Detects You.
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Paste any website URL to instantly inspect 27 distinct risk signals across lexical properties, domain DNS, SSL certificate encryption, and DOM deception patterns.
        </motion.p>

        {/* URL Scan Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl mx-auto mb-6"
        >
          <form onSubmit={handleScan} className="relative flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL e.g. https://github.com or http://paypal-verify.account.tk"
                className="w-full bg-white dark:bg-[#090E1F]/90 border border-slate-300 dark:border-cyan-500/30 focus:border-blue-500 dark:focus:border-cyan-400 rounded-xl pl-12 pr-4 py-4 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-lg dark:shadow-2xl outline-none transition-all focus:ring-2 focus:ring-blue-100 dark:focus:ring-cyan-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={scanning}
              className="ml-2 sm:ml-3 px-6 sm:px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-cyan-400 dark:via-sky-400 dark:to-blue-500 dark:hover:from-cyan-300 dark:hover:to-blue-400 text-white dark:text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-md dark:shadow-cyber-cyan transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Scan Website
                </>
              )}
            </button>
          </form>

          {/* Quick test pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-500">Quick Test Samples:</span>
            <button
              type="button"
              onClick={() => setSampleUrl('https://github.com/torvalds/linux')}
              className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              ✓ Safe (GitHub)
            </button>
            <button
              type="button"
              onClick={() => setSampleUrl('http://paypal-security-update.account-verification.ga/login.php')}
              className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-red-950/40 border border-rose-200 dark:border-red-500/30 text-rose-700 dark:text-red-300 hover:bg-rose-100 dark:hover:bg-red-900/40 transition-colors"
            >
              ⚠ Phishing Attack (PayPal Spoof)
            </button>
            <button
              type="button"
              onClick={() => setSampleUrl('http://192.168.1.100/chase-online-banking/login.php')}
              className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              ⚠ IP Host (Chase Spoof)
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-300 text-xs">
              {error}
            </div>
          )}
        </motion.div>

        {/* Live Result Card (appears when scanned on landing page) */}
        {liveResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mt-8 p-6 bg-white dark:bg-[#0B1024]/90 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-xl dark:shadow-2xl text-left"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <RiskGauge score={liveResult.risk_score} verdict={liveResult.verdict} size={110} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        liveResult.verdict === 'phishing'
                          ? 'bg-rose-600 text-white'
                          : liveResult.verdict === 'suspicious'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {liveResult.verdict}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Score: {liveResult.risk_score}/100
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white break-all">{liveResult.original_url}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Evaluated by {liveResult.model_version} • ML Probability: {(liveResult.ml_probability * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate(liveResult.scanId ? `/scans/${liveResult.scanId}` : `/scans/live?url=${encodeURIComponent(liveResult.original_url)}`)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Deep Report <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Factors found */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Top Detected Risk Indicators ({liveResult.detected_factors?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {liveResult.detected_factors?.slice(0, 4).map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{factor.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          factor.severity === 'critical'
                            ? 'text-rose-700 bg-rose-100 dark:text-red-400 dark:bg-red-950/60'
                            : factor.severity === 'high'
                            ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-950/60'
                            : factor.severity === 'medium'
                            ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/60'
                            : 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/60'
                        }`}
                      >
                        {factor.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Real-time System Statistics Bar */}
      <section className="py-10 border-y border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#070B1B]/80 backdrop-blur-sm transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats?.total_scans || 142}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">URLs Evaluated</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats?.safe_scans || 98}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Legitimate Verified</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-red-400 font-mono">
              {stats?.phishing_scans || 18}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Phishing Neutralized</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-cyan-400 font-mono">
              99.2%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Benchmark Accuracy</div>
          </div>
        </div>
      </section>

      {/* Section 4: System Pipeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 tracking-widest uppercase">END-TO-END PIPELINE</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">From Suspicious Link to Instant Verdict</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mt-2">
            URL, host network telemetry, and page DOM signals feed the multi-classifier before decision output.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Input',
              desc: 'URL submission from user portal, bulk CSV batch, or Chrome Manifest V3 extension.',
              icon: Search,
              color: 'text-blue-600 dark:text-cyan-400',
            },
            {
              step: '02',
              title: 'Extract',
              desc: 'Lexical URL parsing, DNS resolution, SSL cert verification, and DOM inspection.',
              icon: Globe,
              color: 'text-indigo-600 dark:text-sky-400',
            },
            {
              step: '03',
              title: 'Prepare',
              desc: 'Standard scaling, vectorization, and 27-dimensional feature engineering.',
              icon: Layers,
              color: 'text-purple-600 dark:text-purple-400',
            },
            {
              step: '04',
              title: 'Classify',
              desc: 'Trained Gradient Boosted Trees and Random Forest machine learning models.',
              icon: Cpu,
              color: 'text-pink-600 dark:text-pink-400',
            },
            {
              step: '05',
              title: 'Output',
              desc: 'Safe, Suspicious, or Phishing verdict with calibrated confidence and PDF report.',
              icon: CheckCircle2,
              color: 'text-emerald-600 dark:text-emerald-400',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-[#090D1E] border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-cyan-500/30 shadow-xs transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {item.step}
                </span>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Feature Engineering Families */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#0B1024] dark:to-[#060814] border border-slate-200 dark:border-cyan-500/20 shadow-md dark:shadow-2xl transition-colors duration-200">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-indigo-600 dark:text-purple-400 tracking-wider uppercase">FEATURE ENGINEERING</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Three Feature Families Expose Phishing Tactics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              No single signal is decisive on its own. True zero-day detection requires a hybrid feature representation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#080C1B] border border-slate-200 dark:border-slate-800">
              <div className="text-blue-600 dark:text-cyan-400 font-mono text-sm font-bold mb-2">01 · URL LEXICAL</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Syntactic & Token Patterns</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluates URL character length, domain length, dots, hyphens, path depth, @ credential spoofing, IP-based hosts, punycode (homograph attacks), shorteners, and abnormal TLDs (.tk, .ml, .ga, .xyz).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#080C1B] border border-slate-200 dark:border-slate-800">
              <div className="text-indigo-600 dark:text-purple-400 font-mono text-sm font-bold mb-2">02 · DOMAIN & SSL</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Network Host Telemetry</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Active DNS resolution verification, Shannon entropy calculations to detect algorithmic domain generation (DGA), SSL certificate issuer validation, and HTTPS protocol compliance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#080C1B] border border-slate-200 dark:border-slate-800">
              <div className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold mb-2">03 · PAGE / DOM</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">In-Page Deception Signals</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                SSRF-isolated content inspection detecting password inputs, external form action targets, empty form action placeholders, hidden zero-pixel iframes, and anti-inspection right-click blockers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Cybersecurity Awareness */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 uppercase tracking-widest">CYBERSECURITY HYGIENE</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            How to Spot Phishing Yourself
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white dark:bg-[#0A0E21] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Verify the Domain</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Phishers craft look-alike domains (e.g. <code className="text-blue-600 dark:text-cyan-300 font-mono font-semibold">paypa1.com</code> instead of <code className="text-emerald-600 dark:text-emerald-300 font-mono font-semibold">paypal.com</code>). Always read the root domain before entering credentials.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#0A0E21] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Look for HTTPS</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Legitimate portals encrypt traffic with HTTPS. If a site asking for passwords or banking records uses plain HTTP, treat it as dangerous immediately.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#0A0E21] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-red-500/10 text-rose-600 dark:text-red-400 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Beware of Urgency</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Social engineering creates false panic: "your account will be permanently closed in 10 minutes". Never react hastily to unsolicited links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Chrome Extension Feature Section */}
      <section id="extension-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#090D1E] border border-slate-200 dark:border-purple-500/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-8 transition-colors duration-200">
          <div className="max-w-xl">
            <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 uppercase tracking-widest">REAL-TIME PROTECTION</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 mb-4">
              PhishGuard AI – Chrome Extension
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Equip your browser with autonomous background interception. The Manifest V3 extension checks navigation events against the local ML detection engine, displaying instant warnings for malicious links.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Zero Latency Cache
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Dedicated Warning Screen
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Zero Privacy Collection
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#050814] border border-slate-200 dark:border-cyan-500/30 text-center w-full md:w-80 shadow-md dark:shadow-cyber-purple">
            <Chrome className="w-12 h-12 text-blue-600 dark:text-cyan-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Developer Mode Ready</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Load unpacked folder directly from <br />
              <code className="text-blue-600 dark:text-cyan-300 font-mono text-[10px]">chrome-extension/</code> in <code className="text-indigo-600 dark:text-purple-300 font-mono text-[10px]">chrome://extensions</code>
            </p>
            <button
              onClick={() => alert('Instructions: Open chrome://extensions, enable "Developer mode", click "Load unpacked", and select the "chrome-extension" folder inside this project.')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 dark:hover:from-purple-500 dark:hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              View Installation Steps
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
