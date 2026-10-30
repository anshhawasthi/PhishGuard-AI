import React, { useState } from 'react';
import {
  Layers,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Play,
  RotateCcw,
  ExternalLink,
  Shield
} from 'lucide-react';
import { scanApi } from '../services/api';
import { IScanResult } from '../types';

export const BulkScanPage: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [textUrls, setTextUrls] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<IScanResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; safe: number; suspicious: number; phishing: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBulkScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults([]);
    setSummary(null);

    const urlsFromText = textUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (!csvFile && urlsFromText.length === 0) {
      setError('Please provide URLs via CSV upload or paste them in the text box.');
      return;
    }

    setScanning(true);
    setProgress(20);

    try {
      let response;
      if (csvFile) {
        setProgress(40);
        response = await scanApi.bulkScanFile(csvFile);
      } else {
        setProgress(50);
        response = await scanApi.bulkScanUrls(urlsFromText);
      }

      setProgress(100);
      setSummary({
        total: response.data.total,
        safe: response.data.safe_count,
        suspicious: response.data.suspicious_count,
        phishing: response.data.phishing_count,
      });
      setResults(response.data.results || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Bulk scan execution failed');
    } finally {
      setScanning(false);
    }
  };

  const exportResultsCsv = () => {
    if (results.length === 0) return;
    const header = 'URL,Verdict,Risk Score,ML Probability,Model\n';
    const rows = results
      .map(
        (r) =>
          `"${r.original_url}",${r.verdict},${r.risk_score},${(r.ml_probability * 100).toFixed(1)}%,${r.model_version}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PhishGuard_Bulk_Scan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050814] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-blue-600 dark:text-sky-400" />
            Bulk URL Threat Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Perform high-throughput automated phishing audits across batch lists or CSV datasets.
          </p>
        </div>

        {/* Input Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#080C1D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <form onSubmit={handleBulkScan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: CSV Upload */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    Option 1: Upload CSV File
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    CSV should contain a column titled <code className="text-blue-600 dark:text-cyan-300 font-mono font-semibold">url</code>.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-cyan-400 hover:file:bg-slate-300 dark:hover:file:bg-slate-700 cursor-pointer"
                  />
                  {csvFile && (
                    <div className="mt-2 text-xs font-mono text-blue-600 dark:text-cyan-300">
                      Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              {/* Option B: Direct URL Textarea */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-purple-400" />
                    Option 2: Paste List of URLs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Enter one URL per line (up to 100 per batch).
                  </p>
                </div>

                <textarea
                  rows={4}
                  value={textUrls}
                  onChange={(e) => setTextUrls(e.target.value)}
                  placeholder="https://google.com&#10;http://paypal-security-update.account-verification.ga/login.php&#10;https://github.com"
                  className="w-full bg-white dark:bg-[#050814] border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 font-mono outline-none focus:border-blue-500 dark:focus:border-cyan-400"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-red-950/40 border border-rose-200 dark:border-red-500/40 text-rose-700 dark:text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={scanning}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-sky-400 dark:to-cyan-400 dark:hover:from-sky-300 dark:hover:to-cyan-300 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-sm dark:shadow-cyber-cyan transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Auditing Batch URLs ({progress}%)...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Bulk Analysis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#080C1D] border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Tested</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{summary.total}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#080C1D] border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Legitimate</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{summary.safe}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#080C1D] border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Suspicious</span>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{summary.suspicious}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#080C1D] border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Phishing Attacks</span>
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-red-400 mt-1">{summary.phishing}</div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#080C1D] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Scan Telemetry Results ({results.length})</h3>
              <button
                onClick={exportResultsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-cyan-400 font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV Results
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#050814] text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-y border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Target URL</th>
                    <th className="py-2.5 px-3">Verdict</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">ML Prob</th>
                    <th className="py-2.5 px-3">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-cyan-300 max-w-sm truncate" title={r.original_url}>
                        {r.original_url}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.verdict === 'phishing'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                              : r.verdict === 'suspicious'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                          }`}
                        >
                          {r.verdict}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={r.risk_score >= 65 ? 'text-rose-600 dark:text-red-400' : r.risk_score >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {r.risk_score}/100
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {(r.ml_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {r.model_version}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
