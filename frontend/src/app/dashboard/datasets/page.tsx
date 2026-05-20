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

function fileTypeColor(type: string) {
  if (type === 'csv')  return 'text-green-400 bg-green-500/10';
  if (type === 'json') return 'text-blue-400 bg-blue-500/10';
  return 'text-orange-400 bg-orange-500/10';
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
            <h1 className="text-3xl font-bold tracking-tight mb-1">Datasets</h1>
            <p className="text-gray-400">Manage your training data and source files.</p>
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
              <div key={stat.label} className="glass p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter */}
        <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search datasets..."
              className="w-full bg-transparent border-none outline-none text-sm pl-10 text-white placeholder-gray-600"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'csv', 'json', 'txt'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all',
                  filterType === type
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading datasets...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map(dataset => (
                <motion.div
                  layout
                  key={dataset.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-6 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all group flex flex-col"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('p-3 rounded-xl', fileTypeColor(dataset.file_type))}>
                      {fileIcon(dataset.file_type)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {dataset.preview && dataset.preview.length > 0 && (
                        <button
                          onClick={() => setPreviewDataset(dataset)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(dataset)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Name & Description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">{dataset.name}</h3>
                      {dataset.local && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 uppercase tracking-wider shrink-0">local</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                      {dataset.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Type</p>
                      <p className="text-sm font-semibold uppercase">{dataset.file_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Rows</p>
                      <p className="text-sm font-semibold">{dataset.row_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Size</p>
                      <p className="text-sm font-semibold">{formatBytes(dataset.size_bytes)}</p>
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-[10px] text-gray-600 mt-3">
                    Added {new Date(dataset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl border-dashed border-white/10">
            <Database className="w-14 h-14 text-gray-700 mb-5" />
            <h3 className="text-xl font-bold mb-2">No datasets yet</h3>
            <p className="text-gray-500 mb-8 text-center max-w-xs">
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
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !isUploading && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Upload Dataset</h2>
                  <p className="text-gray-500 text-sm mt-1">CSV, JSON, or TXT — up to 50 MB</p>
                </div>
                <button
                  onClick={() => !isUploading && setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                {/* Drop Zone */}
                <div
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer select-none',
                    dragOver ? 'border-purple-400 bg-purple-500/10' :
                    selectedFile ? 'border-green-500/50 bg-green-500/5' :
                    'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-green-400 mb-3" />
                      <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatBytes(selectedFile.size)}</p>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                        className="mt-3 text-xs text-gray-500 hover:text-red-400 transition-colors"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className={cn('w-10 h-10 mb-3', dragOver ? 'text-purple-400' : 'text-gray-600')} />
                      <p className="text-sm font-bold">
                        {dragOver ? 'Drop it here!' : 'Click or drag & drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Supports CSV, JSON, TXT</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.json,.txt,.tsv"
                    onChange={handleFileSelect}
                  />
                </div>

                <Input
                  label="Dataset Name"
                  placeholder="e.g., Customer Reviews Q2 2026"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Description <span className="text-gray-600">(optional)</span></label>
                  <textarea
                    className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder-gray-600"
                    placeholder="What does this dataset contain?"
                    value={uploadDesc}
                    onChange={e => setUploadDesc(e.target.value)}
                  />
                </div>

                {uploadError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-sm">
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setPreviewDataset(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', fileTypeColor(previewDataset.file_type))}>
                    {fileIcon(previewDataset.file_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{previewDataset.name}</h3>
                    <p className="text-xs text-gray-500">{previewDataset.row_count.toLocaleString()} rows · {formatBytes(previewDataset.size_bytes)}</p>
                  </div>
                </div>
                <button onClick={() => setPreviewDataset(null)} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-auto rounded-2xl border border-white/5 flex-1">
                {previewDataset.preview && previewDataset.preview.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        {previewDataset.preview[0]?.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewDataset.preview.slice(1).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">No preview available</div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">Showing first 5 rows</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
