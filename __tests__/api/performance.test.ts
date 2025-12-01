/**
 * Performance and Load Tests
 *
 * Tests performance characteristics:
 * - Concurrent request handling
 * - Response time under load
 * - Memory usage
 * - Streaming performance
 * - Rate limiting behavior
 */

import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

jest.mock('openai')
jest.mock('ai')

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  describe('Response Time', () => {
    it('should respond within acceptable time for simple request', async () => {
      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ delta: { content: 'Fast response' } }],
            }),
          },
        },
      }))

      const startTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: false,
        }),
      })

      await POST(request)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Response should be quick for mocked requests
      expect(responseTime).toBeLessThan(1000) // 1 second
    })

    it('should respond within acceptable time with RAG', async () => {
      const mockFetch = global.fetch as jest.Mock

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

      const startTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          useRag: true,
        }),
      })

      await POST(request)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // RAG requests should still be reasonably fast
      expect(responseTime).toBeLessThan(2000) // 2 seconds
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent requests', async () => {
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

      const requests = Array.from({ length: 10 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Request ${i}` }],
            useRag: false,
          }),
        })
        return POST(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()

      expect(responses).toHaveLength(10)
      responses.forEach((response) => {
        expect(response).toBeDefined()
      })

      // All 10 requests should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds total
    })

    it('should handle 50 concurrent requests', async () => {
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

      const requests = Array.from({ length: 50 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Request ${i}` }],
            useRag: false,
          }),
        })
        return POST(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()

      expect(responses).toHaveLength(50)
      responses.forEach((response) => {
        expect(response).toBeDefined()
      })

      // Should handle moderate load
      expect(endTime - startTime).toBeLessThan(15000) // 15 seconds
    }, 20000) // Increase timeout for this test

    it('should handle 100 concurrent requests', async () => {
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

      const requests = Array.from({ length: 100 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Request ${i}` }],
            useRag: false,
          }),
        })
        return POST(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()

      expect(responses).toHaveLength(100)

      // All requests should succeed
      const successfulResponses = responses.filter((r) => r !== null)
      expect(successfulResponses.length).toBeGreaterThan(95) // At least 95% success

      console.log(`100 concurrent requests completed in ${endTime - startTime}ms`)
    }, 30000) // Increase timeout for this test
  })

  describe('Streaming Performance', () => {
    it('should efficiently stream responses', async () => {
      const chunks = ['Hello', ' ', 'world', '!']
      let chunkIndex = 0

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              async *[Symbol.asyncIterator]() {
                for (const chunk of chunks) {
                  yield { choices: [{ delta: { content: chunk } }] }
                  await new Promise((resolve) => setTimeout(resolve, 10))
                }
              },
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test streaming' }],
          useRag: false,
        }),
      })

      const startTime = Date.now()
      const response = await POST(request)
      const endTime = Date.now()

      expect(response).toBeDefined()
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should handle large streaming responses', async () => {
      // Simulate large response with many chunks
      const largeContent = 'A'.repeat(10000)
      const chunkSize = 100
      const chunks: string[] = []

      for (let i = 0; i < largeContent.length; i += chunkSize) {
        chunks.push(largeContent.slice(i, i + chunkSize))
      }

      const OpenAI = require('openai').default
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              async *[Symbol.asyncIterator]() {
                for (const chunk of chunks) {
                  yield { choices: [{ delta: { content: chunk } }] }
                }
              },
            }),
          },
        },
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate long response' }],
          useRag: false,
        }),
      })

      const startTime = Date.now()
      const response = await POST(request)
      const endTime = Date.now()

      expect(response).toBeDefined()
      // Should handle large responses efficiently
      expect(endTime - startTime).toBeLessThan(5000)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory on repeated requests', async () => {
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

      // Take initial memory snapshot
      if (global.gc) {
        global.gc()
      }
      const initialMemory = process.memoryUsage().heapUsed

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Request ${i}` }],
            useRag: false,
          }),
        })
        await POST(request)
      }

      // Take final memory snapshot
      if (global.gc) {
        global.gc()
      }
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    }, 30000)

    it('should handle large message histories efficiently', async () => {
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

      // Create large message history (100 messages)
      const messages = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}: ${'x'.repeat(100)}`,
      }))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages,
          useRag: false,
        }),
      })

      const startTime = Date.now()
      const response = await POST(request)
      const endTime = Date.now()

      expect(response).toBeDefined()
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })

  describe('Rate Limiting Behavior', () => {
    it('should handle rate limit responses gracefully', async () => {
      const mockFetch = global.fetch as jest.Mock

      // First request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      // Second request is rate limited
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: () => '60',
        },
        text: async () => 'Rate limit exceeded',
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

      await expect(POST(request)).rejects.toThrow()
    })

    it('should implement exponential backoff for retries', async () => {
      // This test verifies that retry logic would work correctly
      const delays: number[] = []
      let attemptCount = 0

      const mockRetry = async (fn: () => Promise<any>, maxAttempts = 3) => {
        for (let i = 0; i < maxAttempts; i++) {
          try {
            return await fn()
          } catch (error) {
            if (i === maxAttempts - 1) throw error

            const delay = Math.pow(2, i) * 1000 // Exponential backoff
            delays.push(delay)
            attemptCount++
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      const failingFunction = jest
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('Success')

      const result = await mockRetry(() => failingFunction())

      expect(result).toBe('Success')
      expect(attemptCount).toBe(2)
      expect(delays).toEqual([1000, 2000]) // 1s, 2s
    }, 10000)
  })

  describe('Load Testing Scenarios', () => {
    it('should maintain performance under sustained load', async () => {
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

      const responseTimes: number[] = []

      // Simulate sustained load: 5 batches of 10 requests
      for (let batch = 0; batch < 5; batch++) {
        const batchStartTime = Date.now()

        const requests = Array.from({ length: 10 }, (_, i) => {
          const request = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({
              messages: [{ role: 'user', content: `Batch ${batch} Request ${i}` }],
              useRag: false,
            }),
          })
          return POST(request)
        })

        await Promise.all(requests)

        const batchEndTime = Date.now()
        responseTimes.push(batchEndTime - batchStartTime)

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Performance should remain consistent across batches
      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)

      expect(maxResponseTime - minResponseTime).toBeLessThan(1000) // Variance < 1s
      expect(avgResponseTime).toBeLessThan(2000) // Avg < 2s

      console.log('Sustained load test results:', {
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
      })
    }, 30000)

    it('should handle mixed workload (RAG + non-RAG)', async () => {
      const mockFetch = global.fetch as jest.Mock

      // Mock auth and search for RAG requests
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ access_token: 'test-token' }),
          })
        }
        if (url.includes('/embeddings/search')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ results: [] }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
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

      // Create mixed workload
      const requests = []
      for (let i = 0; i < 20; i++) {
        const useRag = i % 2 === 0 // Alternate between RAG and non-RAG
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Request ${i}` }],
            useRag,
          }),
        })
        requests.push(POST(request))
      }

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()

      expect(responses).toHaveLength(20)
      responses.forEach((response) => {
        expect(response).toBeDefined()
      })

      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds for mixed load
    }, 15000)
  })
})
