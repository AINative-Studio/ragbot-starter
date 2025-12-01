import { http, HttpResponse, delay } from 'msw';

const ZERODB_API_URL = process.env.ZERODB_API_URL || 'https://api.ainative.studio';
const META_BASE_URL = process.env.META_BASE_URL || 'https://api.llama.com/compat/v1';

// Mock data for ZeroDB search results
const mockSearchResults = {
  results: [
    {
      id: 'doc-1',
      text: 'ZeroDB is a managed vector database with built-in embeddings API. It uses BAAI/bge-small-en-v1.5 for generating embeddings.',
      document: 'ZeroDB is a managed vector database with built-in embeddings API.',
      metadata: {
        document_id: 'doc-1',
        url: 'https://docs.zerodb.com/intro',
        title: 'Introduction to ZeroDB',
        similarity_metric: 'cosine',
      },
      score: 0.92,
    },
    {
      id: 'doc-2',
      text: 'You can use ZeroDB for semantic search, RAG systems, and similarity matching.',
      document: 'You can use ZeroDB for semantic search, RAG systems, and similarity matching.',
      metadata: {
        document_id: 'doc-2',
        url: 'https://docs.zerodb.com/use-cases',
        title: 'ZeroDB Use Cases',
        similarity_metric: 'cosine',
      },
      score: 0.88,
    },
  ],
  total: 2,
  processing_time_ms: 45,
};

// Mock streaming response for Meta Llama
const createStreamingResponse = (content: string) => {
  const chunks = content.split(' ');
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i] + (i < chunks.length - 1 ? ' ' : '');
        const sseData = `data: ${JSON.stringify({
          id: 'chatcmpl-' + Math.random(),
          object: 'chat.completion.chunk',
          created: Date.now(),
          model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
          choices: [{
            index: 0,
            delta: { content: chunk },
            finish_reason: null,
          }],
        })}\n\n`;

        controller.enqueue(encoder.encode(sseData));
        await delay(10); // Simulate streaming delay
      }

      // Send finish message
      const finishData = `data: ${JSON.stringify({
        id: 'chatcmpl-' + Math.random(),
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop',
        }],
      })}\n\n`;

      controller.enqueue(encoder.encode(finishData));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return stream;
};

export const handlers = [
  // ZeroDB Authentication
  http.post(`${ZERODB_API_URL}/v1/public/auth/login`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const username = params.get('username');
    const password = params.get('password');

    if (username === 'test@example.com' && password === 'test-password') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token-12345',
        token_type: 'bearer',
        expires_in: 3600,
      });
    }

    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // ZeroDB Semantic Search
  http.post(`${ZERODB_API_URL}/v1/public/:projectId/embeddings/search`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json() as any;
    const { query, limit, threshold, namespace } = body;

    // Simulate different responses based on query
    if (query === '') {
      return HttpResponse.json(
        { detail: 'Query cannot be empty' },
        { status: 400 }
      );
    }

    if (query.length > 2000) {
      return HttpResponse.json(
        { detail: 'Query too long. Maximum length is 2000 characters.' },
        { status: 400 }
      );
    }

    // Simulate empty results for certain queries
    if (query.toLowerCase().includes('nonexistent')) {
      return HttpResponse.json({
        results: [],
        total: 0,
        processing_time_ms: 23,
      });
    }

    await delay(50); // Simulate network latency

    return HttpResponse.json(mockSearchResults);
  }),

  // ZeroDB Embed and Store
  http.post(`${ZERODB_API_URL}/v1/public/:projectId/embeddings/embed-and-store`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json() as any;
    const { texts, metadata_list, namespace, model } = body;

    return HttpResponse.json({
      vectors_stored: texts.length,
      model: model || 'BAAI/bge-small-en-v1.5',
      dimensions: 384,
      namespace: namespace,
      processing_time_ms: texts.length * 15,
    });
  }),

  // Meta Llama Chat Completions (Streaming)
  http.post(`${META_BASE_URL}/chat/completions`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: { message: 'Invalid API key', type: 'invalid_request_error' } },
        { status: 401 }
      );
    }

    const body = await request.json() as any;
    const { messages, stream, model } = body;

    if (!messages || messages.length === 0) {
      return HttpResponse.json(
        { error: { message: 'Messages array is required', type: 'invalid_request_error' } },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content || '';

    // Generate a contextual response
    let responseText = 'Based on the context provided, ZeroDB is a managed vector database that provides built-in embeddings API using the BAAI/bge-small-en-v1.5 model. It simplifies semantic search and RAG implementations.';

    if (content.toLowerCase().includes('error')) {
      responseText = 'I encountered an error processing your request.';
    } else if (content.toLowerCase().includes('price') || content.toLowerCase().includes('cost')) {
      responseText = 'ZeroDB offers a free tier with HuggingFace-based embeddings. For pricing details, please visit the AINative Studio dashboard.';
    } else if (content.toLowerCase().includes('how')) {
      responseText = 'To use ZeroDB, you need to: 1) Create a project in AINative Studio, 2) Enable the vector database feature, 3) Use the REST API or SDK to store and search vectors. The built-in embeddings API makes it very simple.';
    }

    if (stream) {
      return new HttpResponse(createStreamingResponse(responseText), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    return HttpResponse.json({
      id: 'chatcmpl-' + Math.random(),
      object: 'chat.completion',
      created: Date.now(),
      model: model || 'Llama-4-Maverick-17B-128E-Instruct-FP8',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseText,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),
];

// Error simulation handlers for edge case testing
export const errorHandlers = {
  zerodbTimeout: http.post(`${ZERODB_API_URL}/v1/public/:projectId/embeddings/search`, async () => {
    await delay(10000);
    return HttpResponse.json({ detail: 'Request timeout' }, { status: 408 });
  }),

  zerodbServerError: http.post(`${ZERODB_API_URL}/v1/public/:projectId/embeddings/search`, async () => {
    return HttpResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }),

  metaLlamaServerError: http.post(`${META_BASE_URL}/chat/completions`, async () => {
    return HttpResponse.json(
      { error: { message: 'Service temporarily unavailable', type: 'server_error' } },
      { status: 503 }
    );
  }),

  zerodbAuthError: http.post(`${ZERODB_API_URL}/v1/public/auth/login`, async () => {
    return HttpResponse.json(
      { detail: 'Authentication service unavailable' },
      { status: 503 }
    );
  }),

  metaLlamaRateLimit: http.post(`${META_BASE_URL}/chat/completions`, async () => {
    return HttpResponse.json(
      { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
      { status: 429 }
    );
  }),
};

export const emptyResultsHandler = http.post(
  `${ZERODB_API_URL}/v1/public/:projectId/embeddings/search`,
  async () => {
    return HttpResponse.json({
      results: [],
      total: 0,
      processing_time_ms: 15,
    });
  }
);
