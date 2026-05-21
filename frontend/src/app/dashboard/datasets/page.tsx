"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Database, Upload, Trash2, FileText, Search,
  Plus, X, AlertCircle, CheckCircle2, FileJson,
  FileSpreadsheet, File, ChevronDown, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Dataset {
  id: number;
  name: string;
  description: string;
  file_type: string;
  size_bytes: number;
  row_count: number;
  created_at: string;
  local?: boolean;
  preview?: string[][];  // first few rows
}

const DATASETS_KEY = 'local_datasets';

function loadLocal(): Dataset[] {
  try { return JSON.parse(localStorage.getItem(DATASETS_KEY) || '[]'); } catch { return []; }
}
function saveLocal(datasets: Dataset[]) {
  localStorage.setItem(DATASETS_KEY, JSON.stringify(datasets));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileIcon(type: string) {
  if (type === 'json') return <FileJson className="w-6 h-6" />;
  if (type === 'csv')  return <FileSpreadsheet className="w-6 h-6" />;
  return <File className="w-6 h-6" />;
}

function fileTypeColor(type: string): React.CSSProperties {
  if (type === 'csv')  return { color: 'var(--md-success)', background: 'var(--md-success-cont)' };
  if (type === 'json') return { color: 'var(--md-primary)', background: 'var(--md-primary-container)' };
  return { color: 'var(--md-warning)', background: 'var(--md-warning-cont)' };
}

// Estimate row count from raw text
function estimateRows(text: string, type: string): number {
  if (type === 'csv') return Math.max(0, text.split('\n').filter(l => l.trim()).length - 1);
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
  } catch { return Math.floor(text.split('\n').filter(l => l.trim()).length); }
}

