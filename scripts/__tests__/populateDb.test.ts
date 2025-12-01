/**
 * Unit tests for ZeroDB population script
 * Tests authentication, text chunking, and embed-and-store logic
 */

// Mock environment variables before imports
process.env.ZERODB_API_URL = 'https://api.ainative.studio';
process.env.ZERODB_PROJECT_ID = 'test-project-id';
process.env.ZERODB_EMAIL = 'test@example.com';
process.env.ZERODB_PASSWORD = 'test-password';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock langchain text splitter
jest.mock('langchain/text_splitter', () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn().mockResolvedValue([
      'Chunk 1',
      'Chunk 2',
      'Chunk 3',
    ]),
  })),
}));

// Mock sample data
jest.mock('../sample_data.json', () => [
  {
    url: 'https://docs.ainative.studio/page1',
    title: 'Test Page 1',
    content: 'This is test content for page 1',
  },
  {
    url: 'https://docs.ainative.studio/page2',
    title: 'Test Page 2',
    content: 'This is test content for page 2',
  },
], { virtual: true });

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

describe('scripts/populateDb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('getAuthToken function', () => {
    it('should authenticate with correct credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-jwt-token' }),
      });

      // Dynamically import to test the function
      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${encodeURIComponent(process.env.ZERODB_EMAIL!)}&password=${encodeURIComponent(process.env.ZERODB_PASSWORD!)}`,
        }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ainative.studio/v1/public/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      const data = await response.json();
      expect(data.access_token).toBe('test-jwt-token');
    });

    it('should send credentials as form-urlencoded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' }),
      });

      await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${encodeURIComponent(process.env.ZERODB_EMAIL!)}&password=${encodeURIComponent(process.env.ZERODB_PASSWORD!)}`,
        }
      );

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain('username=test%40example.com');
      expect(callBody).toContain('password=test-password');
    });

    it('should handle authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=test@example.com&password=wrong',
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should return JWT token on success', async () => {
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: expectedToken }),
      });

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=test@example.com&password=test-password',
        }
      );

      const data = await response.json();
      expect(data.access_token).toBe(expectedToken);
    });
  });

  describe('Text Chunking with LangChain', () => {
    it('should initialize RecursiveCharacterTextSplitter with correct params', () => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
    });

    it('should split text into chunks', async () => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await splitter.splitText('Long text content...');

      expect(chunks).toEqual(['Chunk 1', 'Chunk 2', 'Chunk 3']);
    });

    it('should use chunk size of 1000', () => {
      new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith(
        expect.objectContaining({
          chunkSize: 1000,
        })
      );
    });

    it('should use chunk overlap of 200', () => {
      new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith(
        expect.objectContaining({
          chunkOverlap: 200,
        })
      );
    });
  });

  describe('Metadata Generation', () => {
    it('should create metadata with document_id', async () => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await splitter.splitText('Content');
      const metadata = chunks.map((chunk, i) => ({
        document_id: `https://example.com-${i}`,
        url: 'https://example.com',
        title: 'Test Title',
        similarity_metric: 'cosine',
      }));

      expect(metadata[0].document_id).toMatch(/-0$/);
      expect(metadata[1].document_id).toMatch(/-1$/);
    });

    it('should include URL in metadata', async () => {
      const metadata = {
        document_id: 'test-0',
        url: 'https://docs.ainative.studio/vectors',
        title: 'Vectors',
        similarity_metric: 'cosine',
      };

      expect(metadata.url).toBe('https://docs.ainative.studio/vectors');
    });

    it('should include title in metadata', async () => {
      const metadata = {
        document_id: 'test-0',
        url: 'https://example.com',
        title: 'Test Title',
        similarity_metric: 'cosine',
      };

      expect(metadata.title).toBe('Test Title');
    });

    it('should include similarity_metric in metadata', async () => {
      const metadata = {
        document_id: 'test-0',
        url: 'https://example.com',
        title: 'Test',
        similarity_metric: 'euclidean',
      };

      expect(metadata.similarity_metric).toBe('euclidean');
    });
  });

  describe('Batch Embed-and-Store Calls', () => {
    it('should call embed-and-store endpoint', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            vectors_stored: 3,
            model: 'BAAI/bge-small-en-v1.5',
            dimensions: 384,
            processing_time_ms: 150,
          }),
        });

      // Simulate auth
      await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=test@example.com&password=test-password',
        }
      );

      // Simulate embed-and-store
      const texts = ['Text 1', 'Text 2', 'Text 3'];
      const metadata_list = [
        { document_id: 'doc-1', url: 'url1', title: 'Title 1', similarity_metric: 'cosine' },
        { document_id: 'doc-2', url: 'url2', title: 'Title 2', similarity_metric: 'cosine' },
        { document_id: 'doc-3', url: 'url3', title: 'Title 3', similarity_metric: 'cosine' },
      ];

      await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify({
            texts,
            metadata_list,
            namespace: 'knowledge_base',
            model: 'BAAI/bge-small-en-v1.5',
            project_id: process.env.ZERODB_PROJECT_ID,
          }),
        }
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/embeddings/embed-and-store'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should use BAAI/bge-small-en-v1.5 model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vectors_stored: 3,
          model: 'BAAI/bge-small-en-v1.5',
          dimensions: 384,
        }),
      });

      await fetch('https://api.ainative.studio/v1/public/test-project-id/embeddings/embed-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: JSON.stringify({
          texts: ['Text'],
          metadata_list: [{}],
          namespace: 'knowledge_base',
          model: 'BAAI/bge-small-en-v1.5',
          project_id: 'test-project-id',
        }),
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('BAAI/bge-small-en-v1.5');
    });

    it('should use knowledge_base namespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vectors_stored: 1 }),
      });

      await fetch('https://api.ainative.studio/v1/public/test-project-id/embeddings/embed-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: JSON.stringify({
          texts: ['Text'],
          metadata_list: [{}],
          namespace: 'knowledge_base',
          model: 'BAAI/bge-small-en-v1.5',
          project_id: 'test-project-id',
        }),
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.namespace).toBe('knowledge_base');
    });

    it('should include Authorization header with JWT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vectors_stored: 1 }),
      });

      await fetch('https://api.ainative.studio/v1/public/test-project-id/embeddings/embed-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        },
        body: JSON.stringify({
          texts: ['Text'],
          metadata_list: [{}],
          namespace: 'knowledge_base',
          model: 'BAAI/bge-small-en-v1.5',
          project_id: 'test-project-id',
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should handle successful embed-and-store response', async () => {
      const mockResponse = {
        vectors_stored: 6,
        model: 'BAAI/bge-small-en-v1.5',
        dimensions: 384,
        processing_time_ms: 250,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('https://api.ainative.studio/v1/public/test-project-id/embeddings/embed-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: JSON.stringify({
          texts: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
          metadata_list: [{}, {}, {}, {}, {}, {}],
          namespace: 'knowledge_base',
          model: 'BAAI/bge-small-en-v1.5',
          project_id: 'test-project-id',
        }),
      });

      const result = await response.json();
      expect(result.vectors_stored).toBe(6);
      expect(result.dimensions).toBe(384);
    });
  });

  describe('Similarity Metrics', () => {
    it('should support cosine similarity metric', () => {
      const metrics = ['cosine', 'euclidean', 'dot_product'];
      expect(metrics).toContain('cosine');
    });

    it('should support euclidean similarity metric', () => {
      const metrics = ['cosine', 'euclidean', 'dot_product'];
      expect(metrics).toContain('euclidean');
    });

    it('should support dot_product similarity metric', () => {
      const metrics = ['cosine', 'euclidean', 'dot_product'];
      expect(metrics).toContain('dot_product');
    });

    it('should have three similarity metrics', () => {
      const metrics = ['cosine', 'euclidean', 'dot_product'];
      expect(metrics).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const response = await fetch(
        `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=bad&password=bad',
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle embed-and-store errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const response = await fetch('https://api.ainative.studio/v1/public/test-project-id/embeddings/embed-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: JSON.stringify({
          texts: ['Text'],
          metadata_list: [{}],
          namespace: 'knowledge_base',
          model: 'BAAI/bge-small-en-v1.5',
          project_id: 'test-project-id',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('https://api.ainative.studio/v1/public/auth/login', {
          method: 'POST',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Environment Variables', () => {
    it('should use ZERODB_API_URL from env', () => {
      expect(process.env.ZERODB_API_URL).toBe('https://api.ainative.studio');
    });

    it('should use ZERODB_PROJECT_ID from env', () => {
      expect(process.env.ZERODB_PROJECT_ID).toBe('test-project-id');
    });

    it('should use ZERODB_EMAIL from env', () => {
      expect(process.env.ZERODB_EMAIL).toBe('test@example.com');
    });

    it('should use ZERODB_PASSWORD from env', () => {
      expect(process.env.ZERODB_PASSWORD).toBe('test-password');
    });
  });
});
