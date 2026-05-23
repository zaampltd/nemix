export interface PremiumDataset {
  id: string;
  name: string;
  description: string;
  file_type: "csv" | "jsonl" | "json" | "txt";
  size_bytes: number;
  row_count: number;
  tags: string[];
  mockData: any[];
}

export const PREMIUM_DATASETS: PremiumDataset[] = [
  {
    id: "pds-01",
    name: "customer_support_dialogues.jsonl",
    description: "Highly realistic SaaS customer support ticket resolution transcripts. Structured in standard chat format (system/user/assistant), perfect for fine-tuning customer support chatbots and classification routers.",
    file_type: "jsonl",
    size_bytes: 1542350,
    row_count: 1500,
    tags: ["support", "nlp", "chat", "customer-service"],
    mockData: [
      {
        "messages": [
          { "role": "system", "content": "You are a customer support agent for Nemix AI SaaS." },
          { "role": "user", "content": "Where can I view my active endpoints and webhooks?" },
          { "role": "assistant", "content": "You can view your active edge endpoints in the Deployments panel (/dashboard/deployments) and manage webhook receivers in the Webhooks tab (/dashboard/webhooks)." }
        ]
      },
      {
        "messages": [
          { "role": "system", "content": "You are a customer support agent for Nemix AI SaaS." },
          { "role": "user", "content": "How do I secure my Gemini API key?" },
          { "role": "assistant", "content": "You can safely input and lock your API keys under the Provider Integrations panel (/dashboard/config). Keys are stored using client-side AES-256 encryption." }
        ]
      },
      {
        "messages": [
          { "role": "system", "content": "You are a customer support agent for Nemix AI SaaS." },
          { "role": "user", "content": "My model training keeps failing with out-of-memory errors." },
          { "role": "assistant", "content": "OOM errors indicate your dataset size exceeds the chosen base model context or compute sliders. Try lowering the batch size slider or shortening your dataset tokens." }
        ]
      }
    ]
  },
  {
    id: "pds-02",
    name: "brand_sentiment_reviews.csv",
    description: "SaaS platform and social media product review statements mapped with clear sentiment categories (POSITIVE, NEGATIVE, NEUTRAL). Ideal for training sentiment classifiers and auto-moderator tools.",
    file_type: "csv",
    size_bytes: 684200,
    row_count: 8400,
    tags: ["sentiment", "csv", "classification", "reviews"],
    mockData: [
      { "text": "Nemix edge routing has reduced our API response times from 140ms to 14ms! Outstanding technology.", "sentiment": "POSITIVE" },
      { "text": "My fine-tuning job terminated after 3 epochs and did not explain why. Terribly frustrating experience.", "sentiment": "NEGATIVE" },
      { "text": "Is the playground panel custom model tab included in the free trial plan?", "sentiment": "NEUTRAL" },
      { "text": "Setting up the custom training pipelines was incredibly smooth and Firestore synced out of the box.", "sentiment": "POSITIVE" }
    ]
  },
  {
    id: "pds-03",
    name: "python_snippets_expert.jsonl",
    description: "Expert python instructions and matching optimized algorithm implementations. Includes docstrings, type hinting, optimal space/time complexity, and unit test configurations.",
    file_type: "jsonl",
    size_bytes: 4859000,
    row_count: 5000,
    tags: ["code-gen", "python", "programming", "instruct"],
    mockData: [
      {
        "instruction": "Write an optimized Python function to check if a string is a palindrome.",
        "response": "def is_palindrome(text: str) -> bool:\n    \"\"\"Checks if a string is a palindrome, stripping non-alphanumeric chars (O(N) time).\"\"\"\n    cleaned = ''.join(c.lower() for c in text if c.isalnum())\n    return cleaned == cleaned[::-1]"
      },
      {
        "instruction": "Create a Python decorator to measure function execution performance speed.",
        "response": "import time\nfrom functools import wraps\n\ndef measure_performance(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        res = func(*args, **kwargs)\n        print(f'Execution of {func.__name__}: {time.perf_counter() - start:.6f}s')\n        return res\n    return wrapper"
      }
    ]
  },
  {
    id: "pds-04",
    name: "medical_layman_dialogues.jsonl",
    description: "Translation dialogue pairs mapping highly complex medical research publications, prescriptions, and diagnosis text into clear, layman-friendly summaries.",
    file_type: "jsonl",
    size_bytes: 2140000,
    row_count: 3200,
    tags: ["medical", "layman-terms", "summarization", "health"],
    mockData: [
      {
        "instruction": "Explain: Patient presents with acute nasopharyngitis, advise hydration and NSAIDs.",
        "response": "The patient has a standard cold. Advise them to drink plenty of fluids and take standard over-the-counter pain relievers."
      },
      {
        "instruction": "Explain: Idiopathic pulmonary fibrosis prognosis and general therapeutic pathways.",
        "response": "This is a chronic lung disease of unknown cause that makes breathing difficult. Treatment focuses on slowing progression with special medications and oxygen therapy."
      }
    ]
  },
  {
    id: "pds-05",
    name: "sql_optimizer_manifests.jsonl",
    description: "Pairs of unoptimized SQL queries mapped directly to their fully optimized counterparts, explaining the tuning index triggers and execution plans.",
    file_type: "jsonl",
    size_bytes: 3120000,
    row_count: 4100,
    tags: ["sql", "database", "tuning", "optimization"],
    mockData: [
      {
        "unoptimized": "SELECT * FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE country = 'US')",
        "optimized": "SELECT o.* FROM orders o INNER JOIN customers c ON o.customer_id = c.id WHERE c.country = 'US';\n-- Indexing strategy: Create an index on customers(country) and orders(customer_id)."
      },
      {
        "unoptimized": "SELECT customer_name, (SELECT SUM(total) FROM orders WHERE customer_id = c.id) FROM customers c",
        "optimized": "SELECT c.customer_name, COALESCE(o.total_sum, 0) FROM customers c LEFT JOIN (SELECT customer_id, SUM(total) as total_sum FROM orders GROUP BY customer_id) o ON o.customer_id = c.id;\n-- Indexing strategy: Create an index on orders(customer_id, total)."
      }
    ]
  }
];
