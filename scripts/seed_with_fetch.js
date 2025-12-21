require('dotenv').config();

const ZERODB_API_URL = process.env.ZERODB_API_URL;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD;

console.log('🧹 Clean Re-seed: ONLY Transmutes Data\n');
console.log(`   API: ${ZERODB_API_URL}`);
console.log(`   Project ID: ${ZERODB_PROJECT_ID}`);
console.log(`   Namespace: transmutes_only (clean)\n`);

async function authenticate() {
  console.log('🔐 Authenticating with ZeroDB...');

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
  console.log('✅ Authentication successful\n');
  return data.access_token;
}

async function uploadBatch(token, texts, metadata_list) {
  const response = await fetch(
    `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        texts,
        metadata_list,
        namespace: 'transmutes_only',
        model: 'BAAI/bge-small-en-v1.5',
        project_id: ZERODB_PROJECT_ID
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  try {
    const token = await authenticate();

    // Load ONLY sample_data.json
    const sampleData = require('./sample_data.json');
    console.log(`📊 Total documents to upload: ${sampleData.length}\n`);

    const BATCH_SIZE = 5;
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < sampleData.length; i += BATCH_SIZE) {
      const batch = sampleData.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`📤 Batch ${batchNum}: Uploading documents ${i}-${i + batch.length - 1}...`);

      const texts = batch.map(item => `${item.title}\n\n${item.content}`);
      const metadata_list = batch.map((item, idx) => ({
        document_id: `transmutes_${i + idx}`,
        title: item.title,
        url: item.url,
        source: 'transmutes_rag',
        data_file: 'sample_data.json'
      }));

      try {
        const response = await uploadBatch(token, texts, metadata_list);

        if (response.success) {
          uploaded += response.vectors_stored;
          console.log(`   ✅ Stored ${response.vectors_stored} vectors (Total: ${uploaded}/${sampleData.length})`);
        } else {
          failed += batch.length;
          console.log(`   ❌ Batch failed: ${JSON.stringify(response)}`);
        }
      } catch (error) {
        failed += batch.length;
        console.log(`   ❌ Error: ${error.message}`);
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Clean re-seed complete!');
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${sampleData.length}`);
    console.log(`\n📝 Next: Update app/api/chat/route.ts to use namespace "transmutes_only"`);
  } catch (error) {
    console.error('❌ Re-seed failed:', error.message);
    process.exit(1);
  }
}

main();
