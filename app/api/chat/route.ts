// Using node-fetch for Meta Llama API calls (avoiding OpenAI SDK undici timeout issues)
import nodeFetch from 'node-fetch';

// Note: Using node-fetch directly instead of OpenAI SDK to avoid undici timeout issues

const ZERODB_API_URL = process.env.ZERODB_API_URL!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL!;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!;

// Get JWT token from ZeroDB
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const {messages, useRag, llm, similarityMetric} = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = '';
    if (useRag) {
      // Get JWT token for ZeroDB authentication
      const token = await getAuthToken();

      // Use ZeroDB's semantic search endpoint with built-in embeddings API
      // ZeroDB automatically generates embeddings from the query using BAAI/bge-small-en-v1.5
      // No need for separate embedding service!
      const searchResponse = await fetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: latestMessage,
          project_id: ZERODB_PROJECT_ID,
          limit: 5,
          threshold: 0.7,
          namespace: "knowledge_base",
          filter_metadata: { similarity_metric: similarityMetric },
          model: "BAAI/bge-small-en-v1.5" // Free HuggingFace embeddings
        })
      });

      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        throw new Error(`ZeroDB search failed: ${searchResponse.status} - ${error}`);
      }

      const searchResults = await searchResponse.json();
      const documents = searchResults.results || [];

      docContext = `
        START CONTEXT
        ${documents.map((doc: any) => doc.text || doc.document || '').join("\n")}
        END CONTEXT
      `
    }

    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant for AINative Studio, helping users understand ZeroDB and our AI infrastructure services. Format responses using markdown where applicable.

        You specialize in:
        - ZeroDB: Our managed vector database with built-in embeddings API
        - Embeddings API: Free HuggingFace-based embeddings (BAAI/bge-small-en-v1.5, 384 dimensions)
        - Meta Llama integration: How to use Llama models for chat completions
        - RAG (Retrieval-Augmented Generation) systems
        - Authentication with JWT tokens

        ${docContext}

        If the answer is not provided in the context, say "I don't have that information in my knowledge base, but I can help you find it in the ZeroDB documentation."
      `,
      },
    ]

    // Clean messages - only keep role and content, remove any extra properties
    const cleanMessages = [...ragPrompt, ...messages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('Sending to Meta Llama:', JSON.stringify({
      model: llm ?? process.env.META_MODEL,
      messageCount: cleanMessages.length,
      messages: cleanMessages
    }, null, 2));

    // Use node-fetch with AbortController for reliable timeout handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const apiResponse = await nodeFetch(`${process.env.META_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.META_API_KEY}`,
      },
      body: JSON.stringify({
        model: llm ?? process.env.META_MODEL ?? 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: cleanMessages,
        max_tokens: 1000,
      }),
      signal: controller.signal as any,
    });

    clearTimeout(timeout);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Meta Llama API error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    const content = data.choices[0]?.message?.content || '';

    return new Response(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (e) {
    console.error('Meta Llama API Error:', e);
    throw e;
  }
}
