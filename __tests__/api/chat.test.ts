/**
 * API Route Tests for /api/chat
 *
 * Tests the chat endpoint including:
 * - Valid request handling with streaming responses
 * - Error handling for invalid inputs
 * - ZeroDB integration with RAG
 * - Meta Llama API integration
 * - Message cleaning and validation
 */

import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  }
})

// Mock AI SDK streaming
jest.mock('ai', () => ({
  OpenAIStream: jest.fn((response) => {
    const encoder = new TextEncoder()
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('Test response'))
        controller.close()
      },
    })
  }),
  StreamingTextResponse: jest.fn((stream) => {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }),
}))

describe('POST /api/chat', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Valid Requests', () => {
    it('should return 200 with streaming response for valid request', async () => {
      // Mock successful authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token-123' }),
      })

      // Mock successful ZeroDB search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { text: 'Sample document 1', similarity: 0.95 },
            { text: 'Sample document 2', similarity: 0.85 },
          ],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'What is ZeroDB?' },
          ],
          useRag: true,
          llm: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
          similarityMetric: 'cosine',
        }),
      })

      const response = await POST(request)

      expect(response).toBeDefined()
      expect(response.headers.get('Content-Type')).toContain('text/plain')

      // Verify authentication was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/public/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      )

      // Verify ZeroDB search was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/embeddings/search'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      )
    })

    it('should handle request without RAG (useRag=false)', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' },
          ],
          useRag: false,
          llm: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        }),
      })

      const response = await POST(request)

      expect(response).toBeDefined()
      expect(response.headers.get('Content-Type')).toContain('text/plain')

      // Should not call ZeroDB when useRag is false
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should clean messages by removing extra properties', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ delta: { content: 'Response' } }],
      })
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Test message',
              extraProperty: 'should be removed',
              anotherExtra: 'also removed'
            },
          ],
          useRag: false,
        }),
      })

      await POST(request)

      // Verify that messages were cleaned (only role and content remain)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: expect.any(String),
              content: expect.any(String),
            }),
          ]),
        })
      )

      // Verify no extra properties
      const callArgs = mockCreate.mock.calls[0][0]
      callArgs.messages.forEach((msg: any) => {
        expect(Object.keys(msg)).toEqual(['role', 'content'])
      })
    })
  })

  describe('Error Handling - Invalid Inputs', () => {
    it('should handle missing messages field', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          useRag: true,
          llm: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        }),
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle invalid LLM model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockRejectedValue(
        new Error('Invalid model specified')
      )
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: false,
          llm: 'invalid-model-name',
        }),
      })

      await expect(POST(request)).rejects.toThrow('Invalid model specified')
    })

    it('should handle invalid similarity metric gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
          similarityMetric: 'invalid-metric',
        }),
      })

      // Should not throw - backend will validate
      const response = await POST(request)
      expect(response).toBeDefined()
    })
  })

  describe('Error Handling - ZeroDB Authentication', () => {
    it('should handle ZeroDB authentication failure (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await expect(POST(request)).rejects.toThrow('Authentication failed: 401')
    })

    it('should handle ZeroDB authentication failure (403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await expect(POST(request)).rejects.toThrow('Authentication failed: 403')
    })
  })

  describe('Error Handling - ZeroDB Search', () => {
    it('should handle ZeroDB search failure (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await expect(POST(request)).rejects.toThrow('ZeroDB search failed: 500')
    })

    it('should handle ZeroDB search failure (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Project not found',
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await expect(POST(request)).rejects.toThrow('ZeroDB search failed: 404')
    })

    it('should handle network timeout for ZeroDB', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await expect(POST(request)).rejects.toThrow('Network timeout')
    })
  })

  describe('Error Handling - Meta Llama API', () => {
    it('should handle Meta Llama API failure', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockRejectedValue(
        new Error('Meta Llama API Error: Rate limit exceeded')
      )
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: false,
        }),
      })

      await expect(POST(request)).rejects.toThrow('Meta Llama API Error')
    })

    it('should handle Meta Llama 401 Unauthorized', async () => {
      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockRejectedValue(
        new Error('Unauthorized: Invalid API key')
      )
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: false,
        }),
      })

      await expect(POST(request)).rejects.toThrow('Unauthorized')
    })
  })

  describe('RAG Context Integration', () => {
    it('should include ZeroDB search results in context when useRag=true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { text: 'ZeroDB is a vector database', similarity: 0.95 },
            { document: 'It supports semantic search', similarity: 0.85 },
          ],
        }),
      })

      const OpenAI = require('openai').default
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ delta: { content: 'Response' } }],
      })
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'What is ZeroDB?' }],
          useRag: true,
          similarityMetric: 'cosine',
        }),
      })

      await POST(request)

      // Verify system message includes context
      const callArgs = mockCreate.mock.calls[0][0]
      const systemMessage = callArgs.messages.find((m: any) => m.role === 'system')
      expect(systemMessage.content).toContain('START CONTEXT')
      expect(systemMessage.content).toContain('END CONTEXT')
      expect(systemMessage.content).toContain('ZeroDB is a vector database')
      expect(systemMessage.content).toContain('It supports semantic search')
    })

    it('should send correct parameters to ZeroDB search endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test query' }],
          useRag: true,
          similarityMetric: 'euclidean',
        }),
      })

      await POST(request)

      // Verify search call parameters
      const searchCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/embeddings/search')
      )
      expect(searchCall).toBeDefined()

      const searchBody = JSON.parse(searchCall[1].body)
      expect(searchBody).toMatchObject({
        query: 'Test query',
        project_id: 'test-project-id',
        limit: 5,
        threshold: 0.7,
        namespace: 'knowledge_base',
        filter_metadata: { similarity_metric: 'euclidean' },
        model: 'BAAI/bge-small-en-v1.5',
      })
    })
  })
})
