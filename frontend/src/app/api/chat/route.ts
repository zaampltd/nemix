import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { message, systemPrompt, temperature } = await req.json();

    // 1. SMART AUTO-ROUTER: Check Firebase for saved keys
    // In production, 'test-user-123' will be the real user ID
    const checkKey = async (providerName: string) => {
      const snap = await getDoc(doc(db, "UserAPIKeys", `test-user-123_${providerName}`));
      return snap.exists() ? snap.data().key : null;
    };

    // Fetch keys directly from the database
    const nvidiaKey = await checkKey("Nvidia");
    const groqKey = await checkKey("Groq");
    const geminiKey = await checkKey("Gemini");

    let reply = "";

    // 2. ROUTE TO THE FIRST AVAILABLE PROVIDER
    if (nvidiaKey) {
      // Use Nvidia Free API
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${nvidiaKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "meta/llama3-8b-instruct",
          messages: [
            { role: "system", content: systemPrompt || "You are a helpful AI." },
            { role: "user", content: message }
          ],
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: 1024
        })
      });
      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.error("Raw Nvidia NIM response:", rawText);
        throw new Error(`Nvidia NIM returned raw text/HTML instead of JSON: ${rawText.substring(0, 100)}...`);
      }
      if (!res.ok) throw new Error(data.detail || "Nvidia API Error");
      reply = `[Routed via Nvidia NIM] ${data.choices[0].message.content}`;
    } 
    else if (groqKey) {
      // Use Groq
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemPrompt || "You are a helpful AI." },
            { role: "user", content: message }
          ],
          temperature: parseFloat(temperature) || 0.7
        })
      });
      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.error("Raw Groq response:", rawText);
        throw new Error(`Groq returned raw text/HTML instead of JSON: ${rawText.substring(0, 100)}...`);
      }
      if (!res.ok) throw new Error(data.error?.message || "Groq API Error");
      reply = `[Routed via Groq] ${data.choices[0].message.content}`;
    }
    else if (geminiKey) {
       // Use Gemini
       const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt || "You are a helpful AI." } },
          contents: [{ parts: [{ text: message }] }],
          generationConfig: { temperature: parseFloat(temperature) || 0.7 }
        })
      });
      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.error("Raw Gemini response:", rawText);
        throw new Error(`Gemini returned raw text/HTML instead of JSON: ${rawText.substring(0, 100)}...`);
      }
      if (!res.ok) throw new Error(data.error?.message || "Gemini Error");
      reply = `[Routed via Google Gemini] ${data.candidates[0].content.parts[0].text}`;
    }
    else {
      // No active keys found
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
