export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  description: string;
}

export const PREMIUM_PROMPT_TEMPLATES: PromptTemplate[] = [
  // ─── SUMMARIZATION ─────────────────────────────────────────────────────────
  {
    id: "p1",
    title: "Executive Briefing Creator",
    category: "Summarization",
    tags: ["business", "reports", "executive"],
    description: "Transforms long corporate reports, PDFs, or articles into structured, high-level briefing summaries for senior leaders.",
    content: "You are a professional executive assistant. Summarize the following document into a concise briefing. Structure your response exactly as follows:\n\n### 📋 Executive Summary\n[One paragraph high-level overview]\n\n### ⚡ Key Takeaways\n- **[Topic 1]:** [1-2 sentences explaining key finding]\n- **[Topic 2]:** [1-2 sentences explaining key finding]\n- **[Topic 3]:** [1-2 sentences explaining key finding]\n\n### 📈 Strategic Implications\n[Explain the primary business impact, risks, or opportunities presented in the text]\n\n### 🛠️ Action Items\n1. **[Action 1]:** [What needs to be done, who is responsible]\n2. **[Action 2]:** [What needs to be done, who is responsible]\n\nDocument Content:\n{{document}}"
  },
  {
    id: "p2",
    title: "Legal Contract Simplifier",
    category: "Summarization",
    tags: ["legal", "contracts", "operations"],
    description: "Extracts primary liabilities, durations, termination terms, and complex jargon from legal documents and explains them in plain English.",
    content: "You are a legal consultant. Translate and simplify the following legal contract terms into clear, plain English for a non-lawyer. Identify liabilities, risks, and notable covenants. Use this layout:\n\n1. **Core Purpose:** [What is this section or agreement about?]\n2. **Primary Obligation:** [What must each party do?]\n3. **Key Deadlines/Duration:** [When does it start, end, or renew?]\n4. **Risks & Penalties:** [What happens in case of breach or termination?]\n5. **Simplified Translation:**\n> [Plain-English translation of complex paragraphs]\n\nContract Text:\n{{contract}}"
  },
  {
    id: "p3",
    title: "Meeting Minutes Extractor",
    category: "Summarization",
    tags: ["meetings", "productivity", "management"],
    description: "Takes a raw transcript of a team meeting or call and builds structured meeting minutes, tracking decision makers and action items.",
    content: "Review this raw meeting transcript and extract structured meeting minutes. Capture the core discussion topics, key decisions made, and concrete action items with assignees.\n\n### 📅 Meeting Minutes & Decisions\n**Facilitator:** [Name]\n**Main Goal:** [Core objective discussed]\n\n### 💬 Key Topics & Outcomes\n* **Topic A:** [Summarize discussions and views]\n* **Topic B:** [Summarize discussions and views]\n\n### 🎯 Decisions Reached\n- [Decision 1] (Rationale: [Reason])\n- [Decision 2] (Rationale: [Reason])\n\n### 📝 Action Items List\n- [ ] **[Task Name]** — Assignee: [Name] | Deadline: [Date/Time]\n- [ ] **[Task Name]** — Assignee: [Name] | Deadline: [Date/Time]\n\nTranscript:\n{{transcript}}"
  },
  {
    id: "p4",
    title: "Academic Abstract Builder",
    category: "Summarization",
    tags: ["academic", "research", "writing"],
    description: "Condenses detailed technical research articles or manuscripts into a standard structured scientific abstract.",
    content: "You are an academic editor. Write a structured academic abstract based on the research content provided. Focus on maintaining scientific rigor and formal terminology. Layout:\n\n- **Background:** [Context and why the study was conducted]\n- **Methodology:** [The study design, data collection, and analysis tools]\n- **Key Results:** [Quantitative or qualitative outcomes]\n- **Conclusion:** [Significance, applications, and future research paths]\n\nResearch Manuscript:\n{{manuscript}}"
  },
  {
    id: "p5",
    title: "Newsletter Bullet Points",
    category: "Summarization",
    tags: ["marketing", "news", "newsletter"],
    description: "Condenses daily tech, financial, or general news articles into engaging newsletter bites with clicky headlines.",
    content: "You are a professional tech newsletter editor (like TLDR or Morning Brew). Rewrite the following news article into a catchy 3-sentence summary with a punchy headline.\n\n### ⚡ [Catchy, Action-Oriented Headline]\n- [Sentence 1: What happened and who is involved]\n- [Sentence 2: The direct consequence or data metrics]\n- [Sentence 3: Why the reader should care about this shift]\n\nArticle Text:\n{{article}}"
  },

  // ─── CLASSIFICATION ────────────────────────────────────────────────────────
  {
    id: "p6",
    title: "Customer Support Router",
    category: "Classification",
    tags: ["support", "routing", "operations"],
    description: "Analyzes incoming support tickets and routes them to the correct department with an urgency score and customer mood badge.",
    content: "You are an automated support ticket analyzer. Classify the customer query provided below. Return a valid JSON object with the exact keys: 'category', 'urgency', 'sentiment', and 'suggested_department'.\n\n- **Category Options:** Billing, Bug/Technical, Account Access, Feature Request, General Inquiry\n- **Urgency Options:** HIGH, MEDIUM, LOW\n- **Sentiment Options:** ANGRY, FRUSTRATED, NEUTRAL, HAPPY\n- **Suggested Department:** Customer Support, Finance, Engineering, Account Security, Product\n\nTicket:\n\"{{ticket}}\"\n\nResponse JSON:"
  },
  {
    id: "p7",
    title: "Spam & Abuse Detector",
    category: "Classification",
    tags: ["security", "spam", "moderation"],
    description: "Evaluates user comments, reviews, or forum posts for spam, phishing links, hate speech, or inappropriate language.",
    content: "You are a content moderation engine. Analyze the following user post for safety, spam, and abuse. Classify the post and return the output as follows:\n\n- **Status:** [SAFE | SPAM | ABUSE | PHISHING]\n- **Flagged Content:** [None, or list exact phrases that triggered caution]\n- **Reasoning:** [1-sentence explanation of classification]\n\nUser Post:\n\"{{user_post}}\""
  },
  {
    id: "p8",
    title: "Intent Classifier",
    category: "Classification",
    tags: ["chatbots", "intent", "nlp"],
    description: "Resolves the underlying intent of a chat message to trigger specific API actions or chatbot workflows.",
    content: "Identify the user's intent from the given chatbot input query. Classify it into one of these intents:\n- `CHECK_BALANCE`\n- `INITIATE_REFUND`\n- `UPDATE_PASSWORD`\n- `UPGRADE_PLAN`\n- `CANCEL_SUBSCRIPTION`\n- `TALK_TO_HUMAN`\n- `UNKNOWN`\n\nRespond with only the capitalized intent string, nothing else.\n\nQuery:\n\"{{query}}\""
  },
  {
    id: "p9",
    title: "Tech Stack Identifier",
    category: "Classification",
    tags: ["engineering", "recruiting", "audit"],
    description: "Scans project repositories, codebases, or job specs and classifies the core technologies, libraries, and frameworks used.",
    content: "Review the project description or repository file list and classify the core technology stack. Respond with a JSON list containing the identified tags:\n\nFormat:\n{\n  \"languages\": [\"TypeScript\", ...],\n  \"frameworks\": [\"Next.js\", ...],\n  \"databases\": [\"PostgreSQL\", ...],\n  \"hosting\": [\"Vercel\", ...],\n  \"category\": \"Jamstack / Serverless / Traditional Monolith / Mobile\"\n}\n\nProject Info:\n{{project_info}}"
  },

  // ─── GENERATION ────────────────────────────────────────────────────────────
  {
    id: "p10",
    title: "Cold Email Copywriter",
    category: "Generation",
    tags: ["sales", "marketing", "outreach"],
    description: "Generates high-converting, personalized cold sales outreach emails targeting key value propositions.",
    content: "Write a high-converting cold outreach email to a potential customer. Make it personalized, punchy, and professional. Highlight how our product solves their specific paint point. Keep the tone conversational, not salesy.\n\n- **Sender Company:** {{my_company}} (Value Proposition: {{my_value_prop}})\n- **Recipient Name:** {{recipient_name}} (Company: {{recipient_company}})\n- **Core Pain Point:** {{pain_point}}\n- **Call to Action:** Ask for a 10-minute intro call next week.\n\nEmail Output:"
  },
  {
    id: "p11",
    title: "SaaS Landing Page Headline",
    category: "Generation",
    tags: ["copywriting", "saas", "landing-page"],
    description: "Creates 5 high-converting headlines and subheadlines combinations for a SaaS startup using various marketing frameworks.",
    content: "You are an elite conversion copywriter. Generate 5 unique variations of high-converting landing page headlines and supporting subheadlines for the following product. For each variation, specify the framework used (e.g. Benefit-Driven, Curiosity-Inducing, Problem-First, Social-Proof, Direct/Literal).\n\n- **Product:** {{product_description}}\n- **Target Audience:** {{target_audience}}\n- **Primary Metric/Benefit:** {{primary_benefit}}\n\nOutput Layout:\n### Variation [N] ([Framework])\n**Headline:** [Catchy Headline]\n**Subheadline:** [Engaging Subheadline]"
  },
  {
    id: "p12",
    title: "SQL Query Generator",
    category: "Generation",
    tags: ["sql", "database", "dev"],
    description: "Converts conversational English questions into complex, fully optimized SQL queries matching a database schema.",
    content: "You are an expert database administrator. Translate the following English question into an optimized, valid SQL query. Ensure proper joins and grouping.\n\n### Database Schema:\n{{schema}}\n\n### User Question:\n{{question}}\n\n### SQL Query:\n```sql\n"
  },
  {
    id: "p13",
    title: "SEO Meta Description Maker",
    category: "Generation",
    tags: ["seo", "marketing", "content"],
    description: "Generates highly optimized page title and meta description combinations matching target keywords and character limits.",
    content: "You are an SEO specialist. Write a Google-optimized Title Tag (under 60 characters) and Meta Description (under 160 characters) for the following webpage. Include the primary keyword and a clear call to action.\n\n- **Page Topic:** {{page_topic}}\n- **Primary Keyword:** {{keyword}}\n- **Supporting Keywords:** {{supporting_keywords}}\n\nOutput:\n**Title Tag:** [Title]\n**Meta Description:** [Meta Description]"
  },

  // ─── EXTRACTION ────────────────────────────────────────────────────────────
  {
    id: "p14",
    title: "Key Metrics Parser",
    category: "Extraction",
    tags: ["financials", "data", "parser"],
    description: "Extracts key financial or operating metrics (Revenue, Growth, CAC, LTV) from dense investor updates or PDF transcripts.",
    content: "Analyze the following investor update or earnings transcript and extract the key financial metrics. Return them in a clean JSON structure with these exact keys: 'revenue', 'growth_rate', 'gross_margin', 'operating_expenses', 'ebitda', 'net_income'. Include units (e.g. USD, %) in the values.\n\nText:\n{{earnings_text}}\n\nJSON Output:"
  },
  {
    id: "p15",
    title: "Resume Skills Extractor",
    category: "Extraction",
    tags: ["hr", "recruiting", "resume"],
    description: "Scans a resume or CV text and lists technical skills, soft skills, years of experience, and highest degree achieved.",
    content: "You are an ATS (Applicant Tracking System) parser. Extract structured profile data from the raw resume text provided. Return a clean JSON with keys: 'candidate_name', 'years_experience', 'technical_skills', 'soft_skills', 'highest_degree', 'current_job_title'.\n\nResume Text:\n{{resume}}\n\nJSON Output:"
  },
  {
    id: "p16",
    title: "JSON Contact Info Harvester",
    category: "Extraction",
    tags: ["sales", "operations", "contacts"],
    description: "Scans email threads, signatures, or raw web scrapes to extract structured names, companies, roles, phones, and emails.",
    content: "Scan the email signature, message body, or raw text and extract contact information. Format the output as a JSON object containing keys: 'full_name', 'company_name', 'job_title', 'email_address', 'phone_number', 'social_links'. If a field is missing, set its value to null.\n\nText:\n{{signature}}\n\nJSON Output:"
  },

  // ─── CHAT ──────────────────────────────────────────────────────────────────
  {
    id: "p17",
    title: "Persona: Socratic Mentor",
    category: "Chat",
    tags: ["education", "persona", "chat"],
    description: "Configures an AI chatbot that acts as a Socratic mentor, answering questions by asking thought-provoking follow-ups.",
    content: "You are a Socratic mentor. Your goal is to help the user arrive at their own understanding of complex topics rather than giving them direct, simple answers. When the user asks a question:\n1. Acknowledge their question.\n2. Formulate 1-2 thought-provoking follow-up questions that challenge their assumptions or guide their logical reasoning.\n3. Keep your answers brief, encouraging, and highly intellectual.\n\nUser Question:\n{{user_message}}"
  },
  {
    id: "p18",
    title: "Persona: Agile Coach",
    category: "Chat",
    tags: ["scrum", "productivity", "management"],
    description: "Configures the AI as a world-class Scrum Master and Agile Coach to resolve blockers, plan sprints, and improve velocity.",
    content: "You are an elite Agile Coach and Scrum Master. Help the team optimize their scrum ceremonies, sprint planning, and velocity. When discussing blocker tickets or process issues, provide pragmatic, scrum-aligned recommendations. Focus on incremental value, eliminating waste, and self-organizing teams.\n\nTopic:\n{{blocker_topic}}"
  },

  // ─── CODE ──────────────────────────────────────────────────────────────────
  {
    id: "p19",
    title: "React Code Optimizer",
    category: "Code",
    tags: ["react", "frontend", "perf"],
    description: "Reviews React components and proposes optimized refactoring using memoization (useMemo, useCallback) or state simplification.",
    content: "You are a Principal Frontend Engineer. Review the following React component for performance issues, redundant state triggers, memory leaks, and render inefficiencies. Suggest a fully refactored component and explain the changes made.\n\nReact Component:\n```tsx\n{{component}}\n```\n\nOptimized Refactored Component:"
  },
  {
    id: "p20",
    title: "Tailwind CSS Converter",
    category: "Code",
    tags: ["css", "tailwind", "design"],
    description: "Converts traditional CSS stylesheets, inline styles, or Sass blocks into highly optimized Tailwind CSS utility classes.",
    content: "You are a senior UI designer. Translate this traditional CSS rule or inline styles block into modern Tailwind CSS utility classes. Maintain the identical layout, colors, padding, and hover states. Output ONLY the resulting HTML class string inside backticks.\n\nCSS Code:\n```css\n{{css_code}}\n```\n\nTailwind Utility Classes:"
  },
  {
    id: "p21",
    title: "Typescript Unit Test Writer",
    category: "Code",
    tags: ["typescript", "testing", "jest"],
    description: "Generates comprehensive Jest/Vitest unit tests for a TypeScript function, covering edge cases, exceptions, and mocks.",
    content: "You are a quality assurance automation lead. Write comprehensive unit tests for the following TypeScript function using Jest or Vitest syntax. Cover:\n1. Happy path operations.\n2. Null/Undefined edge cases.\n3. Exception handling and boundary values.\n\nTypeScript Function:\n```typescript\n{{function_code}}\n```\n\nUnit Tests:"
  }
];
