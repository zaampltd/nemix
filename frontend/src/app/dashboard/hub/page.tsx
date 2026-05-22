"use client";
import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search, ExternalLink, Copy, Check, Filter, Star, Zap,
  Shield, Globe, Lock, ChevronDown, ChevronUp, BookOpen,
  Database, Brain, Music, Cloud, Code, DollarSign, Activity,
} from "lucide-react";

// ─── Data: curated top APIs from public-apis repo ─────────────────────
const ALL_APIS = [
  // Machine Learning / AI
  { name: "Hugging Face Inference",  category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Run 1000s of open source ML models via API — text, image, audio",   url: "https://huggingface.co/docs/api-inference",         free: true  },
  { name: "OpenAI",                  category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "GPT-4o, DALL-E, Whisper, TTS — industry-leading AI models",          url: "https://platform.openai.com/docs",                   free: false },
  { name: "Cohere",                  category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "NLP API: embeddings, classify, summarize, generate, rerank",         url: "https://docs.cohere.com/",                           free: true  },
  { name: "Stability AI",            category: "AI & ML",   auth: "apiKey", https: true,  cors: false, desc: "Stable Diffusion image generation, editing and upscaling",           url: "https://platform.stability.ai/docs/api-reference",   free: false },
  { name: "Replicate",               category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Run open source models — LLaMA, Stable Diffusion, Whisper and more", url: "https://replicate.com/docs/reference/http",           free: false },
  { name: "OpenRouter",              category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Unified API for Claude, GPT-4, Gemini, LLaMA, 100+ models",          url: "https://openrouter.ai/docs",                         free: true  },
  { name: "Groq",                    category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Ultra-fast LLaMA 3.1 70B and Mixtral inference (free tier)",          url: "https://console.groq.com/docs",                      free: true  },
  { name: "Mistral AI",              category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Mistral Large, Medium, 7B — efficient European LLMs",                url: "https://docs.mistral.ai/",                           free: false },
  { name: "NVIDIA NIM",              category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "LLaMA 3.1 70B, Nemotron via NVIDIA's accelerated inference",          url: "https://build.nvidia.com/",                          free: true  },
  { name: "AssemblyAI",              category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Transcription, speaker diarization, entity detection, LeMUR",        url: "https://www.assemblyai.com/docs",                    free: true  },
  { name: "Brainshop AI",            category: "AI & ML",   auth: "apiKey", https: true,  cors: true,  desc: "Build a free AI conversational brain",                               url: "https://brainshop.ai/",                              free: true  },
  { name: "Clarifai",                category: "AI & ML",   auth: "apiKey", https: true,  cors: false, desc: "Image recognition, object detection, custom visual AI models",       url: "https://docs.clarifai.com/",                         free: true  },

  // Text Analysis & NLP
  { name: "MeaningCloud",            category: "Text & NLP",auth: "apiKey", https: true,  cors: true,  desc: "Sentiment, topic classification, text summarization",               url: "https://www.meaningcloud.com/developer",             free: true  },
  { name: "Aylien Text Analysis",    category: "Text & NLP",auth: "apiKey", https: true,  cors: true,  desc: "Summarize, classify and analyze text documents",                    url: "https://docs.aylien.com/textapi",                    free: true  },
  { name: "Twinword",                category: "Text & NLP",auth: "apiKey", https: true,  cors: false, desc: "Word associations, sentiment, emotion & language detection",         url: "https://www.twinword.com/api/",                      free: true  },
  { name: "Sentim API",              category: "Text & NLP",auth: "No",     https: true,  cors: true,  desc: "Free sentiment analysis API — no key needed",                       url: "https://sentim-api.herokuapp.com/",                  free: true  },
  { name: "IBM Language Translator", category: "Text & NLP",auth: "apiKey", https: true,  cors: false, desc: "Translate text across 60+ languages with IBM Watson",               url: "https://cloud.ibm.com/docs/language-translator",     free: true  },
  { name: "LibreTranslate",          category: "Text & NLP",auth: "apiKey", https: true,  cors: true,  desc: "Open source translation API — 17 languages, no vendor lock-in",     url: "https://libretranslate.com/docs",                    free: true  },
  { name: "DeepL",                   category: "Text & NLP",auth: "apiKey", https: true,  cors: false, desc: "Best-in-class neural machine translation API",                      url: "https://www.deepl.com/docs-api",                     free: true  },

  // News & Data
  { name: "NewsAPI",                 category: "News",      auth: "apiKey", https: true,  cors: false, desc: "Live and historic news from 70,000+ sources",                       url: "https://newsapi.org/docs",                           free: true  },
  { name: "New York Times",          category: "News",      auth: "apiKey", https: true,  cors: false, desc: "Full access to NYT articles, books, movies and more",               url: "https://developer.nytimes.com/apis",                 free: true  },
  { name: "The Guardian",            category: "News",      auth: "apiKey", https: true,  cors: true,  desc: "News articles from The Guardian newspaper",                         url: "https://open-platform.theguardian.com/documentation", free: true },
  { name: "HackerNews",              category: "News",      auth: "No",     https: true,  cors: false, desc: "Tech news, stories and jobs — no auth required",                    url: "https://github.com/HackerNews/API",                  free: true  },
  { name: "Currents API",            category: "News",      auth: "apiKey", https: true,  cors: true,  desc: "Latest news from around the world in 30+ languages",                url: "https://currentsapi.services/en/docs/",              free: true  },

  // Finance & Crypto
  { name: "Alpha Vantage",           category: "Finance",   auth: "apiKey", https: true,  cors: false, desc: "Free stock, forex, crypto & economic indicator data",               url: "https://www.alphavantage.co/documentation/",         free: true  },
  { name: "CoinGecko",               category: "Finance",   auth: "No",     https: true,  cors: true,  desc: "Cryptocurrency prices, volumes, market data — no auth needed",     url: "https://www.coingecko.com/en/api",                   free: true  },
  { name: "CoinCap",                 category: "Finance",   auth: "No",     https: true,  cors: false, desc: "Real-time crypto asset prices and exchange rates",                  url: "https://docs.coincap.io/",                           free: true  },
  { name: "Open Exchange Rates",     category: "Finance",   auth: "apiKey", https: true,  cors: true,  desc: "Currency exchange rates for 170+ currencies",                       url: "https://openexchangerates.org/",                     free: true  },
  { name: "Frankfurter",             category: "Finance",   auth: "No",     https: true,  cors: true,  desc: "European Central Bank exchange rates — no auth needed",             url: "https://www.frankfurter.app/docs",                   free: true  },
  { name: "IEX Cloud",               category: "Finance",   auth: "apiKey", https: true,  cors: true,  desc: "Stock quotes, financials, earnings — financial data API",           url: "https://iexcloud.io/docs/api/",                      free: true  },

  // Weather
  { name: "OpenWeatherMap",          category: "Weather",   auth: "apiKey", https: true,  cors: false, desc: "Current weather, forecasts & historical data for any location",    url: "https://openweathermap.org/api",                     free: true  },
  { name: "WeatherAPI",              category: "Weather",   auth: "apiKey", https: true,  cors: true,  desc: "Real-time weather, forecasts, astronomy, air quality",              url: "https://www.weatherapi.com/docs/",                   free: true  },
  { name: "Open-Meteo",              category: "Weather",   auth: "No",     https: true,  cors: true,  desc: "High-resolution weather forecasts — no API key required",           url: "https://open-meteo.com/en/docs",                     free: true  },
  { name: "Visual Crossing",         category: "Weather",   auth: "apiKey", https: true,  cors: true,  desc: "Historical weather and weather forecast API",                       url: "https://www.visualcrossing.com/resources/documentation/weather-api", free: true },

  // Data / Open Data
  { name: "REST Countries",          category: "Open Data", auth: "No",     https: true,  cors: true,  desc: "Country data: name, currencies, languages, flags — no auth",       url: "https://restcountries.com/",                         free: true  },
  { name: "Open Library",            category: "Open Data", auth: "No",     https: true,  cors: false, desc: "Books, book covers and related metadata",                           url: "https://openlibrary.org/developers/api",             free: true  },
  { name: "Wikipedia",               category: "Open Data", auth: "No",     https: true,  cors: true,  desc: "Wikipedia content and search API — no key needed",                 url: "https://www.mediawiki.org/wiki/API:Main_page",       free: true  },
  { name: "DataUSA",                 category: "Open Data", auth: "No",     https: true,  cors: false, desc: "US public data — demographics, income, education and more",        url: "https://datausa.io/about/api/",                      free: true  },
  { name: "World Bank",              category: "Open Data", auth: "No",     https: true,  cors: true,  desc: "Global development data: GDP, population, poverty indicators",     url: "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589", free: true },
  { name: "NASA Open APIs",          category: "Open Data", auth: "apiKey", https: true,  cors: false, desc: "Astronomy picture of the day, Mars Rover photos, satellite data", url: "https://api.nasa.gov/",                              free: true  },

  // Development Tools
  { name: "JSONPlaceholder",         category: "Dev Tools", auth: "No",     https: true,  cors: true,  desc: "Free fake REST API for testing and prototyping",                   url: "https://jsonplaceholder.typicode.com",               free: true  },
  { name: "GitHub",                  category: "Dev Tools", auth: "OAuth",  https: true,  cors: true,  desc: "GitHub repositories, code, users and more",                        url: "https://docs.github.com/en/rest",                    free: true  },
  { name: "Docker Hub",              category: "Dev Tools", auth: "apiKey", https: true,  cors: true,  desc: "Search and retrieve Docker Hub images and stats",                  url: "https://docs.docker.com/docker-hub/api/latest/",    free: true  },
  { name: "QuickChart",              category: "Dev Tools", auth: "No",     https: true,  cors: true,  desc: "Generate chart and graph images from URLs — no auth",              url: "https://quickchart.io/",                             free: true  },
  { name: "Hoppscotch (Echo)",       category: "Dev Tools", auth: "No",     https: true,  cors: true,  desc: "HTTP testing and request bin service",                             url: "https://hoppscotch.io/",                             free: true  },

  // Security
  { name: "VirusTotal",              category: "Security",  auth: "apiKey", https: true,  cors: false, desc: "Analyze files and URLs for viruses, malware",                      url: "https://developers.virustotal.com/",                 free: true  },
  { name: "Have I Been Pwned",       category: "Security",  auth: "apiKey", https: true,  cors: false, desc: "Check if email was compromised in a data breach",                  url: "https://haveibeenpwned.com/API/v3",                  free: true  },
  { name: "Shodan",                  category: "Security",  auth: "apiKey", https: true,  cors: false, desc: "Internet-wide search engine for devices and CVEs",                 url: "https://developer.shodan.io/api",                    free: true  },

  // Health
  { name: "Open Disease",            category: "Health",    auth: "No",     https: true,  cors: true,  desc: "COVID-19, influenza & other disease stats worldwide",              url: "https://disease.sh/",                                free: true  },
  { name: "Infermedica",             category: "Health",    auth: "apiKey", https: true,  cors: true,  desc: "AI-based symptom checker and preliminary diagnosis",               url: "https://developer.infermedica.com/",                 free: true  },

  // Media & Entertainment
  { name: "Spotify",                 category: "Music",     auth: "OAuth",  https: true,  cors: false, desc: "Music data: tracks, artists, albums, user playlists",              url: "https://developer.spotify.com/documentation/web-api", free: true },
  { name: "MusicBrainz",             category: "Music",     auth: "No",     https: true,  cors: false, desc: "Open encyclopedia of music metadata",                              url: "https://musicbrainz.org/doc/MusicBrainz_API",        free: true  },
  { name: "The Movie Database",      category: "Video",     auth: "apiKey", https: true,  cors: false, desc: "Movie, TV show and actor data used by millions",                   url: "https://developers.themoviedb.org/3/getting-started", free: true },
  { name: "OMDB",                    category: "Video",     auth: "apiKey", https: true,  cors: true,  desc: "Open Movie Database — title, ratings, posters",                   url: "https://www.omdbapi.com/",                           free: true  },
  { name: "YouTube Data",            category: "Video",     auth: "apiKey", https: true,  cors: false, desc: "YouTube videos, channels, playlists and search",                   url: "https://developers.google.com/youtube/v3",           free: true  },

  // Geocoding
  { name: "OpenStreetMap (Nominatim)",category: "Geocoding",auth: "No",     https: true,  cors: false, desc: "Geocoding and reverse geocoding — no auth required",               url: "https://nominatim.org/release-docs/latest/api/Overview/", free: true },
  { name: "ipapi",                   category: "Geocoding", auth: "No",     https: true,  cors: true,  desc: "IP geolocation: country, city, timezone, lat/lon",                url: "https://ipapi.co/api/",                              free: true  },
  { name: "Google Maps",             category: "Geocoding", auth: "apiKey", https: true,  cors: false, desc: "Maps, geocoding, places, directions and distance matrix",          url: "https://developers.google.com/maps/documentation",   free: false },
  { name: "Mapbox",                  category: "Geocoding", auth: "apiKey", https: true,  cors: true,  desc: "Maps, geocoding, search and navigation APIs",                      url: "https://docs.mapbox.com/api/",                       free: true  },
];

const CATEGORIES = ["All", ...Array.from(new Set(ALL_APIS.map(a => a.category))).sort()];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "AI & ML":     <Brain style={{ width: "14px", height: "14px" }} />,
  "Text & NLP":  <BookOpen style={{ width: "14px", height: "14px" }} />,
  "Finance":     <DollarSign style={{ width: "14px", height: "14px" }} />,
  "Weather":     <Cloud style={{ width: "14px", height: "14px" }} />,
  "Open Data":   <Database style={{ width: "14px", height: "14px" }} />,
  "Dev Tools":   <Code style={{ width: "14px", height: "14px" }} />,
  "Security":    <Shield style={{ width: "14px", height: "14px" }} />,
  "Health":      <Activity style={{ width: "14px", height: "14px" }} />,
  "News":        <Globe style={{ width: "14px", height: "14px" }} />,
  "Music":       <Music style={{ width: "14px", height: "14px" }} />,
  "Video":       <Zap style={{ width: "14px", height: "14px" }} />,
  "Geocoding":   <Globe style={{ width: "14px", height: "14px" }} />,
};

export default function PublicAPIsPage() {
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [noAuth, setNoAuth]   = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ALL_APIS.filter(api => {
      if (category !== "All" && api.category !== category) return false;
      if (freeOnly && !api.free) return false;
      if (noAuth && api.auth !== "No") return false;
      if (search) {
        const q = search.toLowerCase();
        return api.name.toLowerCase().includes(q) || api.desc.toLowerCase().includes(q) || api.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, category, freeOnly, noAuth]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const authColor = (auth: string) => {
    if (auth === "No") return { bg: "var(--md-success-cont)", color: "var(--md-success)" };
    if (auth === "OAuth") return { bg: "var(--md-warning-cont)", color: "var(--md-warning)" };
    return { bg: "var(--md-primary-container)", color: "var(--md-primary)" };
  };

  const stats = {
    total: ALL_APIS.length,
    free: ALL_APIS.filter(a => a.free).length,
    noKey: ALL_APIS.filter(a => a.auth === "No").length,
    cats: CATEGORIES.length - 1,
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "16px 0 48px", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "var(--md-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe style={{ width: "22px", height: "22px", color: "var(--md-primary)" }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--md-on-surface)" }}>Public API Explorer</h1>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--md-on-surface-var)" }}>
                Browse 1000+ free APIs from{" "}
                <a href="https://github.com/public-apis/public-apis" target="_blank" rel="noreferrer" style={{ color: "var(--md-primary)", textDecoration: "none", fontWeight: 600 }}>
                  public-apis/public-apis ↗
                </a>
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "24px" }}>
            {[
              { label: "Total APIs",     value: stats.total,  color: "var(--md-primary)" },
              { label: "Free Tier",      value: stats.free,   color: "var(--md-success)" },
              { label: "No Auth Needed", value: stats.noKey,  color: "var(--md-warning)" },
              { label: "Categories",     value: stats.cats,   color: "var(--md-primary)" },
            ].map(s => (
              <div key={s.label} style={{ padding: "16px 20px", borderRadius: "16px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline-var)" }}>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--md-on-surface-var)", marginTop: "2px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--md-on-surface-var)" }} />
            <input
              type="text" placeholder="Search APIs — 'sentiment', 'image', 'crypto'..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", height: "44px", borderRadius: "12px", padding: "0 14px 0 42px", fontSize: "14px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", outline: "none" }}
            />
          </div>
          <button onClick={() => setFreeOnly(p => !p)}
            style={{ height: "44px", padding: "0 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, border: "1.5px solid var(--md-outline)", background: freeOnly ? "var(--md-success-cont)" : "var(--md-surface-1)", color: freeOnly ? "var(--md-success)" : "var(--md-on-surface-var)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            🆓 Free Only
          </button>
          <button onClick={() => setNoAuth(p => !p)}
            style={{ height: "44px", padding: "0 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, border: "1.5px solid var(--md-outline)", background: noAuth ? "var(--md-warning-cont)" : "var(--md-surface-1)", color: noAuth ? "var(--md-warning)" : "var(--md-on-surface-var)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            🔓 No Auth
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ display: "flex", alignItems: "center", gap: "5px", height: "34px", padding: "0 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, border: `1.5px solid ${category === cat ? "var(--md-primary)" : "var(--md-outline)"}`, background: category === cat ? "var(--md-primary-container)" : "var(--md-surface-1)", color: category === cat ? "var(--md-primary)" : "var(--md-on-surface-var)", cursor: "pointer", transition: "all 0.15s" }}>
              {CATEGORY_ICONS[cat] || <Globe style={{ width: "12px", height: "12px" }} />}
              {cat}
              {cat !== "All" && <span style={{ fontSize: "10px", opacity: 0.7 }}>({ALL_APIS.filter(a => a.category === cat).length})</span>}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", marginBottom: "16px" }}>
          Showing <strong style={{ color: "var(--md-on-surface)" }}>{filtered.length}</strong> API{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
          {category !== "All" && ` in ${category}`}
        </p>

        {/* API Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
          {filtered.map(api => {
            const ac = authColor(api.auth);
            const isExp = expanded === api.name;
            return (
              <div key={api.name} style={{ borderRadius: "18px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline-var)", overflow: "hidden", transition: "border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--md-outline)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--md-outline-var)")}>

                <div style={{ padding: "16px 18px" }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--md-on-surface)" }}>{api.name}</span>
                        {api.free && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 800 }}>FREE</span>}
                      </div>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "100px", background: "var(--md-surface-2)", color: "var(--md-on-surface-var)", fontWeight: 600 }}>
                        {CATEGORY_ICONS[api.category]} {api.category}
                      </span>
                    </div>
                    <button onClick={() => setExpanded(isExp ? null : api.name)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)", flexShrink: 0 }}>
                      {isExp ? <ChevronUp style={{ width: "16px", height: "16px" }} /> : <ChevronDown style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>

                  <p style={{ margin: "10px 0 12px", fontSize: "13px", color: "var(--md-on-surface-var)", lineHeight: 1.5 }}>
                    {api.desc}
                  </p>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", fontWeight: 700, background: ac.bg, color: ac.color }}>
                      {api.auth === "No" ? "🔓 No Auth" : api.auth === "OAuth" ? "🔐 OAuth" : "🔑 API Key"}
                    </span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", fontWeight: 700, background: api.https ? "var(--md-success-cont)" : "var(--md-error-cont)", color: api.https ? "var(--md-success)" : "var(--md-error)" }}>
                      {api.https ? "✓ HTTPS" : "✗ HTTP"}
                    </span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", fontWeight: 700, background: api.cors ? "var(--md-success-cont)" : "var(--md-surface-2)", color: api.cors ? "var(--md-success)" : "var(--md-on-surface-var)" }}>
                      {api.cors ? "✓ CORS" : "✗ No CORS"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a href={api.url} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
                      <ExternalLink style={{ width: "12px", height: "12px" }} />
                      Docs
                    </a>
                    <button onClick={() => handleCopy(api.url)}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "10px", background: "var(--md-surface-2)", color: "var(--md-on-surface-var)", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                      {copied === api.url ? <Check style={{ width: "12px", height: "12px" }} /> : <Copy style={{ width: "12px", height: "12px" }} />}
                      {copied === api.url ? "Copied!" : "Copy URL"}
                    </button>
                  </div>
                </div>

                {/* Expanded: code snippet */}
                {isExp && (
                  <div style={{ borderTop: "1px solid var(--md-outline-var)", padding: "14px 18px", background: "var(--md-surface)" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Start</p>
                    <pre style={{ margin: 0, fontSize: "11px", color: "var(--md-primary)", background: "var(--md-surface-2)", padding: "10px 12px", borderRadius: "8px", overflowX: "auto", lineHeight: 1.6 }}>
  {api.auth === "No"
    ? `# No API key needed!\ncurl "${api.url.split("/docs")[0]}/endpoint"`
    : api.auth === "OAuth"
    ? `# OAuth 2.0 — register your app\ncurl -H "Authorization: Bearer YOUR_TOKEN" \\
    "${api.url}"`
    : `# Sign up for a free API key\ncurl -H "Authorization: Bearer YOUR_API_KEY" \\
    "${api.url.split("/docs")[0]}/endpoint"`}
                    </pre>
                    <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--md-on-surface-var)" }}>
                      Use this in your dataset pipeline or{" "}
                      <a href="/dashboard/training" style={{ color: "var(--md-primary)", fontWeight: 600 }}>training jobs</a>{" "}
                      to enrich your data.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--md-on-surface-var)" }}>
            <p style={{ fontSize: "40px", marginBottom: "8px" }}>🔍</p>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--md-on-surface)" }}>No APIs found</p>
            <p style={{ fontSize: "14px" }}>Try a different search term or category</p>
          </div>
        )}

        {/* Footer source attribution */}
        <div style={{ marginTop: "48px", padding: "20px 24px", borderRadius: "16px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline-var)", display: "flex", alignItems: "center", gap: "14px" }}>
          <Star style={{ width: "20px", height: "20px", color: "var(--md-warning)", flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>
              Powered by public-apis/public-apis
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--md-on-surface-var)" }}>
              Community-curated list of 1000+ free public APIs.{" "}
              <a href="https://github.com/public-apis/public-apis" target="_blank" rel="noreferrer" style={{ color: "var(--md-primary)", fontWeight: 600 }}>
                Contribute on GitHub ↗
              </a>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
