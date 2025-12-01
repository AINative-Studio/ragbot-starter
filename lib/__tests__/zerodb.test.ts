/**
 * Unit tests for ZeroDB SDK wrapper functions
 * Tests the @ainative/sdk integration for vector operations
 */

import { upsertVector, batchUpsertVectors, searchVectors } from '../zerodb';
import { AINativeClient } from '@ainative/sdk';

// Mock the AINativeClient
jest.mock('@ainative/sdk', () => {
  return {
    AINativeClient: jest.fn().mockImplementation(() => ({
      zerodb: {
        vectors: {
          upsert: jest.fn(),
          batchUpsert: jest.fn(),
          search: jest.fn(),
        },
      },
    })),
  };
});

describe('lib/zerodb', () => {
  let mockClient: any;

  beforeEach(() => {
    // Get the mocked client instance
    mockClient = new AINativeClient({ apiKey: 'test', baseUrl: 'test' });
    jest.clearAllMocks();
  });

  describe('upsertVector', () => {
    it('should upsert a single vector with all fields', async () => {
      const mockResponse = {
        data: {
          id: 'vec-123',
          vectorEmbedding: [0.1, 0.2, 0.3],
          document: 'Test document',
          metadata: { category: 'test' },
        },
      };

      mockClient.zerodb.vectors.upsert.mockResolvedValue(mockResponse);

      const data = {
        embedding: [0.1, 0.2, 0.3],
        document: 'Test document',
        metadata: { category: 'test' },
      };

      const result = await upsertVector(data);

      expect(mockClient.zerodb.vectors.upsert).toHaveBeenCalledWith(
        'test-project-id',
        {
          vectorEmbedding: [0.1, 0.2, 0.3],
          document: 'Test document',
          metadata: { category: 'test' },
          namespace: 'knowledge_base',
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should upsert vector without metadata', async () => {
      const mockResponse = {
        data: {
          id: 'vec-456',
          vectorEmbedding: [0.4, 0.5, 0.6],
          document: 'Simple document',
        },
      };

      mockClient.zerodb.vectors.upsert.mockResolvedValue(mockResponse);

      const data = {
        embedding: [0.4, 0.5, 0.6],
        document: 'Simple document',
      };

      const result = await upsertVector(data);

      expect(mockClient.zerodb.vectors.upsert).toHaveBeenCalledWith(
        'test-project-id',
        {
          vectorEmbedding: [0.4, 0.5, 0.6],
          document: 'Simple document',
          metadata: undefined,
          namespace: 'knowledge_base',
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle upsert errors', async () => {
      mockClient.zerodb.vectors.upsert.mockRejectedValue(
        new Error('Network error')
      );

      const data = {
        embedding: [0.1, 0.2],
        document: 'Test',
      };

      await expect(upsertVector(data)).rejects.toThrow('Network error');
    });

    it('should use knowledge_base namespace', async () => {
      const mockResponse = {
        data: { id: 'vec-123' },
      };

      mockClient.zerodb.vectors.upsert.mockResolvedValue(mockResponse);

      await upsertVector({
        embedding: [0.1],
        document: 'Test',
      });

      expect(mockClient.zerodb.vectors.upsert).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          namespace: 'knowledge_base',
        })
      );
    });
  });

  describe('batchUpsertVectors', () => {
    it('should batch upsert multiple vectors', async () => {
      const mockResponse = {
        data: {
          count: 3,
          vectors: [
            { id: 'vec-1' },
            { id: 'vec-2' },
            { id: 'vec-3' },
          ],
        },
      };

      mockClient.zerodb.vectors.batchUpsert.mockResolvedValue(mockResponse);

      const vectors = [
        { embedding: [0.1, 0.2], document: 'Doc 1', metadata: { id: 1 } },
        { embedding: [0.3, 0.4], document: 'Doc 2', metadata: { id: 2 } },
        { embedding: [0.5, 0.6], document: 'Doc 3', metadata: { id: 3 } },
      ];

      const result = await batchUpsertVectors(vectors);

      expect(mockClient.zerodb.vectors.batchUpsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse.data);

      const callArgs = mockClient.zerodb.vectors.batchUpsert.mock.calls[0][1];
      expect(callArgs.vectors).toHaveLength(3);
      expect(callArgs.vectors[0]).toMatchObject({
        vectorEmbedding: [0.1, 0.2],
        document: 'Doc 1',
        metadata: { id: 1 },
        namespace: 'knowledge_base',
      });
    });

    it('should generate unique vector IDs with timestamp', async () => {
      const mockResponse = {
        data: { count: 2 },
      };

      mockClient.zerodb.vectors.batchUpsert.mockResolvedValue(mockResponse);

      const vectors = [
        { embedding: [0.1], document: 'Doc 1' },
        { embedding: [0.2], document: 'Doc 2' },
      ];

      await batchUpsertVectors(vectors);

      const callArgs = mockClient.zerodb.vectors.batchUpsert.mock.calls[0][1];
      expect(callArgs.vectors[0].vectorId).toMatch(/^vec_\d+_0$/);
      expect(callArgs.vectors[1].vectorId).toMatch(/^vec_\d+_1$/);
    });

    it('should batch upsert empty array', async () => {
      const mockResponse = {
        data: { count: 0 },
      };

      mockClient.zerodb.vectors.batchUpsert.mockResolvedValue(mockResponse);

      const result = await batchUpsertVectors([]);

      expect(mockClient.zerodb.vectors.batchUpsert).toHaveBeenCalledWith(
        'test-project-id',
        {
          vectors: [],
        }
      );
      expect(result.count).toBe(0);
    });

    it('should handle batch upsert errors', async () => {
      mockClient.zerodb.vectors.batchUpsert.mockRejectedValue(
        new Error('Batch failed')
      );

      const vectors = [
        { embedding: [0.1], document: 'Doc 1' },
      ];

      await expect(batchUpsertVectors(vectors)).rejects.toThrow('Batch failed');
    });

    it('should set namespace to knowledge_base for all vectors', async () => {
      const mockResponse = {
        data: { count: 2 },
      };

      mockClient.zerodb.vectors.batchUpsert.mockResolvedValue(mockResponse);

      const vectors = [
        { embedding: [0.1], document: 'Doc 1' },
        { embedding: [0.2], document: 'Doc 2' },
      ];

      await batchUpsertVectors(vectors);

      const callArgs = mockClient.zerodb.vectors.batchUpsert.mock.calls[0][1];
      callArgs.vectors.forEach((v: any) => {
        expect(v.namespace).toBe('knowledge_base');
      });
    });
  });

  describe('searchVectors', () => {
    it('should search vectors with all parameters', async () => {
      const mockResponse = {
        data: {
          vectors: [
            {
              id: 'vec-1',
              document: 'Matching doc 1',
              metadata: { category: 'test' },
              similarity: 0.95,
            },
            {
              id: 'vec-2',
              document: 'Matching doc 2',
              metadata: { category: 'test' },
              similarity: 0.85,
            },
          ],
        },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const queryEmbedding = [0.1, 0.2, 0.3];
      const result = await searchVectors(
        queryEmbedding,
        5,
        0.7,
        { category: 'test' },
        'cosine'
      );

      expect(mockClient.zerodb.vectors.search).toHaveBeenCalledWith(
        'test-project-id',
        {
          queryVector: queryEmbedding,
          topK: 5,
          similarityThreshold: 0.7,
          namespace: 'knowledge_base',
          filter: { category: 'test' },
        }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'vec-1',
        content: 'Matching doc 1',
        metadata: { category: 'test' },
        similarity: 1.0,
      });
    });

    it('should use default parameters', async () => {
      const mockResponse = {
        data: { vectors: [] },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      await searchVectors([0.1, 0.2]);

      expect(mockClient.zerodb.vectors.search).toHaveBeenCalledWith(
        'test-project-id',
        {
          queryVector: [0.1, 0.2],
          topK: 5,
          similarityThreshold: 0.7,
          namespace: 'knowledge_base',
          filter: undefined,
        }
      );
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: { vectors: [] },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const result = await searchVectors([0.1, 0.2]);

      expect(result).toEqual([]);
    });

    it('should handle search without vectors in response', async () => {
      const mockResponse = {
        data: {},
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const result = await searchVectors([0.1, 0.2]);

      expect(result).toEqual([]);
    });

    it('should extract content from document field', async () => {
      const mockResponse = {
        data: {
          vectors: [
            {
              id: 'vec-1',
              document: 'Content from document field',
              metadata: {},
            },
          ],
        },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const result = await searchVectors([0.1, 0.2]);

      expect(result[0].content).toBe('Content from document field');
    });

    it('should extract content from metadata.document if document field missing', async () => {
      const mockResponse = {
        data: {
          vectors: [
            {
              id: 'vec-1',
              metadata: { document: 'Content from metadata' },
            },
          ],
        },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const result = await searchVectors([0.1, 0.2]);

      expect(result[0].content).toBe('Content from metadata');
    });

    it('should use empty string if no content found', async () => {
      const mockResponse = {
        data: {
          vectors: [
            {
              id: 'vec-1',
              metadata: {},
            },
          ],
        },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const result = await searchVectors([0.1, 0.2]);

      expect(result[0].content).toBe('');
    });

    it('should handle search errors', async () => {
      mockClient.zerodb.vectors.search.mockRejectedValue(
        new Error('Search failed')
      );

      await expect(searchVectors([0.1, 0.2])).rejects.toThrow('Search failed');
    });

    it('should accept custom limit parameter', async () => {
      const mockResponse = {
        data: { vectors: [] },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      await searchVectors([0.1, 0.2], 10);

      expect(mockClient.zerodb.vectors.search).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          topK: 10,
        })
      );
    });

    it('should accept custom threshold parameter', async () => {
      const mockResponse = {
        data: { vectors: [] },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      await searchVectors([0.1, 0.2], 5, 0.9);

      expect(mockClient.zerodb.vectors.search).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          similarityThreshold: 0.9,
        })
      );
    });

    it('should always set similarity to 1.0 in results', async () => {
      const mockResponse = {
        data: {
          vectors: [
            {
              id: 'vec-1',
              document: 'Test',
              metadata: {},
            },
          ],
        },
      };

      mockClient.zerodb.vectors.search.mockResolvedValue(mockResponse);

      const result = await searchVectors([0.1, 0.2]);

      expect(result[0].similarity).toBe(1.0);
    });
  });
});
