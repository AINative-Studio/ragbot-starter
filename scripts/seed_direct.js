const nodeFetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ZERODB_API_URL = process.env.ZERODB_API_URL;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID;
const ZERODB_API_KEY = process.env.ZERODB_API_KEY;
const ZERODB_NAMESPACE = process.env.ZERODB_NAMESPACE || 'knowledge_base';

// Read sample data
const sampleDataPath = path.join(__dirname, 'sample_data.json');
const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

console.log('🚀 Starting ZeroDB data population using API Key authentication...\n');
console.log(`   API: ${ZERODB_API_URL}`);
console.log(`   Project ID: ${ZERODB_PROJECT_ID}`);
console.log(`   Documents to seed: ${sampleData.length}`);
console.log(`   Using embed-and-store endpoint (384-dim BAAI/bge-small-en-v1.5)\n`);

async function seedData() {
  try {
    // Prepare documents in correct format per developer guide
    const documents = [];

    sampleData.forEach((item, index) => {
      documents.push({
        id: `transmutes_${index}`,
        text: `${item.title}\n\n${item.content}`,
        metadata: {
          title: item.title,
          url: item.url,
          source: 'transmutes_rag',
          similarity_metric: 'cosine'
        }
      });
    });

    console.log(`📤 Uploading ${documents.length} documents to ZeroDB...`);
    console.log('   This may take a few minutes...\n');

    // Upload in batches of 10 to avoid timeouts
    const batchSize = 10;
    let totalStored = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batchDocs = documents.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(documents.length / batchSize);

      console.log(`   Batch ${batchNum}/${totalBatches} (${batchDocs.length} documents)...`);

      try {
        const response = await nodeFetch(
          `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': ZERODB_API_KEY,
            },
            body: JSON.stringify({
              documents: batchDocs,
              namespace: ZERODB_NAMESPACE,
              upsert: true
            }),
            timeout: 60000 // 60 second timeout for batch
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`   ❌ Batch ${batchNum} failed: ${response.status} - ${error}`);
          continue;
        }

        const result = await response.json();
        totalStored += result.vectors_stored || batchDocs.length;
        console.log(`   ✅ Batch ${batchNum} complete (${result.vectors_stored} vectors, ${result.processing_time_ms}ms)`);

      } catch (error) {
        console.error(`   ❌ Batch ${batchNum} error:`, error.message);
      }

      // Small delay between batches
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`📊 Results:`);
    console.log(`   - Total documents processed: ${documents.length}`);
    console.log(`   - Vectors stored: ${totalStored}`);
    console.log(`   - Model: BAAI/bge-small-en-v1.5`);
    console.log(`   - Dimensions: 384`);
    console.log(`   - Namespace: ${ZERODB_NAMESPACE}\n`);
    console.log(`✨ Your chatbot now knows about:`);
    console.log(`   - Alan Watts teachings`);
    console.log(`   - Jiddu Krishnamurti wisdom`);
    console.log(`   - Ramana Maharshi insights`);
    console.log(`   - Gary Weber practices`);
    console.log(`   - Michael Singer's work`);
    console.log(`   - Ram Dass teachings`);
    console.log(`   - Taoist philosophy`);
    console.log(`   - And much more spiritual wisdom!\n`);
    console.log(`🚀 Test it at: http://localhost:3000`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedData();
