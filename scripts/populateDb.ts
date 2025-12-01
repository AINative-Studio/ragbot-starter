import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import 'dotenv/config'
import sampleData from './sample_data.json';
import { SimilarityMetric } from "../app/hooks/useConfiguration";

const ZERODB_API_URL = process.env.ZERODB_API_URL!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL!;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const similarityMetrics: SimilarityMetric[] = [
  'cosine',
  'euclidean',
  'dot_product',
]

// Get JWT token from ZeroDB
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

const loadSampleData = async (similarity_metric: SimilarityMetric = 'cosine') => {
  console.log(`\nLoading data for similarity metric: ${similarity_metric}`);

  const texts: string[] = [];
  const metadata_list: any[] = [];

  for (const { url, title, content } of sampleData) {
    const chunks = await splitter.splitText(content);
    let i = 0;

    for (const chunk of chunks) {
      texts.push(chunk);
      metadata_list.push({
        document_id: `${url}-${i}`,
        url,
        title,
        similarity_metric, // Store metric for filtering during search
      });
      i++;
    }
  }

  // Get JWT token
  console.log('  Authenticating with ZeroDB...');
  const token = await getAuthToken();

  // Use ZeroDB's embed-and-store endpoint
  console.log(`  Embedding and storing ${texts.length} documents...`);

  const response = await fetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      texts,
      metadata_list,
      namespace: "knowledge_base",
      model: "BAAI/bge-small-en-v1.5",
      project_id: ZERODB_PROJECT_ID,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ZeroDB embed-and-store failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`  ✅ Success! Stored ${result.vectors_stored} vectors`);
  console.log(`     Model: ${result.model}, Dimensions: ${result.dimensions}`);
  console.log(`     Processing time: ${result.processing_time_ms}ms`);
};

// Load data for all similarity metrics
(async () => {
  console.log('🚀 Starting ZeroDB data population...\n');
  console.log(`   API: ${ZERODB_API_URL}`);
  console.log(`   Project ID: ${ZERODB_PROJECT_ID}`);

  for (const metric of similarityMetrics) {
    await loadSampleData(metric);
  }

  console.log('\n🎉 All data loaded successfully!\n');
})();
