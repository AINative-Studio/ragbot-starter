require('dotenv').config({ path: '/Users/sanketbojewar/Desktop/RAG_starter/ragbot-starter/.env' });
const https = require('https');

const ZERODB_API_URL = process.env.ZERODB_API_URL;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD;

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function search(token, query) {
  const payload = JSON.stringify({
    query,
    namespace: "knowledge_base",
    limit: 3,
    threshold: 0.0,
    model: "BAAI/bge-small-en-v1.5",
    project_id: ZERODB_PROJECT_ID
  });

  return await makeRequest(
    `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
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
}

async function main() {
  const authData = new URLSearchParams({
    username: ZERODB_EMAIL,
    password: ZERODB_PASSWORD
  }).toString();

  const auth = await makeRequest(
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

  const token = auth.access_token;

  console.log('🔍 Search 1: "ZeroDB documentation API"');
  const r1 = await search(token, "ZeroDB documentation API");
  console.log('Raw response:', JSON.stringify(r1, null, 2));
  if (r1.results) {
    r1.results.forEach((r, i) => {
      const title = r.metadata && r.metadata.title ? r.metadata.title : 'No title';
      const score = r.score ? r.score.toFixed(3) : 'N/A';
      const source = r.metadata && r.metadata.source ? r.metadata.source : 'unknown';
      const preview = r.text ? r.text.substring(0, 100) : r.document ? r.document.substring(0, 100) : 'No content';
      console.log(`  ${i+1}. ${title} (score: ${score})`);
      console.log(`     Source: ${source}`);
      console.log(`     Preview: ${preview}...`);
    });
  }

  console.log('\n🔍 Search 2: "Alan Watts teachings"');
  const r2 = await search(token, "Alan Watts teachings");
  if (r2.results) {
    r2.results.forEach((r, i) => {
      const title = r.metadata && r.metadata.title ? r.metadata.title : 'No title';
      const score = r.score ? r.score.toFixed(3) : 'N/A';
      const source = r.metadata && r.metadata.source ? r.metadata.source : 'unknown';
      console.log(`  ${i+1}. ${title} (score: ${score})`);
      console.log(`     Source: ${source}`);
    });
  }

  console.log('\n📊 Summary:');
  let hasNonTransmutes = false;
  if (r1.results) {
    hasNonTransmutes = r1.results.some(r => {
      const source = r.metadata && r.metadata.source ? r.metadata.source : '';
      return source !== 'transmutes_rag';
    });
  }

  if (hasNonTransmutes) {
    console.log('⚠️  WARNING: Found non-Transmutes content in vectors!');
  } else {
    console.log('✅ All vectors appear to be from Transmutes data only');
  }
}

main().catch(console.error);
