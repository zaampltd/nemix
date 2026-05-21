"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Sliders, Copy, Check, Download, ChevronDown, Info } from "lucide-react";
import { motion } from "framer-motion";

interface Config {
  // Model
  baseModel: string;
  taskType: string;
  // LoRA
  loraR: number;
  loraAlpha: number;
  loraDropout: number;
  targetModules: string[];
  // Training
  epochs: number;
  batchSize: number;
  learningRate: number;
  warmupRatio: number;
  weightDecay: number;
  maxSeqLen: number;
  // Quantization
  quantization: "none" | "4bit" | "8bit";
  // Optimizer
  optimizer: string;
  scheduler: string;
  // Output
  outputDir: string;
}

const MODELS = ["meta-llama/Llama-3-8B", "meta-llama/Llama-3-70B", "mistralai/Mistral-7B-v0.3", "microsoft/Phi-3-mini-4k", "google/gemma-7b"];
const TASKS = ["causal_lm", "seq2seq_lm", "token_classification", "sequence_classification"];
const MODULES = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"];
const OPTIMIZERS = ["adamw_torch", "adamw_8bit", "paged_adamw_8bit", "sgd", "adafactor"];
const SCHEDULERS = ["cosine", "linear", "constant", "cosine_with_restarts", "polynomial"];

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1.5">
      <Info className="w-3.5 h-3.5 cursor-help inline"
        style={{ color: "var(--md-on-surface-var)" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)} />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs w-52 z-10 shadow-lg"
          style={{ background: "var(--md-surface)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}>
          {text}
        </span>
      )}
    </span>
  );
}

function Slider({ label, value, min, max, step, onChange, tip }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; tip?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium flex items-center" style={{ color: "var(--md-on-surface-var)" }}>
          {label}{tip && <Tooltip text={tip} />}
        </label>
        <span className="text-xs font-mono font-semibold" style={{ color: "var(--md-primary)" }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "var(--md-primary)", background: `linear-gradient(to right, var(--md-primary) ${((value - min) / (max - min)) * 100}%, var(--md-surface-3) 0%)` }} />
      <div className="flex justify-between text-[9px] mt-1" style={{ color: "var(--md-on-surface-var)" }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange, tip }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; tip?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>
        {label}{tip && <Tooltip text={tip} />}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-sm"
          style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
      </div>
    </div>
  );
}

function generateYAML(c: Config): string {
  return `# Nemix Fine-tune Config (LoRA)
# Generated at ${new Date().toISOString()}

model:
  name: "${c.baseModel}"
  task_type: "${c.taskType}"
  quantization: "${c.quantization}"

lora:
  r: ${c.loraR}
  alpha: ${c.loraAlpha}
  dropout: ${c.loraDropout}
  target_modules: [${c.targetModules.map(m => `"${m}"`).join(", ")}]
  bias: "none"

training:
  epochs: ${c.epochs}
  per_device_train_batch_size: ${c.batchSize}
  learning_rate: ${c.learningRate}
  warmup_ratio: ${c.warmupRatio}
  weight_decay: ${c.weightDecay}
  max_seq_length: ${c.maxSeqLen}
  optimizer: "${c.optimizer}"
  lr_scheduler_type: "${c.scheduler}"
  fp16: ${c.quantization !== "none" ? "false" : "true"}
  bf16: false
  gradient_checkpointing: true
  gradient_accumulation_steps: ${Math.max(1, Math.round(8 / c.batchSize))}
  logging_steps: 10
  save_strategy: "epoch"
  evaluation_strategy: "epoch"
  output_dir: "${c.outputDir}"
  report_to: "nemix"
`;
}

function generatePython(c: Config): string {
  return `from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer
import torch

# Load model
model = AutoModelForCausalLM.from_pretrained(
    "${c.baseModel}",
    load_in_${c.quantization === "4bit" ? "4bit" : c.quantization === "8bit" ? "8bit" : ""}${c.quantization === "none" ? "    # no quantization" : "=True,"},
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained("${c.baseModel}")

# LoRA config
peft_config = LoraConfig(
    task_type=TaskType.${c.taskType.toUpperCase().replace("_", "_")},
    r=${c.loraR},
    lora_alpha=${c.loraAlpha},
    lora_dropout=${c.loraDropout},
    target_modules=${JSON.stringify(c.targetModules)},
    bias="none",
)
model = get_peft_model(model, peft_config)
model.print_trainable_parameters()

# Training args
training_args = TrainingArguments(
    output_dir="${c.outputDir}",
    num_train_epochs=${c.epochs},
    per_device_train_batch_size=${c.batchSize},
    learning_rate=${c.learningRate},
    warmup_ratio=${c.warmupRatio},
    weight_decay=${c.weightDecay},
    optim="${c.optimizer}",
    lr_scheduler_type="${c.scheduler}",
    fp16=True,
    gradient_checkpointing=True,
    gradient_accumulation_steps=${Math.max(1, Math.round(8 / c.batchSize))},
    logging_steps=10,
    save_strategy="epoch",
    evaluation_strategy="epoch",
    report_to="none",
)
`;
}

