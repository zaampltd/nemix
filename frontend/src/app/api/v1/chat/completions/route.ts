import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    // 1. Extract the Authorization header (Bearer token) to get the user's Nvmix API Key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or malformed Authorization header. Must be "Bearer <NVMIX_API_KEY>"' },
        { status: 401, headers: corsHeaders }
      );
    }

    const nvmixApiKey = authHeader.split(' ')[1]?.trim();
    if (!nvmixApiKey || !nvmixApiKey.startsWith('nvx_')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Nvmix API Key. Keys must start with "nvx_"' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Extract the messages array from the incoming JSON body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing "messages" array in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Nvmix Inference Server integration
    const inferenceUrl = process.env.NVMIX_INFERENCE_URL;

    if (inferenceUrl && inferenceUrl.trim().length > 0) {
      try {
        const response = await fetch(inferenceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvmixApiKey}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, {
          status: response.status,
          headers: corsHeaders,
        });
      } catch (fetchError: any) {
        return NextResponse.json(
          {
            error: {
              message: fetchError?.message || 'Proprietary Nvmix inference server is currently unreachable.',
              type: 'inference_error',
              code: 'unreachable',
            },
          },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    // 4. Simulated AI Processing Fallback (No Third Parties)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const lowerMessage = lastUserMessage.toLowerCase();
    let simulatedResponseContent = 'Nvmix Engine processing complete. Ready to orchestrate tasks.';

    // Smart contextual responses to simulate proprietary inference
    if (lowerMessage.includes('roles') || lowerMessage.includes('roles required') || lowerMessage.includes('generate')) {
      // Mock Agent Generation response
      simulatedResponseContent = JSON.stringify([
        { id: "agent_ceo", role: "CEO (Chief Executive Officer)", name: "Nvmix-CEO-Alpha", avatar: "💼", status: "working" },
        { id: "agent_architect", role: "Software Architect", name: "Architect-Bot", avatar: "📐", status: "sleeping" },
        { id: "agent_coder", role: "Lead Developer", name: "Code-Engine-v4", avatar: "💻", status: "sleeping" },
        { id: "agent_qa", role: "QA & Security Auditor", name: "Shield-Auditor", avatar: "🛡️", status: "sleeping" }
      ]);
    } else if (lowerMessage.includes('write python') || lowerMessage.includes('code for') || lowerMessage.includes('bootstrap')) {
      // Mock Code Generation response
      simulatedResponseContent = `# Proprietary Nvmix AI Engine output\n# Task: ${lastUserMessage}\n\ndef run():\n    print("Nvmix local task execution: success")\n    return True\n`;
    }

    const mockCompletion = {
      id: `nvmix-chat-${Math.random().toString(36).substring(2, 11)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'nvmix-inference-v1',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: simulatedResponseContent,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: messages.length * 10,
        completion_tokens: simulatedResponseContent.length / 4,
        total_tokens: (messages.length * 10) + (simulatedResponseContent.length / 4),
      },
    };

    return NextResponse.json(mockCompletion, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          message: error?.message || 'Nvmix Gateway encountered an internal processing error.',
          type: 'gateway_error',
          code: 'internal_error',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
