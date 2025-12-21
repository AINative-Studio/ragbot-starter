require('dotenv').config();
const https = require('https');

const ZERODB_API_URL = process.env.ZERODB_API_URL;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD;

console.log('🧹 Clean Re-seed: ONLY Transmutes Data\n');
console.log(`   API: ${ZERODB_API_URL}`);
console.log(`   Project: ${ZERODB_PROJECT_ID}`);
console.log(`   New Namespace: transmutes_only\n`);

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (data) req.write(data);
    req.end();
  });
}

async function authenticate() {
  console.log('🔐 Authenticating...');
  const authData = new URLSearchParams({
    username: ZERODB_EMAIL,
    password: ZERODB_PASSWORD
  }).toString();

  const response = await makeRequest(
    `${ZERODB_API_URL}/v1/public/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(authData)
      }
    },
    authData
  );

  if (!response.access_token) {
    throw new Error(`Auth failed: ${JSON.stringify(response)}`);
  }

  console.log('✅ Authenticated\n');
  return response.access_token;
}

async function uploadBatch(token, texts, metadata_list) {
  const payload = JSON.stringify({
    texts,
    metadata_list,
    namespace: 'transmutes_only',  // NEW CLEAN NAMESPACE
    model: 'BAAI/bge-small-en-v1.5',
    project_id: ZERODB_PROJECT_ID
  });

  const response = await makeRequest(
    `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    },
    payload
  );

  return response;
}

async function main() {
  try {
    const token = await authenticate();

    // Load ONLY sample_data.json
    const sampleData = require('./sample_data.json');
    console.log(`📊 Loading: ${sampleData.length} Transmutes documents\n`);

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
        source: 'transmutes_rag',  // CLEAR SOURCE TAG
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

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Clean re-seed complete!');
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${sampleData.length}`);
    console.log(`\n📝 Next step: Update app to use namespace "transmutes_only"`);
  } catch (error) {
    console.error('❌ Re-seed failed:', error.message);
    process.exit(1);
  }
}

main();
