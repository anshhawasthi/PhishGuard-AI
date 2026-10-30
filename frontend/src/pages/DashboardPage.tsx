import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Trash2,
  Eye,
  FileText,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Download
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { dashboardApi, scanApi, getReportUrl } from '../services/api';
import { IDashboardStats, IScanResult } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [scans, setScans] = useState<IScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVerdict, setFilterVerdict] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickUrl, setQuickUrl] = useState<string>('');
  const [quickScanning, setQuickScanning] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [filterVerdict, searchQuery]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [statsRes, scansRes] = await Promise.all([
        dashboardApi.getStats(),
        scanApi.getScans({
          limit: 15,
          verdict: filterVerdict || undefined,
          search: searchQuery || undefined,
        }),
      ]);

      setStats(statsRes.data);
      setScans(scansRes.data.scans || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    setQuickScanning(true);
    try {
      const res = await scanApi.analyze(quickUrl.trim());
      setQuickUrl('');
      navigate(res.data.scanId ? `/scans/${res.data.scanId}` : `/scans/live?url=${encodeURIComponent(quickUrl.trim())}`);
    } catch (err: any) {
      alert(`Scan failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setQuickScanning(false);
    }
  };

  const handleDeleteScan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scan record?')) return;
    try {
      await scanApi.deleteScan(id);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Failed to delete scan: ${err.message}`);
    }
  };

  const threatData = stats?.threat_distribution || [
    { name: 'Safe', value: 98, color: '#10B981' },
    { name: 'Suspicious', value: 26, color: '#F59E0B' },
    { name: 'Phishing', value: 18, color: '#EF4444' },
  ];

  const activityData = stats?.daily_activity || [];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-cyan-400" />
              Security Telemetry Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live database records, threat distribution, and multi-layer scan history
            </p>
          </div>

          {/* Quick Scan bar */}
          <form onSubmit={handleQuickScan} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="Quick URL Scan..."
              className="w-full sm:w-72 bg-[#090D1C] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={quickScanning}
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-bold text-xs rounded-xl shadow-cyber-cyan transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
            >
              {quickScanning ? 'Scanning...' : 'Scan'}
            </button>
          </form>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-[#080C1D] border border-slate-800 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>TOTAL URLS SCANNED</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-white mt-3">
              {stats?.total_scans ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400">Database verified</span> records
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#080C1D] border border-slate-800 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>SAFE WEBSITES</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-3">
              {stats?.safe_scans ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Nominal baseline checks passed</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#080C1D] border border-slate-800 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>SUSPICIOUS WEBSITES</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-400 mt-3">
              {stats?.suspicious_scans ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Anomalous indicators detected</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#080C1D] border border-slate-800 hover:border-red-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>PHISHING NEUTRALIZED</span>
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-red-400 mt-3">
              {stats?.phishing_scans ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">High-confidence attack blocks</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanning Activity Graph */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Weekly Scanning Frequency
                </h3>
                <p className="text-xs text-slate-400">Total requests and detected phishing vectors over time</p>
              </div>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="phishGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090D1C', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scans"
                    stroke="#00F0FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scansGradient)"
                    name="Total Scans"
                  />
                  <Area
                    type="monotone"
                    dataKey="phishing"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#phishGradient)"
                    name="Phishing Threats"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Threat Distribution Donut */}
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                Threat Breakdown
              </h3>
              <p className="text-xs text-slate-400 mb-4">Classified traffic ratio</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {threatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090D1C', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4">
              {threatData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">{item.value} URLs</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scan Records Table */}
        <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Scan History & Evidence Records</h3>
              <p className="text-xs text-slate-400">Stored scan records from MongoDB</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by URL..."
                  className="w-full bg-[#050814] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
                />
              </div>

              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value)}
                className="bg-[#050814] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none"
              >
                <option value="">All Verdicts</option>
                <option value="safe">Safe Only</option>
                <option value="suspicious">Suspicious</option>
                <option value="phishing">Phishing</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050814] text-slate-400 font-mono text-[11px] uppercase border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">Analyzed URL</th>
                  <th className="py-3 px-3">Verdict</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 px-3">Factors</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No matching scans found in MongoDB collection.
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => (
                    <tr key={scan._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-300 max-w-xs truncate" title={scan.original_url}>
                        {scan.original_url}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            scan.verdict === 'phishing'
                              ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                              : scan.verdict === 'suspicious'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          }`}
                        >
                          {scan.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            scan.risk_score >= 65
                              ? 'text-red-400'
                              : scan.risk_score >= 30
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {scan.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {scan.detected_factors?.length || 0}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400">
                        {scan.model_version}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/scans/${scan._id}`)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="View Full Telemetry"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={getReportUrl(scan._id || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => scan._id && handleDeleteScan(scan._id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
