import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Download,
  Copy,
  Check,
  RefreshCw,
  History,
  FileCode,
  Layers,
  Cpu,
  Info,
  Server
} from 'lucide-react';
import { scanApi, getReportUrl, getLiveReportUrl } from '../services/api';
import { IScanResult } from '../types';
import { RiskGauge } from '../components/RiskGauge';

export const ScanResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState<IScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'lexical' | 'domain' | 'content' | 'explainability'>('overview');

  useEffect(() => {
    async function fetchScan() {
      setLoading(true);
      setError(null);

      try {
        if (id && id !== 'live') {
          const res = await scanApi.getScanById(id);
          setScan(res.data);
        } else {
          const targetUrl = searchParams.get('url');
          if (targetUrl) {
            const res = await scanApi.analyze(targetUrl);
            setScan(res.data);
          } else {
            setError('No target URL or Scan ID provided.');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Could not load scan details');
      } finally {
        setLoading(false);
      }
    }

    fetchScan();
  }, [id, searchParams]);

  const copyResults = () => {
    if (!scan) return;
    const text = `PhishGuard AI Scan Result
URL: ${scan.original_url}
Verdict: ${scan.verdict.toUpperCase()} (Risk Score: ${scan.risk_score}/100)
Model: ${scan.model_version} (ML Probability: ${(scan.ml_probability * 100).toFixed(1)}%)
Threat Indicators: ${scan.detected_factors?.length || 0}
Timestamp: ${new Date(scan.created_at).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = () => {
    if (!scan) return;
    const scanIdentifier = scan._id || scan.scanId;
    if (scanIdentifier) {
      window.open(getReportUrl(scanIdentifier), '_blank');
    } else {
      window.open(getLiveReportUrl(scan.original_url), '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center text-slate-300">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-mono tracking-wide text-cyan-400">RUNNING MULTI-LAYER ML INSPECTION...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Scan Details Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || 'Record could not be retrieved'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-cyber-cyan"
        >
          Scan Another URL
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#080C1D] border border-cyan-500/30 shadow-2xl mb-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <RiskGauge score={scan.risk_score} verdict={scan.verdict} size={130} />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                      scan.verdict === 'phishing'
                        ? 'bg-red-500 text-white'
                        : scan.verdict === 'suspicious'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {scan.verdict}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {scan._id || scan.scanId || 'LIVE-ON-DEMAND'}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white break-all">{scan.original_url}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Scanned on {new Date(scan.created_at).toLocaleString()} • ML Engine: <span className="text-cyan-400 font-mono">{scan.model_version}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <button
                onClick={downloadPdf}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyber-cyan transition-all"
              >
                <Download className="w-4 h-4" />
                Download PDF Report
              </button>
              <button
                onClick={copyResults}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                New Scan
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                <History className="w-4 h-4 text-purple-400" />
                History
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Threat Overview', icon: Shield },
            { id: 'lexical', label: 'URL Lexical Telemetry', icon: FileCode },
            { id: 'domain', label: 'Domain & SSL', icon: Globe },
            { id: 'content', label: 'DOM Content Analysis', icon: Layers },
            { id: 'explainability', label: 'AI Explainability (SHAP)', icon: Cpu },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Detected Risk Factors */}
            <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Detected Threat Indicators ({scan.detected_factors?.length || 0})</span>
                <span className="text-xs font-mono text-slate-400">Heuristic Severity Scale</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scan.detected_factors?.map((f, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200 text-xs sm:text-sm">{f.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          f.severity === 'critical'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : f.severity === 'high'
                            ? 'bg-orange-950 text-orange-400 border border-orange-800'
                            : f.severity === 'medium'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">{f.description}</p>
                    <div className="p-2 rounded bg-black/40 font-mono text-[11px] text-cyan-300 break-all">
                      Evidence: {f.evidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Recommendations */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0C1229] to-[#070A18] border border-purple-500/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Actionable Safety Recommendations
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {scan.verdict === 'phishing' && (
                  <>
                    <li className="flex items-center gap-2 text-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <strong>DO NOT ENTER PASSWORDS:</strong> This link is verified as an active credential-harvesting trap.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Close all browser tabs connecting to this destination immediately.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      If credentials were submitted previously, reset passwords on the authentic service immediately.
                    </li>
                  </>
                )}
                {scan.verdict === 'suspicious' && (
                  <>
                    <li className="flex items-center gap-2 text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Proceed with caution: Domain displays high entropy, abnormal TLD, or redirection parameters.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Inspect the authentic address bar and ensure the root domain matches the real organization.
                    </li>
                  </>
                )}
                {scan.verdict === 'safe' && (
                  <>
                    <li className="flex items-center gap-2 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Clean baseline: The URL and domain characteristics align with authentic web services.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Always look for the HTTPS padlock and maintain two-factor authentication (2FA).
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'lexical' && (
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Syntactic URL Character Telemetry
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Total URL Length</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{scan.original_url.length} chars</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Dots Count</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{(scan.original_url.match(/\./g) || []).length}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Subdomains Depth</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{scan.domain_analysis?.subdomain ? scan.domain_analysis.subdomain.split('.').length : 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Shannon Entropy</span>
                <div className="text-xl font-bold font-mono text-purple-400 mt-1">{scan.domain_analysis?.entropy || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Suspicious TLD</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.domain_analysis?.is_suspicious_tld ? 'text-red-400' : 'text-emerald-400'}`}>
                  {scan.domain_analysis?.is_suspicious_tld ? 'YES' : 'NO'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Shortener Cloaked</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.domain_analysis?.is_shortener ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {scan.domain_analysis?.is_shortener ? 'YES' : 'NO'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Contains @ Symbol</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.original_url.includes('@') ? 'text-red-400' : 'text-emerald-400'}`}>
                  {scan.original_url.includes('@') ? 'YES' : 'NO'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Encoded Patterns</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{(scan.original_url.match(/%[0-9a-fA-F]{2}/g) || []).length}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domain' && (
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Domain & DNS Resolution
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400">Registered Domain</span>
                  <div className="text-sm font-bold text-white font-mono mt-1">{scan.domain_analysis?.domain || 'N/A'}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400">DNS Resolves</span>
                  <div className={`text-sm font-bold font-mono mt-1 ${scan.domain_analysis?.dns_resolves ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scan.domain_analysis?.dns_resolves ? 'ACTIVE' : 'NO ACTIVE RECORDS'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400">Resolved IP Addresses</span>
                  <div className="text-xs font-mono text-cyan-400 mt-1">
                    {(scan.domain_analysis?.ip_addresses || []).join(', ') || 'None'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                SSL / TLS Encryption Certificate
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400">HTTPS Protocol</span>
                  <div className={`text-sm font-bold font-mono mt-1 ${scan.ssl_analysis?.has_https ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {scan.ssl_analysis?.has_https ? 'HTTPS SECURED' : 'PLAIN HTTP (INSECURE)'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400">Certificate Issuer</span>
                  <div className="text-sm font-bold text-slate-200 mt-1">{scan.ssl_analysis?.issuer || 'N/A'}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400">Certificate Status</span>
                  <div className={`text-sm font-bold font-mono mt-1 ${scan.ssl_analysis?.is_valid ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scan.ssl_analysis?.is_valid ? 'VALID' : 'INVALID / UNTRUSTED'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Website DOM & Form Telemetry
            </h3>
            {scan.content_analysis?.error_message && (
              <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                {scan.content_analysis.error_message}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Password Fields</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.content_analysis?.has_password_field ? 'text-red-400' : 'text-slate-300'}`}>
                  {scan.content_analysis?.has_password_field ? 'DETECTED' : 'NONE'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">External Form Actions</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.content_analysis?.external_form_action ? 'text-red-400' : 'text-emerald-400'}`}>
                  {scan.content_analysis?.external_form_action ? 'FLAGGED' : 'CLEAN'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Suspicious Iframes</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.content_analysis?.suspicious_iframes_count ? 'text-red-400' : 'text-emerald-400'}`}>
                  {scan.content_analysis?.suspicious_iframes_count || 0}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Hidden DOM Elements</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {scan.content_analysis?.hidden_elements_count || 0}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Anti-Inspection Scripts</span>
                <div className={`text-xl font-bold font-mono mt-1 ${scan.content_analysis?.disabled_right_click ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {scan.content_analysis?.disabled_right_click ? 'RIGHT-CLICK DISABLED' : 'NORMAL'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">HTTP Status Code</span>
                <div className="text-xl font-bold font-mono text-slate-300 mt-1">
                  {scan.content_analysis?.status_code || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'explainability' && (
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Machine Learning Prediction Attribution
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Relative feature attribution (SHAP-style) demonstrating which specific signals caused the model to classify this URL as {scan.ml_prediction}.
              </p>

              <div className="space-y-3">
                {scan.feature_contributions && scan.feature_contributions.length > 0 ? (
                  scan.feature_contributions.map((fc, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-200 capitalize">{fc.feature.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-cyan-400 font-mono">{(fc.impact * 100).toFixed(1)}% Weight</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, fc.impact * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/50 text-xs text-slate-400">
                    Feature importances computed using global model coefficients ({scan.model_version}).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
