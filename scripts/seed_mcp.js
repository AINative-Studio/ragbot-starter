const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Set environment variables for MCP server (it expects ZERODB_USERNAME)
process.env.ZERODB_USERNAME = process.env.ZERODB_EMAIL;

const sampleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample_data.json'), 'utf8'));

console.log('🚀 ZeroDB MCP-based seeding\n');
console.log(`   Project ID: ${process.env.ZERODB_PROJECT_ID}`);
console.log(`   Namespace: ${process.env.ZERODB_NAMESPACE}`);
console.log(`   Documents: ${sampleData.length}\n`);

async function seedWithMCP() {
  try {
    // Import the MCP server directly
    const { spawn } = require('child_process');

    // Prepare all texts to embed
    const texts = sampleData.map(doc => `${doc.title}\n\n${doc.content}`);

    console.log('📤 Using ZeroDB MCP Server for embedding and storage...\n');

    // Create MCP request for embed_and_store
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'zerodb_embed_and_store',
        arguments: {
          texts: texts,
          namespace: process.env.ZERODB_NAMESPACE || 'knowledge_base',
          metadata: {
            source: 'transmutes_rag',
            seeded_at: new Date().toISOString()
          }
        }
      }
    };

    // Spawn MCP server process
    const mcpServer = spawn('npx', ['-y', 'ainative-zerodb-mcp-server'], {
      env: {
        ...process.env,
        ZERODB_USERNAME: process.env.ZERODB_EMAIL,
        ZERODB_PASSWORD: process.env.ZERODB_PASSWORD,
        ZERODB_API_KEY: process.env.ZERODB_API_KEY,
        ZERODB_PROJECT_ID: process.env.ZERODB_PROJECT_ID
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';

    mcpServer.stdout.on('data', (data) => {
      response += data.toString();
      console.log('MCP Server:', data.toString());
    });

    mcpServer.stderr.on('data', (data) => {
      console.error('MCP Error:', data.toString());
    });

    mcpServer.on('close', (code) => {
      console.log(`\n✅ MCP process completed with code ${code}`);

      if (response) {
        try {
          const result = JSON.parse(response);
          console.log('\n📊 Results:', JSON.stringify(result, null, 2));
        } catch (e) {
          console.log('\n📊 Raw response:', response);
        }
      }
    });

    // Send the request
    mcpServer.stdin.write(JSON.stringify(mcpRequest) + '\n');
    mcpServer.stdin.end();

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedWithMCP();