// Parse first N rows for preview
function parsePreview(text: string, type: string): string[][] {
  if (type === 'csv') {
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 6);
    return lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '').slice(0, 30)));
  }
  try {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed.slice(0, 5) : [parsed];
    if (rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    return [keys, ...rows.map(r => keys.map(k => String(r[k] ?? '').slice(0, 30)))];
  } catch { return []; }
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);

  // Upload form
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDatasets(); }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/datasets/');
      setDatasets([...response.data, ...loadLocal()]);
    } catch (err: any) {
      if (!err.isOffline) console.error('Failed to fetch datasets:', err);
      setDatasets(loadLocal());
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadName) return;
    setIsUploading(true);
    setUploadError('');

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'txt';
    const text = await selectedFile.text().catch(() => '');
    const rows = estimateRows(text, ext);
    const preview = parsePreview(text, ext);

    // Try real API
    try {
      const formData = new FormData();
      formData.append('name', uploadName);
      formData.append('description', uploadDesc);
      formData.append('file', selectedFile);
      await api.post('/datasets/', formData);
      await loadDatasets();
    } catch {
      // Offline — persist locally
      const newDataset: Dataset = {
        id: Date.now(),
        name: uploadName.trim(),
        description: uploadDesc.trim(),
        file_type: ext,
        size_bytes: selectedFile.size,
        row_count: rows,
        created_at: new Date().toISOString(),
        local: true,
        preview,
      };
      const existing = loadLocal();
      saveLocal([newDataset, ...existing]);
      setDatasets(prev => [newDataset, ...prev]);
    }

    setIsModalOpen(false);
    setUploadName(''); setUploadDesc(''); setSelectedFile(null);
    setIsUploading(false);
  };

  const handleDelete = async (dataset: Dataset) => {
    if (!confirm(`Delete "${dataset.name}"?`)) return;
    if (dataset.local) {
      const updated = loadLocal().filter(d => d.id !== dataset.id);
      saveLocal(updated);
    } else {
      try { await api.delete(`/datasets/${dataset.id}`); } catch (err: any) {
        if (!err.isOffline) { alert('Failed to delete'); return; }
      }
    }
    setDatasets(prev => prev.filter(d => d.id !== dataset.id));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const filtered = datasets.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || d.file_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--md-on-surface)' }}>Datasets</h1>
            <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Manage your training data and source files.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Upload Dataset
          </Button>
        </div>

        {/* Stats Bar */}
        {datasets.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Datasets', value: datasets.length },
              { label: 'Total Size', value: formatBytes(datasets.reduce((s, d) => s + d.size_bytes, 0)) },
              { label: 'Total Rows', value: datasets.reduce((s, d) => s + d.row_count, 0).toLocaleString() },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>{stat.value}</p>
                <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter */}
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-4" style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--md-on-surface-var)' }} />
            <input
              type="text"
              placeholder="Search datasets..."
              className="w-full bg-transparent border-none outline-none text-sm pl-10"
              style={{ color: 'var(--md-on-surface)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'csv', 'json', 'txt'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all"
                style={{
                  background: filterType === type ? 'var(--md-primary-container)' : 'transparent',
                  color: filterType === type ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl" style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Loading datasets...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map(dataset => (
                <motion.div layout key={dataset.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl p-6 transition-all group flex flex-col"
                  style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl" style={fileTypeColor(dataset.file_type)}>
                      {fileIcon(dataset.file_type)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {dataset.preview && dataset.preview.length > 0 && (
                        <button onClick={() => setPreviewDataset(dataset)}
                          className="p-2 rounded-lg transition-all" style={{ color: 'var(--md-on-surface-var)' }} title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(dataset)}
                        className="p-2 rounded-lg transition-all" style={{ color: 'var(--md-on-surface-var)' }} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate" style={{ color: 'var(--md-on-surface)' }}>{dataset.name}</h3>
                      {dataset.local && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                          style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-cont)' }}>local</span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2 mb-4 min-h-[2.5rem]" style={{ color: 'var(--md-on-surface-var)' }}>
                      {dataset.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--md-outline-var)' }}>
                    {[['Type', dataset.file_type.toUpperCase()], ['Rows', dataset.row_count.toLocaleString()], ['Size', formatBytes(dataset.size_bytes)]].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--md-on-surface-var)' }}>{l}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] mt-3" style={{ color: 'var(--md-on-surface-var)' }}>
                    Added {new Date(dataset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl" style={{ border: '1px dashed var(--md-outline)' }}>
            <Database className="w-14 h-14 mb-5" style={{ color: 'var(--md-outline)' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--md-on-surface)' }}>No datasets yet</h3>
            <p className="mb-8 text-center max-w-xs" style={{ color: 'var(--md-on-surface-var)' }}>
              Upload a CSV, JSON, or TXT file to start building your training pipeline.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Upload First Dataset
            </Button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => !isUploading && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl p-8"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>Upload Dataset</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>CSV, JSON, or TXT — up to 50 MB</p>
                </div>
                <button onClick={() => !isUploading && setIsModalOpen(false)}
                  className="p-2 rounded-xl transition-all" style={{ color: 'var(--md-on-surface-var)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                {/* Drop Zone */}
                <div
                  className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer select-none"
                  style={{
                    borderColor: dragOver ? 'var(--md-primary)' : selectedFile ? 'var(--md-success)' : 'var(--md-outline)',
                    background: dragOver ? 'var(--md-primary-container)' : selectedFile ? 'var(--md-success-cont)' : 'var(--md-surface-2)',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: 'var(--md-success)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>{selectedFile.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>{formatBytes(selectedFile.size)}</p>
                      <button type="button" onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                        className="mt-3 text-xs transition-colors" style={{ color: 'var(--md-error)' }}>Remove file</button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mb-3" style={{ color: dragOver ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>
                        {dragOver ? 'Drop it here!' : 'Click or drag & drop'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Supports CSV, JSON, TXT</p>
                    </>
                  )}
                  <input ref={fileInputRef} id="file-upload" type="file" className="hidden"
                    accept=".csv,.json,.txt,.tsv" onChange={handleFileSelect} />
                </div>

                <Input
                  label="Dataset Name"
                  placeholder="e.g., Customer Reviews Q2 2026"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1" style={{ color: 'var(--md-on-surface-var)' }}>Description <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <textarea
                    className="w-full h-20 rounded-xl px-4 py-3 text-sm transition-all resize-none"
                    style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                    placeholder="What does this dataset contain?"
                    value={uploadDesc}
                    onChange={e => setUploadDesc(e.target.value)}
                  />
                </div>

                {uploadError && (
                  <div className="p-4 rounded-xl flex gap-3 text-sm" style={{ background: 'var(--md-error-cont)', border: '1px solid var(--md-outline)', color: 'var(--md-error)' }}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{uploadError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    loading={isUploading}
                    disabled={!selectedFile || !uploadName}
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDataset && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => setPreviewDataset(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl rounded-3xl p-6 max-h-[80vh] flex flex-col"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={fileTypeColor(previewDataset.file_type)}>
                    {fileIcon(previewDataset.file_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--md-on-surface)' }}>{previewDataset.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>{previewDataset.row_count.toLocaleString()} rows · {formatBytes(previewDataset.size_bytes)}</p>
                  </div>
                </div>
                <button onClick={() => setPreviewDataset(null)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--md-on-surface-var)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-auto rounded-2xl flex-1" style={{ border: '1px solid var(--md-outline)' }}>
                {previewDataset.preview && previewDataset.preview.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--md-outline)', background: 'var(--md-surface-2)' }}>
                        {previewDataset.preview[0]?.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--md-on-surface-var)' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewDataset.preview.slice(1).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--md-outline-var)' }}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate" style={{ color: 'var(--md-on-surface)' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-sm" style={{ color: 'var(--md-on-surface-var)' }}>No preview available</div>
                )}
              </div>
              <p className="text-xs mt-3 text-center" style={{ color: 'var(--md-on-surface-var)' }}>Showing first 5 rows</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
