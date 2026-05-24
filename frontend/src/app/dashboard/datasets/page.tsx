"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Database, Trash2, FileText, Search,
  Plus, X, AlertCircle, CheckCircle2, FileJson,
  FileSpreadsheet, File, ChevronDown, Eye, UploadCloud, Loader2,
  TableProperties, BrainCircuit, ArrowRight, TrendingUp, HardDrive,
  Sparkles, FolderDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PREMIUM_DATASETS, PremiumDataset } from './datasetsDatabase';

// ─── Firebase Dynamic Backend Imports ──────────────────────────────────
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, deleteDoc, doc } from "firebase/firestore";

// ── Types ─────────────────────────────────────────────────────────────
interface Dataset {
  id: string; 
  name: string;
  description: string;
  file_type: string;
  size_bytes: number;
  row_count: number;
  created_at: string;
  downloadUrl?: string;
  local?: boolean;
  preview?: string[][];  
  mockData?: any[];
}

const initialDatasets: Dataset[] = [
  { id: "ds-01", name: "support_tickets_v2.csv", size_bytes: 14972350, description: "Cleaned customer support queries and response tokens.", file_type: "csv", row_count: 14280, created_at: new Date("2026-05-22").toISOString(), local: false },
  { id: "ds-02", name: "twitter_feedback.jsonl", size_bytes: 3586040, description: "Social media sentiment tags and brand review matrices.", file_type: "jsonl", row_count: 8412, created_at: new Date("2026-05-21").toISOString(), local: false },
  { id: "ds-03", name: "python_snippets.jsonl", size_bytes: 25292300, description: "Algorithm snippets and corresponding code instructions.", file_type: "jsonl", row_count: 50000, created_at: new Date("2026-05-20").toISOString(), local: false }
];

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
  if (type === 'json' || type === 'jsonl') return <FileJson className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />;
  if (type === 'csv')  return <FileSpreadsheet className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />;
  return <File className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />;
}

function fileTypeColor(type: string): React.CSSProperties {
  if (type === 'csv')  return { color: 'var(--md-success)', background: 'var(--md-success-cont)' };
  if (type === 'json' || type === 'jsonl') return { color: 'var(--md-primary)', background: 'var(--md-primary-container)' };
  return { color: 'var(--md-warning)', background: 'var(--md-warning-cont)' };
}

