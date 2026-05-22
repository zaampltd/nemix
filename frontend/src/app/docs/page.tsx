"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap, Search, ChevronRight, ChevronDown, Menu, X, Copy,
  CheckCircle2, ExternalLink, BookOpen, Rocket, Database,
  Cpu, Shield, Zap as ZapIcon, BarChart2, Users, Webhook,
  Key, Terminal, Play, AlertCircle, Info, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { BrandLogo } from "@/components/ui/BrandLogo";

// ─── Sidebar structure ─────────────────────────────────────────────
const NAV = [
  {
    section: "Getting Started",
    icon: Play,
    items: [
      { id: "quickstart",      label: "Quickstart"             },
      { id: "installation",    label: "Installation"           },
      { id: "authentication",  label: "Authentication"         },
      { id: "first-model",     label: "Your First Fine-tune"   },
    ],
  },
  {
    section: "Datasets",
    icon: Database,
    items: [
      { id: "upload-datasets", label: "Uploading Datasets"     },
      { id: "dataset-formats", label: "Supported Formats"      },
      { id: "versioning",      label: "Dataset Versioning"     },
      { id: "preprocessing",   label: "Preprocessing & Splits" },
    ],
  },
  {
    section: "Training",
    icon: Cpu,
    items: [
      { id: "training-overview", label: "Overview"             },
      { id: "lora",              label: "LoRA Fine-tuning"     },
      { id: "qlora",             label: "QLoRA (4-bit)"        },
      { id: "hyperparams",       label: "Hyperparameters"      },
      { id: "checkpoints",       label: "Checkpoints"          },
    ],
  },
  {
    section: "Deployments",
    icon: Rocket,
    items: [
      { id: "deploy-overview",  label: "Deploy Overview"       },
      { id: "endpoints",        label: "Endpoints"             },
      { id: "autoscaling",      label: "Auto-scaling"          },
      { id: "rollbacks",        label: "Rollbacks"             },
    ],
  },
  {
    section: "API Reference",
    icon: Terminal,
    items: [
      { id: "api-auth",       label: "Authentication"          },
      { id: "api-inference",  label: "Inference"               },
      { id: "api-training",   label: "Training Jobs"           },
      { id: "api-datasets",   label: "Datasets"                },
      { id: "api-webhooks",   label: "Webhooks"                },
    ],
  },
  {
    section: "Security",
    icon: Shield,
    items: [
      { id: "api-keys",     label: "API Keys"                  },
      { id: "team-roles",   label: "Team Roles"                },
      { id: "audit-logs",   label: "Audit Logs"                },
    ],
  },
];

