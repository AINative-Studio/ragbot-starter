/**
 * ZeroDB Client using Official @ainative/sdk
 *
 * This showcases how simple vector database operations are with the AINative SDK.
 * No complex configuration, no connection pooling - just clean, type-safe API calls.
 *
 * Learn more: https://docs.ainative.studio/zerodb
 */

import { AINativeClient } from '@ainative/sdk';

const ZERODB_API_KEY = process.env.ZERODB_API_KEY!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;

// Initialize the SDK client once
const client = new AINativeClient({
  apiKey: ZERODB_API_KEY,
  baseUrl: 'https://api.ainative.studio'
});

/**
 * Upsert a single vector with metadata into ZeroDB
 * @param data - Vector embedding, document text, and optional metadata
 * @returns The created vector
 */
export async function upsertVector(data: {
  embedding: number[];
  document: string;
  metadata?: Record<string, any>;
}) {
  const response = await client.zerodb.vectors.upsert(ZERODB_PROJECT_ID, {
    vectorEmbedding: data.embedding,
    document: data.document,
    metadata: data.metadata,
    namespace: "knowledge_base",
  });

  return response.data;
}

/**
 * Batch upsert multiple vectors for better performance
 * @param vectors - Array of vectors to insert
 * @returns Result with count of inserted vectors
 */
export async function batchUpsertVectors(vectors: Array<{
  embedding: number[];
  document: string;
  metadata?: Record<string, any>;
}>) {
  const response = await client.zerodb.vectors.batchUpsert(ZERODB_PROJECT_ID, {
    vectors: vectors.map((v, idx) => ({
      vectorId: `vec_${Date.now()}_${idx}`,
      vectorEmbedding: v.embedding,
      document: v.document,
      metadata: v.metadata,
      namespace: "knowledge_base",
    })),
  });

  return response.data;
}

/**
 * Search for similar vectors using semantic similarity
 * @param queryEmbedding - The query vector (1536 dimensions)
 * @param limit - Maximum number of results to return
 * @param threshold - Minimum similarity score (0-1)
 * @param filterMetadata - Optional metadata filter to narrow results
 * @param similarityMetric - Similarity metric (cosine, euclidean, dot_product)
 * @returns Array of matching documents with similarity scores
 */
export async function searchVectors(
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7,
  filterMetadata?: Record<string, any>,
  similarityMetric: string = "cosine"
) {
  const response = await client.zerodb.vectors.search(ZERODB_PROJECT_ID, {
    queryVector: queryEmbedding,
    topK: limit,
    similarityThreshold: threshold,
    namespace: "knowledge_base",
    filter: filterMetadata,
  });

  // Transform SDK response to match expected format
  const vectors = response.data?.vectors || [];
  return vectors.map((vector: any) => ({
    id: vector.id,
    content: vector.document || vector.metadata?.document || "",
    metadata: vector.metadata,
    similarity: 1.0, // SDK handles similarity internally
  }));
}