function estimateRows(text: string, type: string): number {
  if (type === 'csv') return Math.max(0, text.split('\n').filter(l => l.trim()).length - 1);
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
  } catch { return Math.floor(text.split('\n').filter(l => l.trim()).length); }
}

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
  const router = useRouter();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [previewDataset, setPreviewDataset] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string, status: 'uploading' | 'completed'}[]>([]);

  // Premium database states
  const [datasetTab, setDatasetTab] = useState<'my-datasets' | 'premium-hub'>('my-datasets');
  const [clonedId, setClonedId] = useState<string | null>(null);

  // Form parameters
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    type?: 'danger' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => { loadDatasets(); }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "UserDatasets"),
        where("userId", "==", "test-user-123")
      );
      
      const querySnapshot = await getDocs(q);
      const fetched: Dataset[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          name: data.name || "Unnamed Dataset",
          description: data.description || "",
          file_type: data.file_type || "csv",
          size_bytes: data.size_bytes || 0,
          row_count: data.row_count || 0,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString(),
          downloadUrl: data.downloadUrl || "",
          preview: data.preview || [],
          mockData: data.mockData || [],
          local: false
        });
      });

      fetched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const merged = [...fetched, ...loadLocal(), ...initialDatasets.filter(i => !fetched.some(f => f.name === i.name))];
      setDatasets(merged);
    } catch (err: any) {
      console.error('Failed to query datasets from Firestore:', err);
      const merged = [...loadLocal(), ...initialDatasets];
      setDatasets(merged);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadName) return;
    setIsUploading(true);
    setUploadError('');

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'txt';
    const text = await selectedFile.text().catch(() => '');
    const rows = estimateRows(text, ext);
    const preview = parsePreview(text, ext);

    const downloadUrl = (selectedFile as any).firebaseUrl || "";

    try {
      await addDoc(collection(db, "UserDatasets"), {
        userId: "test-user-123",
        name: uploadName.trim(),
        description: uploadDesc.trim(),
        file_type: ext,
        size_bytes: selectedFile.size,
        row_count: rows,
        downloadUrl: downloadUrl,
        preview: preview,
        created_at: serverTimestamp(),
        local: false
      });

      await loadDatasets();
    } catch (e: any) {
      console.error("Firestore save failed, falling back to local registry storage:", e);
      const newDataset: Dataset = {
        id: `local-${Date.now()}`,
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
    setUploadName(''); 
    setUploadDesc(''); 
    setSelectedFile(null);
    setUploadedFiles([]);
    setIsUploading(false);
  };

  const handleDelete = async (dataset: Dataset) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Dataset",
      message: `Are you sure you want to delete the dataset "${dataset.name}"? This action will permanently remove it from the workspace vector repository and cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        if (dataset.local || dataset.id.startsWith("local-") || dataset.id.startsWith("ds-") || dataset.id.startsWith("clone-")) {
          const updated = loadLocal().filter(d => d.id !== dataset.id);
          saveLocal(updated);
          setDatasets(prev => prev.filter(d => d.id !== dataset.id));
        } else {
          try {
            await deleteDoc(doc(db, "UserDatasets", dataset.id));
            setDatasets(prev => prev.filter(d => d.id !== dataset.id));
          } catch (err: any) {
            console.error('Failed to delete document from Firestore:', err);
            setConfirmModal({
              isOpen: true,
              title: "Deletion Failed",
              message: `Could not remove the dataset from the cluster: ${err.message || 'Server connection error'}.`,
              confirmText: "Ok",
              cancelText: "",
              type: "warning",
              onConfirm: () => {}
            });
            return;
          }
        }
        
        if (previewDataset?.id === dataset.id) {
          setPreviewDataset(null);
        }
      }
    });
  };

  const uploadFileToStorage = (file: File) => {
    const storageRef = ref(storage, `datasets/test-user-123/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const formattedSize = (file.size / 1024 / 1024).toFixed(2) + " MB";
    const newFile = { 
      name: file.name, 
      size: formattedSize, 
      status: 'uploading' as const 
    };
    setUploadedFiles(prev => [...prev, newFile]);

    uploadTask.on('state_changed', 
      (snapshot) => {}, 
      (error) => {
        console.error("Firebase Storage Upload failed, falling back to local simulation:", error);
        setUploadError("Firebase Storage upload failed. Simulating offline file cache.");
        setTimeout(() => {
          setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'completed' } : f));
        }, 2000);
      }, 
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'completed' } : f));
          (file as any).firebaseUrl = downloadUrl;
          setSelectedFile(file);
          if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''));
        } catch (e) {
          console.error("Failed to secure download link:", e);
        }
      }
    );
  };

  const handleDragOver = (e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsDragging(true); 
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFileToStorage(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileToStorage(file);
    }
  };

  const handleCloneDataset = async (template: PremiumDataset) => {
    const newDataset: Dataset = {
      id: `clone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${template.name.replace(/\.[^.]+$/, '')}_clone.${template.file_type}`,
      description: template.description,
      file_type: template.file_type,
      size_bytes: template.size_bytes,
      row_count: template.row_count,
      created_at: new Date().toISOString(),
      local: true,
      preview: template.mockData ? template.mockData.map(r => Object.keys(r).map(k => String(r[k]))) : [],
      mockData: template.mockData
    };
    
    const existing = loadLocal();
    saveLocal([newDataset, ...existing]);
    
    setDatasets(prev => [newDataset, ...prev]);
    setClonedId(template.id);
    setTimeout(() => setClonedId(null), 2000);
  };

  const filtered = datasets.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || d.file_type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredPremium = PREMIUM_DATASETS.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || d.file_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--md-outline-var)' }}>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--md-on-surface)' }}>Datasets Registry</h1>
            <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Manage your training datasets and source vector repositories.</p>
          </div>
          <button
            onClick={() => { setUploadError(''); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ 
              backgroundColor: "var(--md-primary)", 
              color: "var(--md-on-primary)",
              boxShadow: "0 4px 14px 0 rgba(124, 106, 247, 0.2)"
            }}
          >
            <Plus className="w-4 h-4" />
            Upload Dataset
          </button>
        </div>

        {/* ── Stats Bar ── */}
        {datasets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { 
                label: 'Total Datasets', 
                value: datasets.length, 
                icon: Database,
                trend: '+2 added this week',
                trendColor: 'text-emerald-500',
                glow: 'hover:shadow-purple-500/5'
              },
              { 
                label: 'Total Space Allocated', 
                value: formatBytes(datasets.reduce((s, d) => s + d.size_bytes, 0)), 
                icon: HardDrive,
                trend: '14% of cluster capacity',
                trendColor: 'text-purple-400',
                glow: 'hover:shadow-blue-500/5'
              },
              { 
                label: 'Total Records Parsed', 
                value: datasets.reduce((s, d) => s + d.row_count, 0).toLocaleString(), 
                icon: TableProperties,
                trend: '+24.8K parsed recently',
                trendColor: 'text-emerald-500',
                glow: 'hover:shadow-pink-500/5'
              },
            ].map(stat => (
              <div 
                key={stat.label} 
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300 group hover:scale-[1.01] hover:border-[var(--md-primary)]",
                  stat.glow
                )}
                style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline-var)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--md-on-surface-var)' }}>
                    {stat.label}
                  </p>
                  <div className="p-2 rounded-lg" style={{ background: 'var(--md-surface-2)', color: 'var(--md-primary)' }}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-black transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent" style={{ color: 'var(--md-on-surface)' }}>
                  {stat.value}
                </h3>
                <div className={cn("flex items-center gap-1 mt-2.5 text-xs font-semibold", stat.trendColor)}>
                  <TrendingUp className="w-3.5 h-3.5" /> 
                  <span>{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Dynamic Dual-Tab Datasets Switcher ── */}
        <div className="flex rounded-2xl p-1 gap-1 border w-full max-w-md shrink-0" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)" }}>
          <button
            type="button"
            onClick={() => setDatasetTab("my-datasets")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: datasetTab === "my-datasets" ? "var(--md-surface-1)" : "transparent",
              color: datasetTab === "my-datasets" ? "var(--md-primary)" : "var(--md-on-surface-var)",
              boxShadow: datasetTab === "my-datasets" ? "var(--shadow-1)" : "none",
              border: datasetTab === "my-datasets" ? "1px solid var(--md-outline)" : "1px solid transparent"
            }}
          >
            📂 My Datasets ({datasets.length})
          </button>
          <button
            type="button"
            onClick={() => setDatasetTab("premium-hub")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 relative overflow-hidden"
            style={{
              backgroundColor: datasetTab === "premium-hub" ? "var(--md-surface-1)" : "transparent",
              color: datasetTab === "premium-hub" ? "var(--md-primary)" : "var(--md-on-surface-var)",
              boxShadow: datasetTab === "premium-hub" ? "var(--shadow-1)" : "none",
              border: datasetTab === "premium-hub" ? "1px solid var(--md-outline)" : "1px solid transparent"
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Nemix Premium Hub ({PREMIUM_DATASETS.length}+)
          </button>
        </div>

        {/* ── Search & Filter ── */}
        <div 
          className="rounded-2xl p-4 flex flex-col sm:flex-row gap-4 border shadow-sm transition-all duration-300 focus-within:border-[var(--md-primary)] focus-within:shadow-[0_0_20px_rgba(124,106,247,0.04)]" 
          style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline-var)' }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--md-on-surface-var)' }} />
            <input
              type="text"
              placeholder={datasetTab === 'my-datasets' ? "Search datasets by name or tags..." : "Search premium dataset templates..."}
              className="w-full bg-transparent border-none outline-none text-sm pl-10 focus:ring-0"
              style={{ color: 'var(--md-on-surface)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-[var(--md-surface-2)] p-1 rounded-xl border" style={{ borderColor: 'var(--md-outline-var)' }}>
            {['all', 'csv', 'json', 'jsonl', 'txt'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                style={{
                  background: filterType === type ? 'var(--md-primary)' : 'transparent',
                  color: filterType === type ? 'var(--md-on-primary)' : 'var(--md-on-surface-var)',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ── Dataset Cards Grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl" style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Loading datasets...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {/* MY CUSTOM DATASETS TAB */}
              {datasetTab === 'my-datasets' && (
                filtered.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(dataset => (
                      <motion.div layout key={dataset.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-[24px] p-6 transition-all duration-300 group flex flex-col hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(124,106,247,0.06)] hover:border-[var(--md-primary)] cursor-pointer border shadow-sm relative overflow-hidden"
                        style={{ 
                          background: previewDataset?.id === dataset.id ? 'var(--md-primary-container)' : 'var(--md-surface-1)', 
                          borderColor: previewDataset?.id === dataset.id ? 'var(--md-primary)' : 'var(--md-outline-var)'
                        }}
                        onClick={() => setPreviewDataset(dataset)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3.5 rounded-2xl shadow-sm" style={fileTypeColor(dataset.file_type)}>
                            {fileIcon(dataset.file_type)}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            {dataset.downloadUrl && (
                              <a href={dataset.downloadUrl} target="_blank" rel="noreferrer" 
                                className="p-2 rounded-xl border text-zinc-400 hover:text-zinc-200 hover:bg-[var(--md-surface-2)] transition" style={{ borderColor: 'var(--md-outline-var)' }} title="Download Raw File">
                                <HardDrive className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => setPreviewDataset(dataset)}
                              className="p-2 rounded-xl border text-zinc-400 hover:text-zinc-200 hover:bg-[var(--md-surface-2)] transition cursor-pointer" style={{ borderColor: 'var(--md-outline-var)' }} title="Preview">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(dataset)}
                              className="p-2 rounded-xl border text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer" style={{ borderColor: 'var(--md-outline-var)' }} title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-extrabold text-lg truncate group-hover:text-[var(--md-primary)] transition-colors duration-200" style={{ color: 'var(--md-on-surface)' }}>
                              {dataset.name}
                            </h3>
                            {(dataset.local || dataset.id.startsWith("local-") || dataset.id.startsWith("ds-") || dataset.id.startsWith("clone-")) && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
                                style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-cont)' }}>local</span>
                            )}
                          </div>
                          <p className="text-xs line-clamp-2 mb-6 min-h-[2.5rem]" style={{ color: 'var(--md-on-surface-var)', opacity: 0.9 }}>
                            {dataset.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
                          {[['Type', dataset.file_type.toUpperCase()], ['Rows', dataset.row_count.toLocaleString()], ['Size', formatBytes(dataset.size_bytes)]].map(([l, v]) => (
                            <div key={l}>
                              <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{l}</p>
                              <p className="text-xs font-extrabold font-mono" style={{ color: 'var(--md-on-surface)' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] mt-4" style={{ color: 'var(--md-on-surface-var)', opacity: 0.6 }}>
                          Created on {new Date(dataset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 rounded-3xl" style={{ border: '1px dashed var(--md-outline)' }}>
                    <Database className="w-14 h-14 mb-5" style={{ color: 'var(--md-outline)' }} />
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--md-on-surface)' }}>No datasets yet</h3>
                    <p className="mb-8 text-center max-w-xs" style={{ color: 'var(--md-on-surface-var)' }}>
                      Upload a CSV, JSON, JSONL, or TXT file or click 'Nemix Premium Hub' to save a pre-built template dataset!
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => setDatasetTab('premium-hub')} variant="ghost" className="border gap-2">
                        🚀 Browse Premium Hub
                      </Button>
                      <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                        <UploadCloud className="w-4 h-4" /> Upload First Dataset
                      </Button>
                    </div>
                  </div>
                )
              )}

              {/* PREMIUM DATASET HUB TAB */}
              {datasetTab === 'premium-hub' && (
                filteredPremium.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPremium.map(dataset => (
                      <motion.div layout key={dataset.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[24px] p-6 transition-all duration-300 group flex flex-col hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(124,106,247,0.06)] hover:border-[var(--md-primary)] cursor-pointer border shadow-sm relative overflow-hidden"
                        style={{ 
                          background: previewDataset?.id === dataset.id ? 'var(--md-primary-container)' : 'var(--md-surface-1)', 
                          borderColor: previewDataset?.id === dataset.id ? 'var(--md-primary)' : 'var(--md-outline-var)'
                        }}
                        onClick={() => setPreviewDataset(dataset)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3.5 rounded-2xl shadow-sm" style={fileTypeColor(dataset.file_type)}>
                            {fileIcon(dataset.file_type)}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setPreviewDataset(dataset)}
                              className="p-2 rounded-xl border text-zinc-400 hover:text-zinc-200 hover:bg-[var(--md-surface-2)] transition cursor-pointer" style={{ borderColor: 'var(--md-outline-var)' }} title="Preview Template Records">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleCloneDataset(dataset)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                              style={{
                                  background: clonedId === dataset.id ? 'var(--md-success-cont)' : 'var(--md-surface-2)',
                                  borderColor: 'var(--md-outline)',
                                  color: clonedId === dataset.id ? 'var(--md-success)' : 'var(--md-on-surface-var)'
                              }}
                              title="Clone to My Datasets"
                            >
                              {clonedId === dataset.id ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Cloned!
                                </>
                              ) : (
                                <>
                                  <FolderDown className="w-3.5 h-3.5 text-[var(--md-primary)]" /> Save Dataset
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-extrabold text-lg truncate group-hover:text-[var(--md-primary)] transition-colors duration-200" style={{ color: 'var(--md-on-surface)' }}>
                              {dataset.name}
                            </h3>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 text-amber-500 bg-amber-500/10 border border-amber-500/20">PREMIUM</span>
                          </div>
                          <p className="text-xs line-clamp-3 mb-6 min-h-[2.5rem]" style={{ color: 'var(--md-on-surface-var)', opacity: 0.9 }}>
                            {dataset.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {dataset.tags.map(t => (
                              <span key={t} className="text-[10px] font-medium text-zinc-400">#{t}</span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
                          {[['Type', dataset.file_type.toUpperCase()], ['Rows', dataset.row_count.toLocaleString()], ['Size', formatBytes(dataset.size_bytes)]].map(([l, v]) => (
                            <div key={l}>
                              <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{l}</p>
                              <p className="text-xs font-extrabold font-mono" style={{ color: 'var(--md-on-surface)' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 rounded-3xl" style={{ border: '1px dashed var(--md-outline)' }}>
                    <Sparkles className="w-10 h-10 mx-auto mb-3 text-amber-500 animate-pulse" />
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--md-on-surface)' }}>No templates found</h3>
                    <p className="mb-4 text-center max-w-xs" style={{ color: 'var(--md-on-surface-var)' }}>
                      Try adjusting your search criteria or categories to view premium dataset templates.
                    </p>
                  </div>
                )
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Upload Modal Overlay ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => !isUploading && setIsModalOpen(false)}
            />
            
            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl p-8"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}
              onClick={e => e.stopPropagation()}
            >
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--md-outline-var)' }}>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>Upload Dataset</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>CSV, JSON, JSONL, or TXT — up to 50 MB</p>
                </div>
                <button 
                  onClick={() => !isUploading && setIsModalOpen(false)}
                  className="p-2 rounded-xl transition hover:bg-neutral-800 cursor-pointer" 
                  style={{ color: 'var(--md-on-surface-var)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUploadSubmit} className="space-y-5">
                
                {/* Drag Zone Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none"
                  style={{
                    borderColor: isDragging ? 'var(--md-primary)' : selectedFile ? 'var(--md-success)' : 'var(--md-outline)',
                    background: isDragging ? 'var(--md-primary-container)' : selectedFile ? 'var(--md-success-cont)' : 'var(--md-surface-2)',
                    boxShadow: isDragging ? '0 0 25px rgba(124, 106, 247, 0.2)' : 'none'
                  }}
                >
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 mb-3 text-green-500" />
                      <p className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>{selectedFile.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>{formatBytes(selectedFile.size)}</p>
                      <button 
                        type="button" 
                        onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadedFiles([]); }}
                        className="mt-3 text-xs transition hover:underline cursor-pointer" 
                        style={{ color: 'var(--md-error)' }}
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 mb-3" style={{ color: isDragging ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>
                        {isDragging ? 'Drop file here' : 'Click or drag & drop'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Supports CSV, JSON, JSONL, TXT</p>
                    </>
                  )}
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden"
                    accept=".csv,.json,.jsonl,.txt" 
                    onChange={handleFileSelect} 
                  />
                </div>

                {/* Upload Progress Monitor */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--md-surface-2)', borderColor: 'var(--md-outline-var)' }}>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                          <span className="font-bold truncate text-[11px]" style={{ color: 'var(--md-on-surface)' }}>{file.name}</span>
                        </div>
                        <div className="shrink-0 font-semibold text-[10px]">
                          {file.status === 'uploading' ? (
                            <span className="text-blue-400 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Uploading
                            </span>
                          ) : (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Ready
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Input
                  label="Dataset Name"
                  placeholder="e.g., Customer Support Tickets"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--md-on-surface-var)' }}>Description</label>
                  <textarea
                    className="w-full h-20 rounded-xl px-4 py-3 text-sm transition focus:outline-none resize-none focus:ring-1 focus:ring-purple-500 outline-none"
                    style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                    placeholder="Describe what these data instances are for..."
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

                <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
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
                    <UploadCloud className="w-4 h-4" /> Upload
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Data Preview Side Drawer ─── */}
      <AnimatePresence>
        {previewDataset && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            
            {/* Backdrop shadow fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-[2px]"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => setPreviewDataset(null)}
            />
            
            {/* Drawer Container Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="relative w-full max-w-lg h-full shadow-2xl flex flex-col z-10 border-l"
              style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)' }}
            >
              
              {/* Drawer Top Header */}
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--md-outline-var)', backgroundColor: 'var(--md-surface-2)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl shrink-0" style={fileTypeColor(previewDataset.file_type)}>
                    {fileIcon(previewDataset.file_type)}
                  </div>
                  <div className="truncate">
                    <h3 className="font-extrabold text-base truncate" style={{ color: 'var(--md-on-surface)' }}>
                      {previewDataset.name}
                    </h3>
                    <p className="text-[10px] font-semibold flex items-center gap-1.5 uppercase tracking-wider mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>
                      <span>{previewDataset.file_type}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600" />
                      <span>{previewDataset.row_count.toLocaleString()} rows</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600" />
                      <span>{formatBytes(previewDataset.size_bytes)}</span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setPreviewDataset(null)} 
                  className="p-2 rounded-lg border text-zinc-400 hover:text-zinc-200 transition hover:bg-neutral-800 cursor-pointer" 
                  style={{ borderColor: 'var(--md-outline)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Description */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--md-on-surface-var)' }}>
                    Dataset Reference
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--md-on-surface)', opacity: 0.9 }}>
                    {previewDataset.description || "No description provided for this dataset. Use custom descriptions to outline tokens structure."}
                  </p>
                </div>

                {/* Fine-Tuning Integration Card */}
                <div 
                  className="p-5 rounded-2xl border flex flex-col justify-between gap-4" 
                  style={{ backgroundColor: 'var(--md-surface-2)', borderColor: 'var(--md-outline)' }}
                >
                  <div className="flex items-start gap-3">
                    <BrainCircuit className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" style={{ color: 'var(--md-primary)' }} />
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>
                        Model Fine-Tuning Pipeline
                      </h4>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>
                        This dataset contains fully parsed token inputs matching LLM adapters layout. Ready for direct GPU cluster training.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      localStorage.setItem('train_dataset_preset', JSON.stringify({
                        id: previewDataset.id,
                        name: previewDataset.name,
                        file_type: previewDataset.file_type
                      }));
                      router.push('/dashboard/training');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                  >
                    Start Training Job
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Drawer Body - Raw Records Preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TableProperties className="h-4 w-4" style={{ color: 'var(--md-on-surface-var)' }} />
                    <h4 className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>
                      Raw Records Preview (First 5 Rows)
                    </h4>
                  </div>
                  
                  <div className="bg-[#0D1117] border border-[var(--md-outline-var)] rounded-xl overflow-hidden relative group text-left">
                    
                    {/* Mac OS style window dots for premium feel */}
                    <div className="bg-[#161B22] px-4 py-2 flex items-center gap-2 border-b border-gray-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                      <span className="ml-2 text-[10px] text-gray-400 font-mono tracking-wider">data.json</span>
                    </div>
                    
                    {/* Formatted JSON output */}
                    <div className="p-4 overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                      <pre className="text-xs text-green-400 font-mono leading-relaxed">
                        {JSON.stringify(
                          previewDataset?.mockData || previewDataset?.preview || [
                            { "role": "system", "content": "You are a helpful coding assistant." },
                            { "role": "user", "content": "Write a Python script to sort an array." },
                            { "role": "assistant", "content": "Here is the code..." }
                          ], 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Bottom Actions */}
              {!(previewDataset.id.startsWith("pds-")) && (
                <div className="p-6 border-t bg-zinc-900/10 flex items-center justify-between" style={{ borderColor: 'var(--md-outline-var)' }}>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--md-on-surface-var)' }}>
                    UUID: ds-ref-{previewDataset.id}
                  </span>
                  <button
                    onClick={() => handleDelete(previewDataset)}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold text-red-400 border-red-500/30 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    Delete Dataset
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)', backdropFilter: 'blur(20px)' }}>
              
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: confirmModal.type === 'danger' ? 'var(--md-error-cont)' : confirmModal.type === 'warning' ? 'var(--md-warning-cont)' : 'var(--md-primary-container)',
                    color: confirmModal.type === 'danger' ? 'var(--md-error)' : confirmModal.type === 'warning' ? 'var(--md-warning)' : 'var(--md-primary)'
                  }}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--md-on-surface)' }}>
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--md-on-surface-var)' }}>
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
                {confirmModal.cancelText && (
                  <button type="button" onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:bg-neutral-800/10 border"
                    style={{ borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
                    {confirmModal.cancelText}
                  </button>
                )}
                <button type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(p => ({ ...p, isOpen: false }));
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:opacity-90"
                  style={{
                    background: confirmModal.type === 'danger' ? 'var(--md-error)' : confirmModal.type === 'warning' ? 'var(--md-warning)' : 'var(--md-primary)',
                    color: 'var(--md-on-primary)'
                  }}>
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
