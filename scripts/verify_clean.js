require('dotenv').config();

const ZERODB_API_URL = process.env.ZERODB_API_URL;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD;

async function authenticate() {
  const response = await fetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`
  });

  const data = await response.json();
  return data.access_token;
}

async function search(token, query, namespace) {
  const response = await fetch(
    `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        namespace,
        limit: 3,
        threshold: 0.0,
        model: 'BAAI/bge-small-en-v1.5',
        project_id: ZERODB_PROJECT_ID,
        include_metadata: true
      })
    }
  );

  return await response.json();
}

async function main() {
  console.log('🔍 Verifying Clean Data\n');

  const token = await authenticate();

  console.log('1️⃣  Searching NEW namespace (transmutes_only) for "ZeroDB docs"...');
  const newZerodbSearch = await search(token, 'ZeroDB documentation API', 'transmutes_only');

  if (newZerodbSearch.results && newZerodbSearch.results.length > 0) {
    newZerodbSearch.results.forEach((r, i) => {
      const preview = r.text ? r.text.substring(0, 80) : r.document ? r.document.substring(0, 80) : 'No content';
      const source = r.metadata && r.metadata.source ? r.metadata.source : 'unknown';
      console.log(`   ${i+1}. Source: ${source}`);
      console.log(`      Preview: ${preview}...`);
    });
  }

  console.log('\n2️⃣  Searching NEW namespace (transmutes_only) for "Alan Watts"...');
  const newWattsSearch = await search(token, 'Alan Watts teachings', 'transmutes_only');

  if (newWattsSearch.results && newWattsSearch.results.length > 0) {
    newWattsSearch.results.forEach((r, i) => {
      const preview = r.text ? r.text.substring(0, 80) : r.document ? r.document.substring(0, 80) : 'No content';
      const source = r.metadata && r.metadata.source ? r.metadata.source : 'unknown';
      const title = r.metadata && r.metadata.title ? r.metadata.title : 'No title';
      console.log(`   ${i+1}. Source: ${source}`);
      console.log(`      Title: ${title}`);
      console.log(`      Preview: ${preview}...`);
    });
  }

  console.log('\n📊 Verification Summary:');
  const hasZerodbDocs = newZerodbSearch.results?.some(r => {
    const text = (r.text || r.document || '').toLowerCase();
    return text.includes('zerodb is ainative') || text.includes('comprehensive intelligent database');
  });

  const hasTransmutes = newWattsSearch.results?.every(r => {
    const source = r.metadata && r.metadata.source ? r.metadata.source : '';
    return source === 'transmutes_rag';
  });

  if (!hasZerodbDocs && hasTransmutes) {
    console.log('✅ CLEAN! Only Transmutes data in new namespace');
    console.log('✅ All results have source="transmutes_rag"');
    console.log('✅ No ZeroDB documentation pollution');
  } else {
    console.log('⚠️  WARNING: Data may still have pollution');
    if (hasZerodbDocs) console.log('   - Found ZeroDB documentation');
    if (!hasTransmutes) console.log('   - Found non-Transmutes sources');
  }

  console.log('\n🗑️  OLD namespace (knowledge_base) check:');
  const oldSearch = await search(token, 'test query', 'knowledge_base');
  if (oldSearch.results && oldSearch.results.length > 0) {
    console.log(`   Found ${oldSearch.results.length} results in old namespace (still has polluted data)`);
  }
}

main().catch(console.error);
