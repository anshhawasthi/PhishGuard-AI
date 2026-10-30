import React from 'react';
import { Shield, Lock, Terminal, Github, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#030611] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white tracking-wide">PhishGuard AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Final-Year B.Tech Major Project in Cybersecurity & Artificial Intelligence. Multi-layer URL lexical analysis, host domain telemetry, and Machine Learning classification.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Detection Engine Active
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">ML Algorithms</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="hover:text-cyan-400 transition-colors">Gradient Boosted Decision Trees</li>
              <li className="hover:text-cyan-400 transition-colors">Random Forest Ensemble</li>
              <li className="hover:text-cyan-400 transition-colors">CART Decision Tree Classifier</li>
              <li className="hover:text-cyan-400 transition-colors">Binary Logistic Regression</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Threat Intelligence</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>PhishTank Active Feeds</li>
              <li>OpenPhish Zero-Day Intelligence</li>
              <li>Tranco Top 1M Verified Domains</li>
              <li>Google Safe Browsing Telemetry</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Architecture & Specs</h4>
            <p className="text-[11px] leading-relaxed">
              Strict SSRF Protection, Manifest V3 Browser Extension, MongoDB Vector Storage, and Explainable AI (XAI) feature attribution.
            </p>
            <div className="pt-2 flex items-center gap-3 text-slate-300">
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Lock className="w-3 h-3 text-purple-400" /> JWT Auth
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Terminal className="w-3 h-3 text-cyan-400" /> REST API
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 PhishGuard AI. Automated Phishing Website Detection System. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
            Engineered for Final-Year B.Tech Viva & Academic Demonstration
          </div>
        </div>
      </div>
    </footer>
  );
};
