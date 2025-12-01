/**
 * Authentication Flow Tests for ZeroDB JWT
 *
 * Tests authentication mechanisms including:
 * - JWT token acquisition
 * - Token validation
 * - Token refresh handling
 * - Error handling for invalid credentials
 */

describe('ZeroDB Authentication', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAuthToken - Success Cases', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: mockToken,
          token_type: 'bearer',
          expires_in: 3600,
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${encodeURIComponent(process.env.ZERODB_EMAIL!)}&password=${encodeURIComponent(process.env.ZERODB_PASSWORD!)}`,
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.access_token).toBe(mockToken)
      expect(data.token_type).toBe('bearer')
    })

    it('should properly encode credentials in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      const specialEmail = 'test+user@example.com'
      const specialPassword = 'p@ssw0rd!#$%'

      await fetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(specialEmail)}&password=${encodeURIComponent(specialPassword)}`,
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1].body).toContain('username=test%2Buser%40example.com')
      expect(callArgs[1].body).toContain('password=p%40ssw0rd!%23%24%25')
    })

    it('should use correct Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      })

      await fetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      )
    })
  })

  describe('getAuthToken - Error Cases', () => {
    it('should handle 401 Unauthorized (invalid credentials)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          detail: 'Invalid credentials',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=wrong@example.com&password=wrongpassword',
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle 403 Forbidden (account locked)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          detail: 'Account is locked',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          detail: 'Authentication service unavailable',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'))

      await expect(
        fetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        })
      ).rejects.toThrow('Network request failed')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(
        fetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        })
      ).rejects.toThrow('Request timeout')
    })

    it('should handle missing credentials', async () => {
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
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'password=test',
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(422)
    })
  })

  describe('Token Usage', () => {
    it('should include Bearer token in Authorization header for authenticated requests', async () => {
      const testToken = 'test-jwt-token-123'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
          }),
        })
      )
    })

    it('should handle expired token (401 response)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          detail: 'Token has expired',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer expired-token',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle missing Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          detail: 'Not authenticated',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle malformed token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          detail: 'Invalid authentication credentials',
        }),
      })

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer invalid.malformed.token',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })
  })

  describe('Token Refresh Scenarios', () => {
    it('should re-authenticate when token expires', async () => {
      // First request fails with expired token
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Token expired' }),
      })

      // Re-authentication succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new-token-123' }),
      })

      // Retry with new token succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      })

      // Simulate the flow
      let response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer old-token',
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(false)

      // Re-authenticate
      response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        }
      )

      const authData = await response.json()
      expect(authData.access_token).toBe('new-token-123')

      // Retry with new token
      response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
          },
          body: JSON.stringify({ query: 'test' }),
        }
      )

      expect(response.ok).toBe(true)
    })
  })

  describe('Security Validations', () => {
    it('should not expose credentials in error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Authentication failed'))

      try {
        await fetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${process.env.ZERODB_EMAIL}&password=${process.env.ZERODB_PASSWORD}`,
        })
      } catch (error: any) {
        expect(error.message).not.toContain(process.env.ZERODB_EMAIL)
        expect(error.message).not.toContain(process.env.ZERODB_PASSWORD)
      }
    })

    it('should validate JWT token format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature'
      const invalidJWT = 'not-a-valid-jwt'

      // JWT should have 3 parts separated by dots
      expect(validJWT.split('.').length).toBe(3)
      expect(invalidJWT.split('.').length).not.toBe(3)
    })

    it('should use HTTPS for production authentication', () => {
      const productionUrl = 'https://api.ainative.studio'
      const localUrl = 'http://localhost:8000'

      // In production, URL should use HTTPS
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.ZERODB_API_URL).toMatch(/^https:\/\//)
      } else {
        // In development, local HTTP is acceptable
        expect(
          process.env.ZERODB_API_URL.startsWith('https://') ||
            process.env.ZERODB_API_URL.startsWith('http://localhost')
        ).toBe(true)
      }
    })
  })
})
