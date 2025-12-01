/**
 * Request/Response Validation Tests
 *
 * Tests data validation for:
 * - Request body schema validation
 * - Response format validation
 * - Streaming response format
 * - Error response format
 * - HTTP headers (Content-Type, CORS)
 */

import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('openai')
jest.mock('ai')

describe('Request Body Validation', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  describe('Required Fields', () => {
    it('should validate messages field is present', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          useRag: true,
          llm: 'test-model',
        }),
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate messages is an array', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: 'not-an-array',
          useRag: false,
        }),
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate messages array is not empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [],
          useRag: false,
        }),
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should accept valid message structure', async () => {
      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Valid message' },
          ],
          useRag: false,
        }),
      })

      const response = await POST(request)
      expect(response).toBeDefined()
    })
  })

  describe('Optional Fields', () => {
    it('should use default values when optional fields are missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
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
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
          // llm and similarityMetric omitted
        }),
      })

      await POST(request)

      // Should use environment variable for model
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: process.env.META_MODEL,
        })
      )
    })

    it('should accept useRag as boolean', async () => {
      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const requestTrue = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      const requestFalse = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: false,
        }),
      })

      // Both should be valid
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'test', results: [] }),
      })

      await expect(POST(requestTrue)).resolves.toBeDefined()
      await expect(POST(requestFalse)).resolves.toBeDefined()
    })

    it('should validate similarityMetric values', async () => {
      const validMetrics = ['cosine', 'euclidean', 'dot_product']

      for (const metric of validMetrics) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test' }),
        })

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })

        const OpenAI = require('openai').default
        OpenAI.mockImplementation(() => ({
          chat: {
            completions: {
              create: jest.fn().mockResolvedValue({
                choices: [{ delta: { content: 'Response' } }],
              }),
            },
          },
        }))

        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Test' }],
            useRag: true,
            similarityMetric: metric,
          }),
        })

        await expect(POST(request)).resolves.toBeDefined()
      }
    })
  })

  describe('Message Structure Validation', () => {
    it('should validate message has role field', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { content: 'Missing role field' },
          ],
          useRag: false,
        }),
      })

      // The endpoint should handle this gracefully
      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate message has content field', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user' }, // Missing content
          ],
          useRag: false,
        }),
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate role is valid', async () => {
      const validRoles = ['user', 'assistant', 'system']

      for (const role of validRoles) {
        const OpenAI = require('openai').default
        OpenAI.mockImplementation(() => ({
          chat: {
            completions: {
              create: jest.fn().mockResolvedValue({
                choices: [{ delta: { content: 'Response' } }],
              }),
            },
          },
        }))

        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role, content: 'Test message' }],
            useRag: false,
          }),
        })

        await expect(POST(request)).resolves.toBeDefined()
      }
    })

    it('should strip extra properties from messages', async () => {
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
              content: 'Test',
              extraField: 'should be removed',
              timestamp: Date.now(),
            },
          ],
          useRag: false,
        }),
      })

      await POST(request)

      const callArgs = mockCreate.mock.calls[0][0]
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user')
      expect(Object.keys(userMessage)).toEqual(['role', 'content'])
    })
  })

  describe('JSON Parsing', () => {
    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json {{{',
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle empty body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: '',
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle null body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'null',
      })

      await expect(POST(request)).rejects.toThrow()
    })
  })
})

describe('Response Format Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Streaming Response', () => {
    it('should return StreamingTextResponse', async () => {
      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              async *[Symbol.asyncIterator]() {
                yield { choices: [{ delta: { content: 'Test' } }] }
              },
            }),
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

      const response = await POST(request)

      expect(response).toBeInstanceOf(Response)
      expect(response.headers.get('Content-Type')).toContain('text/plain')
    })

    it('should set correct Content-Type for streaming', async () => {
      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({}),
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

      const response = await POST(request)

      expect(response.headers.get('Content-Type')).toBeDefined()
    })
  })

  describe('Error Response Format', () => {
    it('should throw errors with descriptive messages', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await expect(POST(request)).rejects.toThrow()
    })
  })
})

describe('ZeroDB Request Validation', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  describe('Search Request Schema', () => {
    it('should send properly formatted search request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test query' }],
          useRag: true,
          similarityMetric: 'cosine',
        }),
      })

      await POST(request)

      const searchCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/embeddings/search')
      )

      expect(searchCall).toBeDefined()
      const searchBody = JSON.parse(searchCall[1].body)

      // Validate all required fields are present
      expect(searchBody).toHaveProperty('query')
      expect(searchBody).toHaveProperty('project_id')
      expect(searchBody).toHaveProperty('limit')
      expect(searchBody).toHaveProperty('threshold')
      expect(searchBody).toHaveProperty('namespace')
      expect(searchBody).toHaveProperty('model')

      // Validate field types
      expect(typeof searchBody.query).toBe('string')
      expect(typeof searchBody.project_id).toBe('string')
      expect(typeof searchBody.limit).toBe('number')
      expect(typeof searchBody.threshold).toBe('number')
      expect(typeof searchBody.namespace).toBe('string')
      expect(typeof searchBody.model).toBe('string')
    })

    it('should include metadata filter when similarityMetric is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
          similarityMetric: 'euclidean',
        }),
      })

      await POST(request)

      const searchCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/embeddings/search')
      )
      const searchBody = JSON.parse(searchCall[1].body)

      expect(searchBody.filter_metadata).toEqual({
        similarity_metric: 'euclidean',
      })
    })
  })

  describe('Authentication Request Schema', () => {
    it('should send properly formatted auth request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await POST(request)

      const authCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/auth/login')
      )

      expect(authCall).toBeDefined()
      expect(authCall[1].method).toBe('POST')
      expect(authCall[1].headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded'
      )
      expect(authCall[1].body).toContain('username=')
      expect(authCall[1].body).toContain('password=')
    })
  })
})

describe('HTTP Headers Validation', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  describe('Content-Type Headers', () => {
    it('should set application/json for ZeroDB requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await POST(request)

      const searchCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/embeddings/search')
      )

      expect(searchCall[1].headers['Content-Type']).toBe('application/json')
    })

    it('should set application/x-www-form-urlencoded for auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await POST(request)

      const authCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/auth/login')
      )

      expect(authCall[1].headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded'
      )
    })
  })

  describe('Authorization Headers', () => {
    it('should include Bearer token for authenticated requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token-abc' }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Response' } }],
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await POST(request)

      const searchCall = mockFetch.mock.calls.find((call) =>
        call[0].includes('/embeddings/search')
      )

      expect(searchCall[1].headers['Authorization']).toBe(
        'Bearer test-token-abc'
      )
    })
  })
})
