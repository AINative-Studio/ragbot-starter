// Using node-fetch for Meta Llama API calls (avoiding OpenAI SDK undici timeout issues)
import nodeFetch from 'node-fetch';
import { pipeline } from '@xenova/transformers';

// Note: Using node-fetch directly instead of OpenAI SDK to avoid undici timeout issues

const ZERODB_API_URL = process.env.ZERODB_API_URL!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;
const ZERODB_API_KEY = process.env.ZERODB_API_KEY!;
const ZERODB_NAMESPACE = process.env.ZERODB_NAMESPACE || 'transmutes_only';
const ZERODB_TOP_K = parseInt(process.env.ZERODB_TOP_K || '5');
const ZERODB_SIMILARITY_THRESHOLD = parseFloat(process.env.ZERODB_SIMILARITY_THRESHOLD || '0.7');

// Initialize embedding model (384-dim)
let embedder: any = null;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
  }
  return embedder;
}

export async function POST(req: Request) {
  try {
    const {messages, useRag, llm, similarityMetric} = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = '';
    let sources: string[] = [];
    if (useRag) {
      console.log('🔮 Generating query embedding locally (384-dim)...');
      // Generate embedding for query using local model
      const embeddingModel = await getEmbedder();
      const output = await embeddingModel(latestMessage, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(output.data);
      console.log(`✅ Generated ${queryVector.length}-dim embedding`);

      console.log('🔍 Searching ZeroDB knowledge base...');
      // Search using direct vector search endpoint
      const searchResponse = await nodeFetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/database/vectors/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ZERODB_API_KEY,
        },
        body: JSON.stringify({
          query_vector: queryVector,
          limit: ZERODB_TOP_K,
          threshold: ZERODB_SIMILARITY_THRESHOLD,
          namespace: ZERODB_NAMESPACE,
          filter_metadata: similarityMetric ? { similarity_metric: similarityMetric } : undefined
        })
      });

      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        console.error(`❌ ZeroDB search failed: ${searchResponse.status} - ${error}`);
        // NO GRACEFUL DEGRADATION - Return error to user
        return new Response(
          JSON.stringify({
            error: 'Knowledge base unavailable. I can only answer questions based on spiritual wisdom teachings from my knowledge base. Please try again in a moment.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const searchResults = await searchResponse.json();
      const documents = searchResults.vectors || [];
      console.log(`✅ Found ${documents.length} relevant documents`);

      // Debug: log first document structure
      if (documents.length > 0) {
        console.log('Sample document structure:', JSON.stringify(documents[0], null, 2).substring(0, 500));
      }

      if (documents.length === 0) {
        // NO GRACEFUL DEGRADATION - If no documents found, inform user
        return new Response(
          "I apologize, but I couldn't find any relevant teachings in my knowledge base to answer your question. My responses are based solely on the spiritual wisdom teachings I have access to. Please try rephrasing your question or ask about topics related to meditation, self-inquiry, consciousness, or spiritual practice.",
          {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      }

      // Extract sources - show top 3-5 most relevant
      sources = documents.slice(0, 5).map((doc: any, idx: number) => {
        // Try to get title from metadata first
        const metadataTitle = doc.metadata?.title || doc.metadata?.source || doc.metadata?.name;
        if (metadataTitle) return metadataTitle;

        const text = doc.document || doc.text || '';
        const lines = text.split('\n').filter((l: string) => l.trim().length > 0);

        // Find the first meaningful line (skip separators and very short lines)
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 15 && trimmed !== '---' && !trimmed.startsWith('http')) {
            return trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed;
          }
        }

        return `Source ${idx + 1}`;
      });

      docContext = `
        START CONTEXT
        ${documents.map((doc: any) => doc.document || doc.text || '').join("\n\n---\n\n")}
        END CONTEXT
      `;
    }

    const ragPrompt = [
      {
        role: 'system',
        content: `You are a wise spiritual guide helping seekers explore ancient wisdom and enlightenment teachings. Format responses using markdown where applicable.

        CRITICAL INSTRUCTION: You MUST ONLY use the wisdom provided in the context below. DO NOT use any knowledge outside of the provided context. Your responses must be based exclusively on the teachings contained between START CONTEXT and END CONTEXT.

        ${docContext}

        Guidelines for Responses:
        - Base ALL responses on the provided context only - this is non-negotiable
        - Feel free to paraphrase, synthesize, and present the teachings in your own words
        - Combine insights from multiple sources in the context to create comprehensive answers
        - Draw connections between related teachings to provide deeper understanding
        - Use a compassionate, contemplative tone that honors these spiritual traditions
        - Format responses with markdown for clarity and readability
        - Make each response unique by presenting the wisdom in different ways while staying true to the source material
        - If appropriate, use metaphors or examples that are already present in the context
        - You can present the same teaching in different ways depending on how the question is asked

        IMPORTANT: Paraphrasing and synthesis are encouraged, but you must NEVER introduce concepts, ideas, or knowledge that don't exist in the context above. Every insight you share must be traceable back to the provided teachings.
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
    let content = data.choices[0]?.message?.content || '';

    // Append sources if RAG was used - using special delimiter for frontend parsing
    if (useRag && sources.length > 0) {
      const uniqueSources = Array.from(new Set(sources)); // Remove duplicates
      console.log('Unique sources:', uniqueSources);

      if (uniqueSources.length > 0) {
        // Add sources as JSON after a special delimiter
        content += `\n\n___SOURCES___\n${JSON.stringify(uniqueSources.slice(0, 5))}`;
      }
    }

    return new Response(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (e) {
    console.error('Meta Llama API Error:', e);
    throw e;
  }
}