export default function ConfigBuilderPage() {
  const [config, setConfig] = useState<Config>({
    baseModel: MODELS[0], taskType: TASKS[0],
    loraR: 16, loraAlpha: 32, loraDropout: 0.05,
    targetModules: ["q_proj", "v_proj"],
    epochs: 3, batchSize: 4, learningRate: 0.0002, warmupRatio: 0.03, weightDecay: 0.001,
    maxSeqLen: 2048, quantization: "4bit",
    optimizer: OPTIMIZERS[0], scheduler: SCHEDULERS[0],
    outputDir: "./outputs/lora-run",
  });
  const [outputFormat, setOutputFormat] = useState<"yaml" | "python">("yaml");
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setConfig(prev => ({ ...prev, [k]: v }));

  const toggleModule = (m: string) =>
    set("targetModules", config.targetModules.includes(m)
      ? config.targetModules.filter(x => x !== m)
      : [...config.targetModules, m]);

  const output = outputFormat === "yaml" ? generateYAML(config) : generatePython(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = outputFormat === "yaml" ? "yaml" : "py";
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nemix-config.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  // Compute estimated params
  const estParams = Math.round(config.loraR * 2 * config.targetModules.length * 4096 / 1_000_000);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--md-on-surface)" }}>Fine-tune Config Builder</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
            Visually configure LoRA hyperparameters and export as YAML or Python.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-5">
            {/* Model section */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Model</p>
              <Select label="Base model" value={config.baseModel} options={MODELS} onChange={v => set("baseModel", v)} />
              <Select label="Task type" value={config.taskType} options={TASKS} onChange={v => set("taskType", v)} tip="The type of task determines the PEFT task type used in LoRA config." />
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--md-on-surface-var)" }}>
                  Quantization<Tooltip text="4-bit uses QLoRA (bitsandbytes). Reduces VRAM usage by ~4x with minimal quality loss." />
                </label>
                <div className="flex gap-2">
                  {(["none", "4bit", "8bit"] as const).map(q => (
                    <button key={q} onClick={() => set("quantization", q)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: config.quantization === q ? "var(--md-primary-container)" : "var(--md-surface-2)",
                        color: config.quantization === q ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                        border: "1px solid var(--md-outline)",
                      }}>
                      {q === "none" ? "None (fp16)" : q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LoRA section */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>LoRA Parameters</p>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                  ~{estParams}M trainable params
                </span>
              </div>
              <Slider label="Rank (r)" value={config.loraR} min={4} max={128} step={4} onChange={v => set("loraR", v)} tip="Higher rank = more capacity but more VRAM. 16-32 is a good default." />
              <Slider label="Alpha" value={config.loraAlpha} min={8} max={256} step={8} onChange={v => set("loraAlpha", v)} tip="Scaling factor. Often set to 2× rank. Controls magnitude of LoRA updates." />
              <Slider label="Dropout" value={config.loraDropout} min={0} max={0.2} step={0.01} onChange={v => set("loraDropout", v)} tip="Dropout probability on LoRA layers. 0.05 is a safe default." />
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--md-on-surface-var)" }}>
                  Target modules<Tooltip text="Which attention/MLP layers to adapt. More modules = more capacity." />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MODULES.map(m => (
                    <button key={m} onClick={() => toggleModule(m)}
                      className="px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all"
                      style={{
                        background: config.targetModules.includes(m) ? "var(--md-primary-container)" : "var(--md-surface-2)",
                        color: config.targetModules.includes(m) ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                        border: "1px solid var(--md-outline)",
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Training section */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Training</p>
              <Slider label="Epochs" value={config.epochs} min={1} max={10} step={1} onChange={v => set("epochs", v)} />
              <Slider label="Batch size (per device)" value={config.batchSize} min={1} max={32} step={1} onChange={v => set("batchSize", v)} tip={`Grad accumulation = ${Math.max(1, Math.round(8 / config.batchSize))}× to keep effective batch = 8`} />
              <Slider label="Learning rate" value={config.learningRate} min={0.00001} max={0.001} step={0.00001} onChange={v => set("learningRate", v)} />
              <Slider label="Warmup ratio" value={config.warmupRatio} min={0} max={0.2} step={0.01} onChange={v => set("warmupRatio", v)} />
              <Slider label="Max seq length" value={config.maxSeqLen} min={512} max={8192} step={128} onChange={v => set("maxSeqLen", v)} />
              <Select label="Optimizer" value={config.optimizer} options={OPTIMIZERS} onChange={v => set("optimizer", v)} tip="adamw_8bit reduces VRAM usage." />
              <Select label="LR Scheduler" value={config.scheduler} options={SCHEDULERS} onChange={v => set("scheduler", v)} />
            </div>
          </div>

          {/* Right: Output */}
          <div className="xl:sticky xl:top-6 h-fit">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-2)" }}>
              {/* Tab bar */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-2)" }}>
                <div className="flex gap-1">
                  {(["yaml", "python"] as const).map(f => (
                    <button key={f} onClick={() => setOutputFormat(f)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-all"
                      style={{
                        background: outputFormat === f ? "var(--md-primary-container)" : "transparent",
                        color: outputFormat === f ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleDownload} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--md-on-surface-var)" }} title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                    {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>
              </div>

              <pre className="p-4 text-xs font-mono overflow-auto scrollbar-none"
                style={{ maxHeight: "70vh", color: "var(--md-on-surface-var)", lineHeight: 1.7, background: "var(--md-surface-2)" }}>
                {output}
              </pre>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { k: "Rank", v: `r=${config.loraR}` },
                { k: "Quant", v: config.quantization },
                { k: "Modules", v: `${config.targetModules.length} layers` },
                { k: "Epochs", v: `${config.epochs}ep` },
                { k: "LR", v: config.learningRate.toExponential(0) },
                { k: "Params", v: `~${estParams}M` },
              ].map(chip => (
                <span key={chip.k} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)" }}>
                  <span style={{ color: "var(--md-primary)", fontWeight: 600 }}>{chip.k}:</span> {chip.v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
