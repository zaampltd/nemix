import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Adjust this path if your firebase config is elsewhere
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { message, chatHistory, systemPrompt, temperature } = await req.json();

    // 1. Fetch saved keys from Firebase using STRICT string matching
    const checkKey = async (providerName: string) => {
      // In production, 'test-user-123' will be dynamically replaced by authenticated user ID
      const snap = await getDoc(doc(db, "UserAPIKeys", `test-user-123_${providerName}`));
      return snap.exists() ? snap.data().key : null;
    };

    const nvidiaKey = await checkKey("Nvidia");
    const groqKey = await checkKey("Groq");
    const geminiKey = await checkKey("Gemini");

    let reply = "";

    // Helper to safely fetch and parse text/JSON from providers
    const safeFetch = async (url: string, options: any, providerName: string) => {
      const res = await fetch(url, options);
      const rawText = await res.text();
      if (!res.ok) {
        throw new Error(`${providerName} Error (${res.status}): ${rawText.substring(0, 150)}...`);
      }
      try {
        return JSON.parse(rawText);
      } catch (err) {
        console.error(`${providerName} Raw Error:`, rawText);
        throw new Error(`${providerName} returned invalid JSON: ${rawText.substring(0, 100)}...`);
      }
    };

    // Format OpenAI messages array using Conversational History
    const formattedMessages = chatHistory && Array.isArray(chatHistory)
      ? [
          { role: "system", content: systemPrompt || "You are a helpful AI." },
          ...chatHistory.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text
          }))
        ]
      : [
          { role: "system", content: systemPrompt || "You are a helpful AI." },
          { role: "user", content: message }
        ];

    // Format Gemini contents using Conversational History
    const geminiContents = chatHistory && Array.isArray(chatHistory)
      ? chatHistory.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }))
      : [{ role: "user", parts: [{ text: message }] }];

    // 2. Route to first available provider
    if (nvidiaKey) {
      const data = await safeFetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${nvidiaKey}`, 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-8b-instruct", // Updated to the latest 3.1 model
            messages: formattedMessages,
            temperature: parseFloat(temperature) || 0.7,
            max_tokens: 1024
          })
        },
        "Nvidia NIM"
      );
      reply = `[Routed via Nvidia NIM] ${data.choices[0].message.content}`;
    } 
    else if (groqKey) {
      const data = await safeFetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: formattedMessages,
            temperature: parseFloat(temperature) || 0.7
          })
        },
        "Groq"
      );
      reply = `[Routed via Groq] ${data.choices[0].message.content}`;
    }
    else if (geminiKey) {
      const data = await safeFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: { text: systemPrompt || "You are a helpful AI." } },
            contents: geminiContents,
            generationConfig: { temperature: parseFloat(temperature) || 0.7 }
          })
        },
        "Google Gemini"
      );
      reply = `[Routed via Google Gemini] ${data.candidates[0].content.parts[0].text}`;
    }
    else {
      return NextResponse.json(
        { error: "No active API keys found. Please secure your API keys on the Provider Integrations page to interact." },
        { status: 400 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Playground API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
