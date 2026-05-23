"use client";

import { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Search,
  Plus,
  Loader2,
  FileSpreadsheet,
  FileJson,
  X,
  FileCode,
  Info,
  Server
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────
interface Dataset {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "completed";
  file_type: "csv" | "jsonl" | "txt" | "json";
  rowCount: number;
  created: string;
  description?: string;
  local?: boolean;
}

// ── Standard Initial Datasets ─────────────────────────────────────────
const initialDatasets: Dataset[] = [
  { id: "ds-01", name: "support_tickets_v2.csv", size: "14.28 MB", status: "completed", file_type: "csv", rowCount: 14280, created: "2026-05-22", description: "Cleaned customer support queries and response tokens.", local: false },
  { id: "ds-02", name: "twitter_feedback.jsonl", size: "3.42 MB", status: "completed", file_type: "jsonl", rowCount: 8412, created: "2026-05-21", description: "Social media sentiment tags and brand review matrices.", local: false },
  { id: "ds-03", name: "python_snippets.jsonl", size: "24.12 MB", status: "completed", file_type: "jsonl", rowCount: 50000, created: "2026-05-20", description: "Algorithm snippets and corresponding code instructions.", local: false }
];

export default function DatasetsPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string, status: 'uploading' | 'completed'}[]>([]);
  const [datasetsList, setDatasetsList] = useState<Dataset[]>([]);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "csv" | "jsonl" | "txt">("all");
  const [isMounted, setIsMounted] = useState(false);

  // Manual select file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydration safety and initial fetch
  useEffect(() => {
    setIsMounted(true);
    
    // Synchronize datasets from localStorage or backend
    const cached = localStorage.getItem("local_datasets");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Translate format if needed
        const mapped = parsed.map((item: any) => ({
          id: item.id?.toString() || `ds-${Math.random()}`,
          name: item.name || "dataset.csv",
          size: item.size || `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB`,
          status: "completed" as const,
          file_type: (item.file_type || "csv") as any,
          rowCount: item.row_count || 1200,
          created: item.created_at ? item.created_at.split("T")[0] : "2026-05-23",
          description: item.description || "Uploaded domain dataset file.",
          local: true
        }));
        
        // Combine with standard initial sets
        const combined = [...mapped, ...initialDatasets.filter(i => !mapped.some((m: any) => m.name === i.name))];
        setDatasetsList(combined);
      } catch (e) {
        setDatasetsList(initialDatasets);
      }
    } else {
      setDatasetsList(initialDatasets);
      
      // Seed local storage with initial sets for the home dashboard
      const seeded = initialDatasets.map(i => ({
        id: i.id,
        name: i.name,
        description: i.description,
        file_type: i.file_type,
        size_bytes: parseFloat(i.size) * 1024 * 1024,
        row_count: i.rowCount,
        created_at: new Date(i.created).toISOString(),
        local: true
      }));
      localStorage.setItem("local_datasets", JSON.stringify(seeded));
    }
  }, []);

  // Save new items to local storage on list modifications
  const saveToLocalStorage = (updatedList: Dataset[]) => {
    const serialized = updatedList.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || "Uploaded domain dataset file.",
      file_type: item.file_type,
      size_bytes: parseFloat(item.size) * 1024 * 1024,
      row_count: item.rowCount,
      created_at: new Date(item.created).toISOString(),
      local: true
    }));
    localStorage.setItem("local_datasets", JSON.stringify(serialized));
  };

  // Handlers for drag and drop
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
    
    // Mocking file upload
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFileUpload(file);
    }
  };

  // Safe manual selection trigger
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileUpload(e.target.files[0]);
    }
  };

  // Unified file processor
  const processFileUpload = (file: File) => {
    const ext = (file.name.split(".").pop()?.toLowerCase() || "csv") as Dataset["file_type"];
    const formattedSize = (file.size / 1024 / 1024).toFixed(2) + " MB";

    // 1. Add to active uploads state (User's Exact Hook Requirements)
    const newFile = { 
      name: file.name, 
      size: formattedSize, 
      status: 'uploading' as const 
    };
    setUploadedFiles(prev => [...prev, newFile]);

    // 2. Add to active dataset timeline with 'uploading' state
    const freshDataset: Dataset = {
      id: `ds-${Date.now()}`,
      name: file.name,
      size: formattedSize,
      status: "uploading",
      file_type: ext,
      rowCount: Math.floor(5000 + Math.random() * 25000), // simulated parsing
      created: new Date().toISOString().split("T")[0],
      description: `Custom parsed ${ext.toUpperCase()} dataset registry repository.`,
      local: true
    };
    
    setDatasetsList(prev => [freshDataset, ...prev]);

    // Simulate upload completion after 2 seconds
    setTimeout(() => {
      // Complete in active uploads
      setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'completed' } : f));
      
      // Complete in local datasets list
      setDatasetsList(prev => {
        const completed = prev.map(d => d.name === file.name ? { ...d, status: "completed" as const } : d);
        saveToLocalStorage(completed);
        return completed;
      });
    }, 2000);
  };

  // Delete a dataset
  const handleDelete = (id: string) => {
    const updated = datasetsList.filter(d => d.id !== id);
    setDatasetsList(updated);
    saveToLocalStorage(updated);

    // Remove from active uploads list as well
    const target = datasetsList.find(d => d.id === id);
    if (target) {
      setUploadedFiles(prev => prev.filter(f => f.name !== target.name));
    }
  };

  // Find file icons dynamically
  const getFileIcon = (type: Dataset["file_type"]) => {
    switch (type) {
      case "csv":
        return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />;
      case "json":
      case "jsonl":
        return <FileJson className="h-6 w-6 text-purple-400" />;
      default:
        return <FileText className="h-6 w-6 text-blue-400" />;
    }
  };

  if (!isMounted) {
    return (
      <DashboardLayout>
        <div className="flex h-[75vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  // Filter datasets list
  const filteredDatasets = datasetsList.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" ? true :
                        typeFilter === "jsonl" ? (d.file_type === "jsonl" || d.file_type === "json") :
                        d.file_type === typeFilter;
                        
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8" style={{ borderColor: "var(--md-outline-var)" }}>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
              Datasets Registry
            </h1>
            <p className="text-sm" style={{ color: "var(--md-on-surface-var)" }}>
              Upload and manage your high-quality pre-tokenized target datasets for custom LLM fine-tuning pipelines.
            </p>
          </div>
        </div>

        {/* ── Uploader Dropzone & Active Progress Block ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Uploader Card */}
          <div className="lg:col-span-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden"
              style={{
                backgroundColor: isDragging ? "var(--md-primary-container)" : "var(--md-surface-1)",
                borderColor: isDragging ? "var(--md-primary)" : "var(--md-outline)",
                boxShadow: isDragging ? "0 0 30px rgba(124, 106, 247, 0.2)" : "none"
              }}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleSelectFile}
                accept=".csv,.jsonl,.json,.txt"
                className="hidden"
              />

              <div 
                className="p-5 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: "var(--md-surface-2)" }}
              >
                <UploadCloud className="h-10 w-10 text-purple-500" style={{ color: "var(--md-primary)" }} />
              </div>

              <h3 className="text-lg font-bold mb-1.5" style={{ color: "var(--md-on-surface)" }}>
                Drag and drop your dataset here
              </h3>
              <p className="text-xs max-w-xs mb-4" style={{ color: "var(--md-on-surface-var)" }}>
                Supports standard <span className="font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-white">CSV</span>, <span className="font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-white">JSONL</span>, <span className="font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-white">JSON</span>, and <span className="font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-white">TXT</span> up to 50MB.
              </p>
              
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-85 border"
                style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)" }}
              >
                Select Dataset File
              </button>

              {isDragging && (
                <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-purple-400">Release to initialize upload sequence</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Uploading Status Center */}
          <div className="p-6 rounded-3xl border flex flex-col justify-between" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-purple-500" style={{ color: "var(--md-primary)" }} />
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface)" }}>
                  Upload Controller
                </h3>
              </div>
              
              {uploadedFiles.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-2xl" style={{ borderColor: "var(--md-outline-var)" }}>
                  <Info className="h-6 w-6 mb-2" style={{ color: "var(--md-on-surface-var)" }} />
                  <p className="text-[11px] font-bold" style={{ color: "var(--md-on-surface-var)" }}>No uploads in progress</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--md-on-surface-var)", opacity: 0.8 }}>Dropped files will be cached here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
                  {uploadedFiles.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs"
                      style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)" }}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold truncate text-[11px]" style={{ color: "var(--md-on-surface)" }}>{file.name}</p>
                          <p className="text-[9px]" style={{ color: "var(--md-on-surface-var)" }}>{file.size}</p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center">
                        {file.status === "uploading" ? (
                          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[10px]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-500 font-bold text-[10px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--md-outline-var)" }}>
              <div className="flex justify-between text-[10px] font-bold" style={{ color: "var(--md-on-surface-var)" }}>
                <span>Storage Allocation</span>
                <span>{((datasetsList.reduce((acc, d) => acc + parseFloat(d.size), 0)) / 100).toFixed(1)}% of 10GB</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: "var(--md-surface-3)" }}>
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${(datasetsList.reduce((acc, d) => acc + parseFloat(d.size), 0)) / 100}%` }} />
              </div>
            </div>

          </div>

        </div>

        {/* ── Search & Filters ── */}
        <div className="p-4 rounded-2xl border flex flex-col sm:flex-row gap-4 mb-6" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--md-on-surface-var)" }} />
            <input
              type="text"
              placeholder="Search datasets by name or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none"
              style={{
                backgroundColor: "var(--md-surface-2)",
                borderColor: "var(--md-outline)",
                color: "var(--md-on-surface)"
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "csv", "jsonl", "txt"] as const).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition"
                style={{
                  backgroundColor: typeFilter === f ? "var(--md-primary-container)" : "transparent",
                  color: typeFilter === f ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                  border: `1px solid ${typeFilter === f ? "var(--md-primary)" : "transparent"}`
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Datasets Registry Grid ── */}
        {filteredDatasets.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed" style={{ borderColor: "var(--md-outline-var)", backgroundColor: "var(--md-surface-1)" }}>
            <Database className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--md-outline)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--md-on-surface)" }}>No records match your query</p>
            <p className="text-xs mt-1" style={{ color: "var(--md-on-surface-var)" }}>Modify search keywords or upload a new file above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map(dataset => (
              <div
                key={dataset.id}
                className="p-6 rounded-3xl border flex flex-col justify-between transition hover:scale-[1.01] duration-200"
                style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}
              >
                <div>
                  
                  {/* File Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--md-surface-2)" }}>
                      {getFileIcon(dataset.file_type)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {dataset.status === "uploading" ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 border border-blue-500/35 text-blue-400 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Indexing
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-green-500/10 border border-green-500/35 text-green-400">
                          Active
                        </span>
                      )}
                      
                      <button
                        onClick={() => handleDelete(dataset.id)}
                        className="p-1.5 rounded-lg border text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition"
                        style={{ borderColor: "var(--md-outline)" }}
                        title="Delete dataset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-lg truncate mb-1" style={{ color: "var(--md-on-surface)" }}>
                    {dataset.name}
                  </h3>
                  <p className="text-xs line-clamp-2 min-h-[2.5rem] mb-6" style={{ color: "var(--md-on-surface-var)", opacity: 0.9 }}>
                    {dataset.description || "Uploaded domain-specific pre-tokenized file registry."}
                  </p>

                </div>

                {/* Metadata details */}
                <div>
                  <div className="grid grid-cols-3 gap-2 py-3 border-t text-[11px]" style={{ borderColor: "var(--md-outline-var)" }}>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--md-on-surface-var)" }}>Extension</span>
                      <span className="font-mono font-bold capitalize" style={{ color: "var(--md-on-surface)" }}>{dataset.file_type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--md-on-surface-var)" }}>Rows Count</span>
                      <span className="font-mono font-bold" style={{ color: "var(--md-on-surface)" }}>
                        {dataset.status === "uploading" ? "..." : dataset.rowCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--md-on-surface-var)" }}>File Size</span>
                      <span className="font-mono font-bold" style={{ color: "var(--md-on-surface)" }}>{dataset.size}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex items-center justify-between text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>
                    <span>Source: {dataset.local ? "Workspace Upload" : "Cloud Cluster"}</span>
                    <span>Created: {dataset.created}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
