import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Users,
  Database,
  Upload,
  Play,
  CheckCircle,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  BarChart2,
  Lock,
  RefreshCw
} from 'lucide-react';
import { adminApi, dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { IModelPerformance, IUser } from '../types';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [models, setModels] = useState<IModelPerformance[]>([]);
  const [activeModel, setActiveModel] = useState<string>('');
  const [training, setTraining] = useState(false);
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [datasetType, setDatasetType] = useState('mixed');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  async function loadAdminData() {
    try {
      const [statsRes, usersRes, modelsRes, activityRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getModelPerformance(),
        dashboardApi.getActivity(),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setModels(modelsRes.data.models || []);
      setActiveModel(modelsRes.data.activeModel || '');
      setActivityLogs(activityRes.data.activity || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    }
  }

  const handleTrainModels = async () => {
    setTraining(true);
    setNotification(null);
    try {
      const res = await adminApi.trainModels();
      setModels(res.data.models);
      setActiveModel(res.data.activeModel);
      setNotification({
        type: 'success',
        text: 'All 4 Machine Learning models retrained and cross-evaluated successfully.',
      });
      loadAdminData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Model training failed',
      });
    } finally {
      setTraining(false);
    }
  };

  const handleActivateModel = async (modelName: string) => {
    try {
      await adminApi.activateModel(modelName);
      setActiveModel(modelName);
      setNotification({
        type: 'success',
        text: `Active model switched to ${modelName}`,
      });
      loadAdminData();
    } catch (err: any) {
      alert(`Could not activate model: ${err.message}`);
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      await adminApi.toggleUser(userId);
      loadAdminData();
    } catch (err: any) {
      alert(`User update failed: ${err.message}`);
    }
  };

  const handleDatasetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetFile) return;

    setUploadingDataset(true);
    setNotification(null);
    try {
      const res = await adminApi.uploadDataset(datasetFile, datasetName || datasetFile.name, datasetType);
      setNotification({
        type: 'success',
        text: `Dataset uploaded: ${res.data.records_imported} samples imported.`,
      });
      setDatasetFile(null);
      setDatasetName('');
      loadAdminData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Dataset upload failed',
      });
    } finally {
      setUploadingDataset(false);
    }
  };

  // If not authenticated as Admin, display prompt
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Administrator Authorization Required</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">
          Access to machine learning model benchmarks, training triggers, dataset uploads, and user privileges requires staff admin credentials.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-cyber-cyan"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-7 h-7 text-purple-400" />
              Machine Learning & Admin Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active model tuning, dataset ingestion, and live multi-classifier benchmarking
            </p>
          </div>

          <button
            onClick={handleTrainModels}
            disabled={training}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-cyber-purple transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Training All 4 Models...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Train & Benchmark All Models
              </>
            )}
          </button>
        </div>

        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border border-red-500/40 text-red-300'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Section: Model Performance Benchmark Table (Section 6 & Slide 8) */}
        <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                Machine Learning Algorithms Benchmark Comparison
              </h3>
              <p className="text-xs text-slate-400">
                Independent evaluation on unseen test split (Accuracy, Precision, Recall, F1-Score, ROC-AUC)
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-lg">
              Active: <strong className="text-white">{activeModel || 'Gradient Boosted Trees'}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050814] text-slate-400 uppercase text-[10px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">Algorithm / Model</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Precision</th>
                  <th className="py-3 px-3">Recall</th>
                  <th className="py-3 px-3">F1-Score</th>
                  <th className="py-3 px-3">AUC-ROC</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {models.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No model benchmark data loaded. Click "Train & Benchmark All Models" above to run training.
                    </td>
                  </tr>
                ) : (
                  models.map((m, idx) => {
                    const isCurrent = m.model_name === activeModel;
                    return (
                      <tr key={idx} className={isCurrent ? 'bg-cyan-950/20' : 'hover:bg-slate-900/30'}>
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Cpu className={`w-4 h-4 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                          {m.model_name}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-emerald-400">
                          {(m.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {(m.precision * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {(m.recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-purple-400">
                          {(m.f1_score * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 font-mono text-cyan-400 font-bold">
                          {m.auc_score.toFixed(3)}
                        </td>
                        <td className="py-3 px-3">
                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                              ACTIVE ENGINE
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Standby</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleActivateModel(m.model_name)}
                            disabled={isCurrent}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                              isCurrent
                                ? 'bg-slate-800 text-slate-500 cursor-default'
                                : 'bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30'
                            }`}
                          >
                            {isCurrent ? 'Active' : 'Deploy Model'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two-Column Section: Dataset Upload & User Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dataset Upload */}
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                Ingest Training Dataset (CSV)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Upload URL datasets from PhishTank, OpenPhish, or Kaggle with <code className="text-cyan-300 font-mono">url,label</code> headers.
              </p>

              <form onSubmit={handleDatasetUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dataset Name</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g. PhishTank_Verified_Oct2026"
                    className="w-full bg-[#050814] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dataset Classification Type</label>
                  <select
                    value={datasetType}
                    onChange={(e) => setDatasetType(e.target.value)}
                    className="w-full bg-[#050814] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="mixed">Mixed (Phishing & Legitimate)</option>
                    <option value="phishing">Phishing URLs Only</option>
                    <option value="legitimate">Legitimate URLs Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setDatasetFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingDataset || !datasetFile}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-cyber-cyan transition-all disabled:opacity-50"
                >
                  {uploadingDataset ? 'Parsing & Ingesting Dataset...' : 'Import Dataset to MongoDB'}
                </button>
              </form>
            </div>
          </div>

          {/* User Management */}
          <div className="p-6 rounded-2xl bg-[#080C1D] border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              User Access & Roles ({users.length})
            </h3>
            <p className="text-xs text-slate-400 mb-4">Registered accounts in MongoDB users collection</p>

            <div className="overflow-y-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#050814] text-slate-400 font-mono text-[10px] uppercase border-y border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{u.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${u.role === 'admin' ? 'bg-purple-950 text-purple-300' : 'bg-slate-800 text-slate-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-semibold ${u.is_active !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                          {u.is_active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
