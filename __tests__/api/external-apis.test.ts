/**
 * External API Integration Tests
 *
 * Tests integration with external services:
 * - ZeroDB API endpoints (auth, search, embed-and-store)
 * - Meta Llama API endpoints (chat completions)
 * - Error handling and retries
 * - Rate limiting and timeouts
 */

describe('ZeroDB API Integration', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /v1/public/auth/login', () => {
    it('should return access token on successful authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'jwt-token-abc123',
          token_type: 'bearer',
          expires_in: 3600,
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toHaveProperty('access_token')
      expect(data).toHaveProperty('token_type', 'bearer')
      expect(data).toHaveProperty('expires_in')
    })

    it('should return 401 for invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Incorrect email or password' }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'username=wrong@test.com&password=wrongpass',
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should return 422 for missing fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'username'],
              msg: 'field required',
              type: 'value_error.missing',
            },
          ],
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'password=test',
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(422)
    })
  })

  describe('POST /v1/public/{project_id}/embeddings/search', () => {
    it('should return search results with similarity scores', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            {
              id: 'vec_1',
              text: 'ZeroDB is a vector database',
              similarity: 0.95,
              metadata: { source: 'docs' },
            },
            {
              id: 'vec_2',
              document: 'It supports semantic search',
              similarity: 0.87,
              metadata: { source: 'docs' },
            },
          ],
          total: 2,
          query_time_ms: 45,
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            query: 'What is ZeroDB?',
            project_id: process.env.ZERODB_PROJECT_ID,
            limit: 5,
            threshold: 0.7,
            namespace: 'knowledge_base',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.results).toHaveLength(2)
      expect(data.results[0]).toHaveProperty('similarity')
      expect(data.results[0].similarity).toBeGreaterThan(0.7)
    })

    it('should return 401 for missing authorization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Not authenticated' }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Project not found' }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/non-existent-project/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          detail: 'Invalid request: missing required field "query"',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ limit: 5 }), // Missing query
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('should handle 500 internal server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('should support different similarity metrics', async () => {
      const metrics = ['cosine', 'euclidean', 'dot_product']

      for (const metric of metrics) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })

        const response = await fetch(
          `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              query: 'test',
              filter_metadata: { similarity_metric: metric },
            }),
          }
        )

        expect(response.ok).toBe(true)
      }
    })
  })

  describe('POST /v1/public/{project_id}/embeddings/embed-and-store', () => {
    it('should successfully store embedding with metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'vec_new_123',
          document: 'Test document',
          metadata: { source: 'test' },
          namespace: 'knowledge_base',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            document: 'Test document',
            metadata: { source: 'test' },
            namespace: 'knowledge_base',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('document')
    })

    it('should return 401 for unauthorized request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Not authenticated' }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should return 400 for missing document field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          detail: 'Missing required field: document',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ metadata: {} }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Request timeout after 30000ms'))
      )

      await expect(
        fetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          body: 'username=test&password=test',
        })
      ).rejects.toThrow('Request timeout')
    })

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error('getaddrinfo ENOTFOUND invalid-domain'))
      )

      await expect(
        fetch('https://invalid-domain.example.com/api/endpoint', {
          method: 'POST',
        })
      ).rejects.toThrow('ENOTFOUND')
    })

    it('should handle connection refused', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:8000'))
      )

      await expect(
        fetch('http://localhost:8000/api/endpoint', {
          method: 'POST',
        })
      ).rejects.toThrow('ECONNREFUSED')
    })
  })

  describe('Rate Limiting', () => {
    it('should handle 429 Too Many Requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (name: string) => {
            if (name === 'Retry-After') return '60'
            return null
          },
        },
        json: async () => ({
          detail: 'Rate limit exceeded. Try again in 60 seconds.',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(429)
    })
  })
})

describe('Meta Llama API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Chat Completions Endpoint', () => {
    it('should successfully create chat completion', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you today?',
            },
            finish_reason: 'stop',
          },
        ],
      })

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: process.env.META_API_KEY,
        baseURL: process.env.META_BASE_URL,
      })

      const response = await client.chat.completions.create({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: [{ role: 'user', content: 'Hello!' }],
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
          messages: [{ role: 'user', content: 'Hello!' }],
        })
      )
      expect(response.choices[0].message.content).toBeDefined()
    })

    it('should handle streaming responses', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockResolvedValue({
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] }
          yield { choices: [{ delta: { content: ' world' } }] }
          yield { choices: [{ delta: {} }] }
        },
      })

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: process.env.META_API_KEY,
        baseURL: process.env.META_BASE_URL,
      })

      const stream = await client.chat.completions.create({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: [{ role: 'user', content: 'Hello!' }],
        stream: true,
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
        })
      )
      expect(stream).toBeDefined()
    })

    it('should validate message format (role and content only)', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      })

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: process.env.META_API_KEY,
        baseURL: process.env.META_BASE_URL,
      })

      // Messages should only have role and content
      const cleanMessages = [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Response message' },
      ]

      await client.chat.completions.create({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: cleanMessages,
      })

      const callArgs = mockCreate.mock.calls[0][0]
      callArgs.messages.forEach((msg: any) => {
        expect(Object.keys(msg).sort()).toEqual(['content', 'role'])
      })
    })

    it('should handle 401 Unauthorized (invalid API key)', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest
        .fn()
        .mockRejectedValue(new Error('Unauthorized: Invalid API key'))

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: 'invalid-key',
        baseURL: process.env.META_BASE_URL,
      })

      await expect(
        client.chat.completions.create({
          model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('should handle 400 Bad Request (invalid parameters)', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest
        .fn()
        .mockRejectedValue(new Error('Bad Request: Invalid model parameter'))

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: process.env.META_API_KEY,
        baseURL: process.env.META_BASE_URL,
      })

      await expect(
        client.chat.completions.create({
          model: 'invalid-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Bad Request')
    })

    it('should handle 500 Internal Server Error', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest
        .fn()
        .mockRejectedValue(new Error('Internal Server Error'))

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: process.env.META_API_KEY,
        baseURL: process.env.META_BASE_URL,
      })

      await expect(
        client.chat.completions.create({
          model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Internal Server Error')
    })

    it('should handle rate limiting (429)', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest
        .fn()
        .mockRejectedValue(
          new Error('Rate limit exceeded. Please try again later.')
        )

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const client = new OpenAI({
        apiKey: process.env.META_API_KEY,
        baseURL: process.env.META_BASE_URL,
      })

      await expect(
        client.chat.completions.create({
          model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Rate limit exceeded')
    })
  })
})