// ─── Doc content pages ─────────────────────────────────────────────
const DOCS: Record<string, React.ReactNode> = {
  quickstart: (
    <div>
      <div className="doc-badge">Getting Started</div>
      <h1>Quickstart</h1>
      <p className="lead">Get your first AI model trained and deployed in under 10 minutes.</p>

      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>No credit card required. The free tier includes 1,000 API calls and 1 deployment.</p>
      </div>

      <h2>Step 1 — Create an account</h2>
      <p>Sign up at <a href="/auth/register">nemix.ai/register</a>. You'll be taken straight to your dashboard.</p>

      <h2>Step 2 — Upload a dataset</h2>
      <p>Navigate to <strong>Datasets → Upload</strong> and drop your CSV or JSON file. Nemix auto-detects schema and validates format.</p>
      <CodeBlock lang="bash" code={`# Or use the CLI:\nnpx nemix-cli datasets upload ./my-dataset.csv --name "My Dataset"`} />

      <h2>Step 3 — Start training</h2>
      <p>Go to <strong>Training → New Job</strong>, select your dataset and base model, then click <strong>Start Training</strong>.</p>
      <CodeBlock lang="python" code={`import nemix\n\nclient = nemix.Client(api_key="nmx_live_sk_...")\n\njob = client.training.create(\n    base_model="llama3-8b",\n    dataset_id="ds_abc123",\n    method="lora",\n    epochs=3,\n)\nprint(job.id)  # trn_xyz789`} />

      <h2>Step 4 — Deploy your model</h2>
      <p>Once training completes, click <strong>Deploy</strong>. Your endpoint is live in ~60 seconds.</p>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/ep_001/infer \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "Classify this review: Great product!"}'`} />

      <div className="callout success">
        <CheckCircle2 className="callout-icon" style={{ color: "var(--md-success)" }} />
        <p>That's it! You've trained and deployed your first model. Continue to <a href="#">Your First Fine-tune →</a></p>
      </div>
    </div>
  ),

  authentication: (
    <div>
      <div className="doc-badge">Getting Started</div>
      <h1>Authentication</h1>
      <p className="lead">All API requests must be authenticated using a Bearer token.</p>

      <h2>API Keys</h2>
      <p>Generate API keys from <strong>Settings → API Keys</strong>. Two scopes are available:</p>
      <table className="doc-table">
        <thead><tr><th>Scope</th><th>Description</th><th>Use case</th></tr></thead>
        <tbody>
          <tr><td><code>Full access</code></td><td>Read + write all resources</td><td>Backend servers</td></tr>
          <tr><td><code>Read only</code></td><td>Read resources only</td><td>Analytics dashboards</td></tr>
        </tbody>
      </table>

      <h2>Using your API key</h2>
      <p>Pass your key in the <code>Authorization</code> header:</p>
      <CodeBlock lang="bash" code={`curl https://api.nemix.ai/v1/models \\\n  -H "Authorization: Bearer nmx_live_sk_YOUR_KEY"`} />

      <CodeBlock lang="python" code={`import nemix\nclient = nemix.Client(api_key="nmx_live_sk_...")\nmodels = client.models.list()`} />

      <div className="callout warning">
        <AlertCircle className="callout-icon" style={{ color: "var(--md-warning)" }} />
        <p>Never expose your API key in client-side code or public repositories. Use environment variables.</p>
      </div>

      <h2>Environment variables</h2>
      <CodeBlock lang="bash" code={`# .env\nNEMIX_API_KEY=nmx_live_sk_YOUR_KEY\n\n# Python\nimport os, nemix\nclient = nemix.Client(api_key=os.environ["NEMIX_API_KEY"])`} />
    </div>
  ),

  lora: (
    <div>
      <div className="doc-badge">Training</div>
      <h1>LoRA Fine-tuning</h1>
      <p className="lead">Low-Rank Adaptation (LoRA) lets you fine-tune large models efficiently by training only a small number of parameters.</p>

      <h2>How LoRA works</h2>
      <p>Instead of updating all model weights, LoRA adds small trainable rank decomposition matrices to each layer. This reduces trainable parameters by up to <strong>99%</strong> while preserving model quality.</p>

      <table className="doc-table">
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>rank (r)</code></td><td>16</td><td>Rank of the update matrices. Higher = more capacity.</td></tr>
          <tr><td><code>alpha</code></td><td>32</td><td>LoRA scaling factor. Usually 2× rank.</td></tr>
          <tr><td><code>dropout</code></td><td>0.05</td><td>Dropout on LoRA layers for regularization.</td></tr>
          <tr><td><code>target_modules</code></td><td>q_proj, v_proj</td><td>Which attention layers to adapt.</td></tr>
        </tbody>
      </table>

      <h2>Starting a LoRA job</h2>
      <CodeBlock lang="python" code={`job = client.training.create(\n    base_model="llama3-8b",\n    dataset_id="ds_abc123",\n    method="lora",\n    config={\n        "rank": 16,\n        "alpha": 32,\n        "dropout": 0.05,\n        "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],\n        "epochs": 3,\n        "learning_rate": 2e-4,\n        "batch_size": 4,\n    }\n)`} />

      <h2>Supported base models</h2>
      <ul className="doc-list">
        <li>LLaMA 3 (8B, 70B)</li>
        <li>Mistral 7B, Mixtral 8×7B</li>
        <li>GPT-2 (124M, 355M, 774M, 1.5B)</li>
        <li>Phi-3 Mini (3.8B)</li>
        <li>BERT, RoBERTa, DistilBERT</li>
      </ul>

      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>For very large models (&gt;30B parameters), we recommend <a href="#qlora">QLoRA</a> to reduce GPU memory usage.</p>
      </div>
    </div>
  ),

  "api-inference": (
    <div>
      <div className="doc-badge">API Reference</div>
      <h1>Inference API</h1>
      <p className="lead">Run predictions against your deployed models via a simple REST API.</p>

      <h2>POST /v1/{"{endpoint_id}"}/infer</h2>
      <table className="doc-table">
        <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>input</code></td><td>string</td><td>✅</td><td>Text input to the model</td></tr>
          <tr><td><code>max_tokens</code></td><td>integer</td><td>—</td><td>Max output tokens (default: 256)</td></tr>
          <tr><td><code>temperature</code></td><td>float</td><td>—</td><td>Sampling temperature 0–2 (default: 0.7)</td></tr>
          <tr><td><code>stream</code></td><td>boolean</td><td>—</td><td>Enable streaming response (SSE)</td></tr>
        </tbody>
      </table>

      <h2>Request</h2>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/ep_001/infer \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "input": "Summarize: Nemix is an AI platform...",\n    "max_tokens": 128,\n    "temperature": 0.5\n  }'`} />

      <h2>Response</h2>
      <CodeBlock lang="json" code={`{\n  "id": "inf_a1b2c3",\n  "endpoint_id": "ep_001",\n  "output": "Nemix is a platform for training and deploying AI models.",\n  "usage": {\n    "prompt_tokens": 12,\n    "completion_tokens": 11,\n    "total_tokens": 23\n  },\n  "latency_ms": 142,\n  "created_at": "2026-05-21T08:00:00Z"\n}`} />

      <h2>Streaming</h2>
      <CodeBlock lang="python" code={`stream = client.inference.stream(\n    endpoint_id="ep_001",\n    input="Tell me about LoRA",\n)\nfor chunk in stream:\n    print(chunk.delta, end="", flush=True)`} />
    </div>
  ),

  "deploy-overview": (
    <div>
      <div className="doc-badge">Deployments</div>
      <h1>Deploy Overview</h1>
      <p className="lead">Turn any trained model into a production-ready HTTPS API endpoint in under 60 seconds.</p>

      <h2>How deployments work</h2>
      <ol className="doc-list">
        <li>Select a trained model checkpoint</li>
        <li>Choose a deployment region (us-east-1, eu-west-1, ap-southeast-1)</li>
        <li>Click Deploy — Nemix containerizes and deploys automatically</li>
        <li>Receive an HTTPS endpoint URL immediately</li>
      </ol>

      <h2>Deployment states</h2>
      <table className="doc-table">
        <thead><tr><th>State</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span style={{ color: "var(--md-warning)" }}>⚡ building</span></td><td>Container is being built (~30s)</td></tr>
          <tr><td><span style={{ color: "var(--md-success)" }}>● healthy</span></td><td>Endpoint is live and accepting requests</td></tr>
          <tr><td><span style={{ color: "var(--md-on-surface-var)" }}>◌ sleeping</span></td><td>Auto-sleeping after 15 min idle (wakes in ~2s)</td></tr>
          <tr><td><span style={{ color: "var(--md-error)" }}>✕ failed</span></td><td>Build or runtime error</td></tr>
        </tbody>
      </table>

      <h2>Regions</h2>
      <table className="doc-table">
        <thead><tr><th>Region</th><th>Location</th><th>Avg cold start</th></tr></thead>
        <tbody>
          <tr><td><code>us-east-1</code></td><td>Virginia, USA</td><td>~1.2s</td></tr>
          <tr><td><code>eu-west-1</code></td><td>Dublin, Ireland</td><td>~1.4s</td></tr>
          <tr><td><code>ap-southeast-1</code></td><td>Singapore</td><td>~1.8s</td></tr>
        </tbody>
      </table>

      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>Pro and Business plans support multi-region deployments for lower global latency.</p>
      </div>
    </div>
  ),

  installation: (
    <div>
      <div className="doc-badge">Getting Started</div>
      <h1>Installation</h1>
      <p className="lead">Install the Nemix SDK and CLI for Python, Node.js, or use the REST API directly.</p>
      <h2>Python SDK</h2>
      <CodeBlock lang="bash" code={`pip install nemix\n\n# Verify\npython -c "import nemix; print(nemix.__version__)"`} />
      <h2>Node.js SDK</h2>
      <CodeBlock lang="bash" code={`npm install @nemix/sdk`} />
      <h2>CLI</h2>
      <CodeBlock lang="bash" code={`npm install -g nemix-cli\nnemix login\nnemix whoami`} />
      <h2>Requirements</h2>
      <table className="doc-table">
        <thead><tr><th>Language</th><th>Min version</th></tr></thead>
        <tbody>
          <tr><td>Python</td><td>3.9+</td></tr>
          <tr><td>Node.js</td><td>18+</td></tr>
        </tbody>
      </table>
    </div>
  ),

  "first-model": (
    <div>
      <div className="doc-badge">Getting Started</div>
      <h1>Your First Fine-tune</h1>
      <p className="lead">A complete walkthrough: raw data to a deployed sentiment classifier.</p>
      <h2>1. Prepare your dataset</h2>
      <CodeBlock lang="json" code={`{"text": "This is amazing!", "label": "positive"}\n{"text": "Worst purchase ever.", "label": "negative"}`} />
      <h2>2. Upload & train</h2>
      <CodeBlock lang="python" code={`import nemix\nclient = nemix.Client(api_key="nmx_live_sk_...")\n\ndataset = client.datasets.upload(file="./data.jsonl", name="Sentiment v1")\njob = client.training.create(\n    base_model="distilbert-base-uncased",\n    dataset_id=dataset.id,\n    method="lora",\n    config={"epochs": 3, "learning_rate": 2e-4}\n)\njob.wait()\nprint(f"Accuracy: {job.metrics['accuracy']:.1%}")`} />
      <h2>3. Deploy & test</h2>
      <CodeBlock lang="python" code={`endpoint = client.deployments.create(model_id=job.output_model_id)\nresult = endpoint.infer(input="I love this!")\nprint(result.output)  # positive`} />
      <div className="callout success">
        <CheckCircle2 className="callout-icon" style={{ color: "var(--md-success)" }} />
        <p>Your live API is ready. Share the endpoint URL with your team!</p>
      </div>
    </div>
  ),

  "upload-datasets": (
    <div>
      <div className="doc-badge">Datasets</div>
      <h1>Uploading Datasets</h1>
      <p className="lead">Upload via dashboard, CLI, or API. Max file size: 5 GB.</p>
      <h2>CLI</h2>
      <CodeBlock lang="bash" code={`nemix datasets upload ./data.csv --name "Customer Reviews"`} />
      <h2>Python SDK</h2>
      <CodeBlock lang="python" code={`dataset = client.datasets.upload(\n    file="./data.jsonl",\n    name="Customer Reviews",\n    task_type="classification",\n)`} />
      <h2>REST API</h2>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/datasets \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -F "file=@./data.csv" \\\n  -F "name=Customer Reviews"`} />
    </div>
  ),

  "dataset-formats": (
    <div>
      <div className="doc-badge">Datasets</div>
      <h1>Supported Formats</h1>
      <table className="doc-table">
        <thead><tr><th>Format</th><th>Extension</th><th>Max size</th></tr></thead>
        <tbody>
          <tr><td>JSONL</td><td>.jsonl</td><td>5 GB</td></tr>
          <tr><td>CSV</td><td>.csv</td><td>2 GB</td></tr>
          <tr><td>Parquet</td><td>.parquet</td><td>5 GB</td></tr>
          <tr><td>HuggingFace Hub</td><td>Hub ID</td><td>Unlimited</td></tr>
        </tbody>
      </table>
      <h2>JSONL schema examples</h2>
      <CodeBlock lang="json" code={`// Classification\n{"text": "input", "label": "class"}\n\n// Instruction tuning\n{"instruction": "Summarize:", "input": "...", "output": "..."}\n\n// Q&A\n{"question": "What is...", "context": "...", "answer": "..."}`} />
      <h2>Load from HuggingFace Hub</h2>
      <CodeBlock lang="python" code={`dataset = client.datasets.from_hub("imdb", split="train")`} />
    </div>
  ),

  versioning: (
    <div>
      <div className="doc-badge">Datasets</div>
      <h1>Dataset Versioning</h1>
      <p className="lead">Every upload creates an immutable version. Roll back or compare anytime.</p>
      <CodeBlock lang="python" code={`# New version of an existing dataset\nnew_v = client.datasets.upload(file="./v2.jsonl", name="Reviews", parent_id="ds_abc123")\nprint(new_v.version)  # 2\n\n# Pin a version for training\njob = client.training.create(dataset_id="ds_abc123", dataset_version=1, base_model="llama3-8b")`} />
    </div>
  ),

  preprocessing: (
    <div>
      <div className="doc-badge">Datasets</div>
      <h1>Preprocessing & Splits</h1>
      <p className="lead">Nemix auto-cleans and splits your data before training.</p>
      <h2>Auto-preprocessing includes</h2>
      <ul className="doc-list">
        <li>Duplicate row removal</li>
        <li>HTML stripping & whitespace normalization</li>
        <li>Text truncation to model max token length</li>
        <li>Optional class balancing for classification</li>
      </ul>
      <h2>Custom split config</h2>
      <CodeBlock lang="python" code={`job = client.training.create(\n    dataset_id="ds_abc123",\n    split_config={"train": 0.8, "val": 0.1, "test": 0.1, "stratify": True, "seed": 42}\n)`} />
    </div>
  ),

  "training-overview": (
    <div>
      <div className="doc-badge">Training</div>
      <h1>Training Overview</h1>
      <p className="lead">Nemix supports LoRA, QLoRA, and full fine-tuning across 20+ base models.</p>
      <table className="doc-table">
        <thead><tr><th>Method</th><th>GPU VRAM</th><th>Speed</th><th>Quality</th></tr></thead>
        <tbody>
          <tr><td>LoRA</td><td>8–24 GB</td><td>⚡ Fast</td><td>★★★★☆</td></tr>
          <tr><td>QLoRA (4-bit)</td><td>4–12 GB</td><td>⚡ Fast</td><td>★★★★☆</td></tr>
          <tr><td>Full fine-tune</td><td>40–80 GB</td><td>🐢 Slow</td><td>★★★★★</td></tr>
        </tbody>
      </table>
      <h2>Supported base models</h2>
      <table className="doc-table">
        <thead><tr><th>Model</th><th>Params</th><th>Best for</th></tr></thead>
        <tbody>
          <tr><td>LLaMA 3 8B</td><td>8B</td><td>General text generation</td></tr>
          <tr><td>LLaMA 3 70B</td><td>70B</td><td>Complex reasoning</td></tr>
          <tr><td>Mistral 7B</td><td>7B</td><td>Instruction following</td></tr>
          <tr><td>DistilBERT</td><td>66M</td><td>Fast classification</td></tr>
        </tbody>
      </table>
    </div>
  ),

  qlora: (
    <div>
      <div className="doc-badge">Training</div>
      <h1>QLoRA (4-bit)</h1>
      <p className="lead">Fine-tune 70B+ models on a single GPU with 4-bit quantization.</p>
      <table className="doc-table">
        <thead><tr><th>Model size</th><th>Full FP16</th><th>QLoRA VRAM</th></tr></thead>
        <tbody>
          <tr><td>7B</td><td>~14 GB</td><td>~5 GB</td></tr>
          <tr><td>13B</td><td>~26 GB</td><td>~8 GB</td></tr>
          <tr><td>70B</td><td>~140 GB</td><td>~35 GB</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="python" code={`job = client.training.create(\n    base_model="llama3-70b",\n    dataset_id="ds_abc123",\n    method="qlora",\n    config={"bits": 4, "rank": 64, "double_quant": True, "quant_type": "nf4"}\n)`} />
    </div>
  ),

  hyperparams: (
    <div>
      <div className="doc-badge">Training</div>
      <h1>Hyperparameters</h1>
      <table className="doc-table">
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>learning_rate</code></td><td>2e-4</td><td>Step size per update</td></tr>
          <tr><td><code>epochs</code></td><td>3</td><td>Passes over the dataset</td></tr>
          <tr><td><code>batch_size</code></td><td>4</td><td>Samples per gradient step</td></tr>
          <tr><td><code>warmup_ratio</code></td><td>0.05</td><td>LR warmup fraction</td></tr>
          <tr><td><code>max_seq_length</code></td><td>512</td><td>Input token limit</td></tr>
        </tbody>
      </table>
      <h2>Recommended configs by task</h2>
      <CodeBlock lang="python" code={`# Classification (fast)\n{"epochs": 3, "learning_rate": 2e-4, "batch_size": 16}\n\n# Instruction tuning\n{"epochs": 5, "learning_rate": 1e-4, "batch_size": 4, "max_seq_length": 2048}\n\n# Summarization\n{"epochs": 2, "learning_rate": 5e-5, "batch_size": 2, "max_seq_length": 4096}`} />
    </div>
  ),

  checkpoints: (
    <div>
      <div className="doc-badge">Training</div>
      <h1>Checkpoints</h1>
      <p className="lead">Nemix saves model checkpoints at every epoch and on the best validation score.</p>
      <CodeBlock lang="python" code={`checkpoints = client.training.checkpoints("trn_xyz789")\nfor cp in checkpoints:\n    print(f"Epoch {cp.epoch}: val_loss={cp.val_loss:.4f}")`} />
      <CodeBlock lang="python" code={`# Deploy a specific checkpoint\nendpoint = client.deployments.create(checkpoint_id="ckpt_epoch2_xyz789")`} />
      <CodeBlock lang="bash" code={`# Download a checkpoint as HuggingFace model\nnemix checkpoints download ckpt_epoch2_xyz789 --output ./my_model`} />
    </div>
  ),

  endpoints: (
    <div>
      <div className="doc-badge">Deployments</div>
      <h1>Endpoints</h1>
      <p className="lead">Each deployment creates a unique HTTPS endpoint. Call it from any language.</p>
      <CodeBlock lang="python" code={`endpoint = client.deployments.create(\n    model_id="mdl_abc123",\n    name="sentiment-prod",\n    region="us-east-1",\n)\nprint(endpoint.url)`} />
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/ep_001/infer \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -d '{"input": "I love this product!"}'`} />
      <CodeBlock lang="json" code={`{"id": "inf_a1b2c3", "output": "positive", "confidence": 0.97, "latency_ms": 45}`} />
    </div>
  ),

  autoscaling: (
    <div>
      <div className="doc-badge">Deployments</div>
      <h1>Auto-scaling</h1>
      <table className="doc-table">
        <thead><tr><th>Config</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>min_replicas</code></td><td>1</td><td>Always-on minimum</td></tr>
          <tr><td><code>max_replicas</code></td><td>10</td><td>Maximum burst capacity</td></tr>
          <tr><td><code>scale_up_rps</code></td><td>50</td><td>RPS threshold to add replica</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="python" code={`endpoint = client.deployments.create(\n    model_id="mdl_abc123",\n    scaling={"min_replicas": 2, "max_replicas": 20, "scale_up_rps": 100}\n)`} />
    </div>
  ),

  rollbacks: (
    <div>
      <div className="doc-badge">Deployments</div>
      <h1>Rollbacks</h1>
      <p className="lead">Instantly roll back to any previous version with zero downtime.</p>
      <CodeBlock lang="python" code={`history = client.deployments.history("ep_001")\nclient.deployments.rollback("ep_001", version=3)`} />
      <CodeBlock lang="bash" code={`nemix deployments rollback ep_001 --version 3`} />
      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>Rollbacks complete in &lt;10 seconds using blue-green deployment.</p>
      </div>
    </div>
  ),

  "api-auth": (
    <div>
      <div className="doc-badge">API Reference</div>
      <h1>API Authentication</h1>
      <p className="lead">All requests to <code>api.nemix.ai</code> require a valid Bearer token.</p>
      <h2>Base URL</h2>
      <CodeBlock lang="bash" code={`https://api.nemix.ai/v1`} />
      <h2>Request headers</h2>
      <table className="doc-table">
        <thead><tr><th>Header</th><th>Required</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td><code>Authorization</code></td><td>✅</td><td><code>Bearer nmx_live_sk_...</code></td></tr>
          <tr><td><code>Content-Type</code></td><td>POST/PATCH</td><td><code>application/json</code></td></tr>
        </tbody>
      </table>
      <h2>Error codes</h2>
      <table className="doc-table">
        <thead><tr><th>Status</th><th>Code</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td>401</td><td><code>unauthorized</code></td><td>Missing or invalid API key</td></tr>
          <tr><td>403</td><td><code>forbidden</code></td><td>Key lacks required scope</td></tr>
          <tr><td>429</td><td><code>rate_limited</code></td><td>Too many requests</td></tr>
        </tbody>
      </table>
    </div>
  ),

  "api-training": (
    <div>
      <div className="doc-badge">API Reference</div>
      <h1>Training Jobs API</h1>
      <h2>POST /v1/training/jobs</h2>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/training/jobs \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -d '{"base_model": "llama3-8b", "dataset_id": "ds_abc123", "method": "lora", "config": {"epochs": 3}}'`} />
      <h2>GET /v1/training/jobs/{`{job_id}`}</h2>
      <CodeBlock lang="json" code={`{\n  "id": "trn_xyz789",\n  "status": "training",\n  "progress": 45.2,\n  "metrics": {"train_loss": 0.83, "val_loss": 0.91, "accuracy": 0.847}\n}`} />
    </div>
  ),

  "api-datasets": (
    <div>
      <div className="doc-badge">API Reference</div>
      <h1>Datasets API</h1>
      <h2>GET /v1/datasets</h2>
      <CodeBlock lang="bash" code={`curl https://api.nemix.ai/v1/datasets -H "Authorization: Bearer nmx_live_sk_..."`} />
      <h2>POST /v1/datasets</h2>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/datasets \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -F "file=@./data.jsonl" -F "name=My Dataset"`} />
      <h2>Response</h2>
      <CodeBlock lang="json" code={`{"id": "ds_abc123", "name": "My Dataset", "num_rows": 12500, "created_at": "2026-05-21T08:00:00Z"}`} />
    </div>
  ),

  "api-webhooks": (
    <div>
      <div className="doc-badge">API Reference</div>
      <h1>Webhooks</h1>
      <p className="lead">Get notified in real-time when training completes, fails, or deployments change state.</p>
      <h2>Supported events</h2>
      <table className="doc-table">
        <thead><tr><th>Event</th><th>Trigger</th></tr></thead>
        <tbody>
          <tr><td><code>training.completed</code></td><td>Job finished</td></tr>
          <tr><td><code>training.failed</code></td><td>Job errored</td></tr>
          <tr><td><code>deployment.created</code></td><td>Endpoint live</td></tr>
          <tr><td><code>inference.error</code></td><td>Error rate threshold</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/webhooks \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -d '{"url": "https://your.app/webhook", "events": ["training.completed"], "secret": "your_secret"}'`} />
    </div>
  ),

  "api-keys": (
    <div>
      <div className="doc-badge">Security</div>
      <h1>API Keys</h1>
      <table className="doc-table">
        <thead><tr><th>Prefix</th><th>Scope</th><th>Use</th></tr></thead>
        <tbody>
          <tr><td><code>nmx_live_sk_</code></td><td>Full access</td><td>Server-side only</td></tr>
          <tr><td><code>nmx_live_pk_</code></td><td>Read only</td><td>Client-side analytics</td></tr>
          <tr><td><code>nmx_test_sk_</code></td><td>Test mode</td><td>Development & CI</td></tr>
        </tbody>
      </table>
      <ul className="doc-list">
        <li>Rotate keys every 90 days</li>
        <li>Never commit keys to git — use <code>.env</code> files</li>
        <li>Revoke immediately if leaked</li>
      </ul>
      <div className="callout warning">
        <AlertCircle className="callout-icon" style={{ color: "var(--md-warning)" }} />
        <p>If a key is compromised, revoke it immediately from Settings → Security.</p>
      </div>
    </div>
  ),

  "team-roles": (
    <div>
      <div className="doc-badge">Security</div>
      <h1>Team Roles</h1>
      <table className="doc-table">
        <thead><tr><th>Role</th><th>Datasets</th><th>Training</th><th>Deployments</th><th>Billing</th></tr></thead>
        <tbody>
          <tr><td><strong>Owner</strong></td><td>✅ Full</td><td>✅ Full</td><td>✅ Full</td><td>✅ Full</td></tr>
          <tr><td><strong>Admin</strong></td><td>✅ Full</td><td>✅ Full</td><td>✅ Full</td><td>👁 View</td></tr>
          <tr><td><strong>Developer</strong></td><td>✅ Full</td><td>✅ Full</td><td>✅ Deploy</td><td>❌</td></tr>
          <tr><td><strong>Viewer</strong></td><td>👁 View</td><td>👁 View</td><td>👁 View</td><td>❌</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="python" code={`client.team.invite(email="colleague@company.com", role="developer")`} />
    </div>
  ),

  "audit-logs": (
    <div>
      <div className="doc-badge">Security</div>
      <h1>Audit Logs</h1>
      <p className="lead">Every account action is logged with timestamp, user, IP, and outcome.</p>
      <CodeBlock lang="python" code={`logs = client.audit.list(from_date="2026-05-01", event_type="training.created")\nfor log in logs:\n    print(f"{log.created_at} | {log.user_email} | {log.event}")`} />
      <table className="doc-table">
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>auth.login</code></td><td>User logged in</td></tr>
          <tr><td><code>api_key.created</code></td><td>New API key generated</td></tr>
          <tr><td><code>training.created</code></td><td>Training job started</td></tr>
          <tr><td><code>deployment.created</code></td><td>Model deployed</td></tr>
        </tbody>
      </table>
      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>Audit logs retained 90 days (free) or 1 year (paid plans).</p>
      </div>
    </div>
  ),
};

