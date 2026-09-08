import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { authAPI } from '../services/api';
import { ShieldAlert, Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('analyst@cybertrace.ai');
  const [password, setPassword] = useState('Investigator123!');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('Rahul Sharma');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await authAPI.register(name, email, password);
      }
      const data = await authAPI.login(email, password);
      login(data.access_token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col justify-between selection:bg-blue-500/20 selection:text-blue-900">
      {/* Hero Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-xs">
        <a href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="font-sans font-extrabold text-lg text-slate-900 tracking-wider">CYBERTRACE</span>
        </a>
        <a href="/" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
          ← Back to Public Site
        </a>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Product Hero Pitch */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-sans font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Digital Evidence Timeline Generator
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              From millions of events to one clear attack story.
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              CyberTrace automatically parses multi-format security logs, normalizes timestamps to UTC, extracts significant activities, and reconstructs explainable incident timelines and attack graphs.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Multi-format parser (CSV, JSON, Syslog, Web, Auth, ZIP)',
                'Deterministic Rule Engine & Isolation Forest ML Anomalies',
                'Explainable Risk Scoring & "Why is this suspicious?" analysis',
                'Automated Forensic PDF Reports & Data Exports'
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Authentication Card */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isRegister ? 'Create Investigator Account' : 'Investigator Sign In'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Access DFIR SOC timeline analysis tools</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Register' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-8 py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-medium">
        CYBERTRACE Forensic Platform
      </footer>
    </div>
  );
};