// ─── Code block component ──────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", margin: "16px 0", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--md-outline)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "var(--md-surface-3)" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--md-on-surface-var)", textTransform: "uppercase" }}>{lang}</span>
        <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "none", border: "none", cursor: "pointer", color: copied ? "var(--md-success)" : "var(--md-on-surface-var)" }}>
          {copied ? <CheckCircle2 style={{ width: "13px", height: "13px" }} /> : <Copy style={{ width: "13px", height: "13px" }} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px", fontSize: "13px", overflowX: "auto", background: "var(--md-surface-2)", color: "var(--md-on-surface)", fontFamily: "'Fira Code', 'JetBrains Mono', monospace", lineHeight: 1.6 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────
export default function DocsPage() {
  const { theme, toggle } = useTheme();
  const [activeDoc, setActiveDoc] = useState("quickstart");
  const [openSections, setOpenSections] = useState<string[]>(["Getting Started", "Training", "API Reference"]);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSection = (s: string) =>
    setOpenSections(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const filteredNav = useMemo(() => {
    if (!search) return NAV;
    const q = search.toLowerCase();
    return NAV.map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) })).filter(s => s.items.length > 0);
  }, [search]);

  const content = DOCS[activeDoc] ?? (
    <div style={{ textAlign: "center", padding: "64px 0" }}>
      <BookOpen style={{ width: "40px", height: "40px", color: "var(--md-outline)", margin: "0 auto 16px" }} />
      <p style={{ color: "var(--md-on-surface-var)" }}>Select a topic from the sidebar.</p>
    </div>
  );

  const S = {
    text:  { color: "var(--md-on-surface)" },
    muted: { color: "var(--md-on-surface-var)" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", display: "flex", flexDirection: "column" }}>
      {/* Styles */}
      <style>{`
        .doc-badge { display:inline-block; font-size:11px; font-weight:600; padding:3px 10px; border-radius:100px; background:var(--md-primary-container); color:var(--md-on-primary-cont); margin-bottom:12px; }
        h1 { font-size:clamp(22px,3vw,32px); font-weight:800; color:var(--md-on-surface); margin:0 0 12px; letter-spacing:-0.02em; }
        h2 { font-size:18px; font-weight:700; color:var(--md-on-surface); margin:28px 0 10px; letter-spacing:-0.01em; }
        h3 { font-size:15px; font-weight:600; color:var(--md-on-surface); margin:20px 0 8px; }
        p  { font-size:15px; line-height:1.7; color:var(--md-on-surface-var); margin:0 0 12px; }
        .lead { font-size:17px; color:var(--md-on-surface-var); margin-bottom:24px; }
        a  { color:var(--md-primary); text-decoration:none; font-weight:500; }
        a:hover { text-decoration:underline; }
        code { font-family:'JetBrains Mono',monospace; font-size:13px; background:var(--md-surface-2); padding:2px 6px; border-radius:5px; color:var(--md-primary); }
        .doc-table { width:100%; border-collapse:collapse; font-size:13.5px; margin:16px 0; border-radius:12px; overflow:hidden; border:1px solid var(--md-outline); }
        .doc-table th { background:var(--md-surface-2); color:var(--md-on-surface-var); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.06em; padding:10px 14px; text-align:left; }
        .doc-table td { padding:10px 14px; color:var(--md-on-surface); border-top:1px solid var(--md-outline-var); }
        .doc-list { padding-left:20px; margin:12px 0; display:flex; flex-direction:column; gap:7px; }
        .doc-list li { font-size:14px; color:var(--md-on-surface-var); line-height:1.5; }
        .callout { display:flex; align-items:flex-start; gap:10px; padding:14px 16px; border-radius:12px; margin:16px 0; }
        .callout.info { background:var(--md-primary-container); border:1px solid var(--md-outline); }
        .callout.success { background:var(--md-success-cont); border:1px solid var(--md-outline); }
        .callout.warning { background:var(--md-warning-cont); border:1px solid var(--md-outline); }
        .callout p { margin:0; font-size:14px; }
        .callout-icon { width:16px; height:16px; flex-shrink:0; margin-top:2px; }
      `}</style>

      {/* ── Top nav ───────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", flexShrink: 0 }}>
            <BrandLogo size={22} />
            <span className="brand-logotype-adaptive" style={{ fontSize: "17px" }}>Nemix</span>
          </Link>
          <span style={{ color: "var(--md-outline)", fontSize: "18px" }}>/</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--md-on-surface-var)" }}>Docs</span>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: "360px", position: "relative", marginLeft: "auto" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "var(--md-on-surface-var)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search docs..."
              style={{ width: "100%", height: "36px", borderRadius: "10px", paddingLeft: "36px", paddingRight: "12px", fontSize: "13px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", outline: "none" }} />
          </div>

          <button onClick={toggle} style={{ padding: "7px", borderRadius: "8px", background: "transparent", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", cursor: "pointer", display: "flex" }}>
            {theme === "dark" ? <Sun style={{ width: "14px", height: "14px" }} /> : <Moon style={{ width: "14px", height: "14px" }} />}
          </button>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "8px", background: "var(--md-primary)", color: "var(--md-on-primary)", textDecoration: "none" }}>
            Dashboard <ChevronRight style={{ width: "13px", height: "13px" }} />
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside style={{ width: "260px", flexShrink: 0, borderRight: "1px solid var(--md-outline)", padding: "24px 0", overflowY: "auto", position: "sticky", top: "56px", height: "calc(100vh - 56px)" }}>
          {filteredNav.map(group => (
            <div key={group.section} style={{ marginBottom: "4px" }}>
              <button onClick={() => toggleSection(group.section)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <group.icon style={{ width: "14px", height: "14px", color: "var(--md-on-surface-var)", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--md-on-surface-var)", flex: 1 }}>{group.section}</span>
                <ChevronDown style={{ width: "13px", height: "13px", color: "var(--md-on-surface-var)", transform: openSections.includes(group.section) ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {openSections.includes(group.section) && (
                <div style={{ paddingBottom: "8px" }}>
                  {group.items.map(item => (
                    <button key={item.id} onClick={() => setActiveDoc(item.id)}
                      style={{ width: "100%", display: "block", padding: "7px 20px 7px 42px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: "13.5px", fontWeight: activeDoc === item.id ? 600 : 400, color: activeDoc === item.id ? "var(--md-primary)" : "var(--md-on-surface-var)", borderLeft: `2px solid ${activeDoc === item.id ? "var(--md-primary)" : "transparent"}`, marginLeft: "20px", transition: "all 0.1s" }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Links */}
          <div style={{ padding: "20px 20px 0", borderTop: "1px solid var(--md-outline-var)", marginTop: "12px" }}>
            {[["API Reference", "https://api.nemix.ai"], ["GitHub", "https://github.com"], ["Discord", "https://discord.gg"], ["Status", "https://status.nemix.ai"]].map(([l, h]) => (
              <a key={l} href={h} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 0", fontSize: "13px", color: "var(--md-on-surface-var)", textDecoration: "none" }}>
                <ExternalLink style={{ width: "12px", height: "12px" }} /> {l}
              </a>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main style={{ flex: 1, padding: "40px 56px 80px", overflowX: "hidden", maxWidth: "800px" }}>
          {content}

          {/* Prev / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--md-outline-var)" }}>
            <div />
            <button onClick={() => setActiveDoc("lora")}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--md-primary)", background: "none", border: "none", cursor: "pointer" }}>
              Next: LoRA Fine-tuning <ChevronRight style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Edit on GitHub */}
          <div style={{ marginTop: "24px" }}>
            <a href="https://github.com" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--md-on-surface-var)" }}>
              <ExternalLink style={{ width: "12px", height: "12px" }} /> Edit this page on GitHub
            </a>
          </div>
        </main>

        {/* ── Right TOC ─────────────────────────────────────────── */}
        <aside style={{ width: "200px", flexShrink: 0, padding: "40px 20px", position: "sticky", top: "56px", height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--md-on-surface-var)", marginBottom: "8px" }}>On this page</p>
          {["Overview", "Step 1 — Account", "Step 2 — Dataset", "Step 3 — Training", "Step 4 — Deploy"].map(h => (
            <a key={h} href="#" style={{ fontSize: "12.5px", color: "var(--md-on-surface-var)", textDecoration: "none", lineHeight: 1.4 }}>{h}</a>
          ))}

          <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--md-outline-var)" }}>
            <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", opacity: 0.6, marginBottom: "8px" }}>Was this helpful?</p>
            <div style={{ display: "flex", gap: "6px" }}>
              {["👍 Yes", "👎 No"].map(v => (
                <button key={v} style={{ flex: 1, padding: "5px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--md-outline)", background: "transparent", cursor: "pointer", color: "var(--md-on-surface-var)" }}>{v}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
