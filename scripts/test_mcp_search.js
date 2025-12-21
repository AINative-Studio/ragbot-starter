const { spawn } = require('child_process');
require('dotenv').config();

console.log('🔍 Testing ZeroDB MCP Semantic Search\n');

// Set ZERODB_USERNAME from EMAIL for MCP server
process.env.ZERODB_USERNAME = process.env.ZERODB_EMAIL;

const mcpRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'zerodb_semantic_search',
    arguments: {
      query_text: 'What is consciousness?',
      namespace: 'transmutes_only',
      limit: 3,
      threshold: 0.7
    }
  }
};

console.log('Request:', JSON.stringify(mcpRequest, null, 2));
console.log('\n--- MCP Server Output ---\n');

const mcpServer = spawn('npx', ['-y', 'ainative-zerodb-mcp-server'], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

mcpServer.stdout.on('data', (data) => {
  const output = data.toString();
  responseData += output;
  process.stdout.write(output);
});

mcpServer.stderr.on('data', (data) => {
  process.stderr.write(data);
});

mcpServer.on('close', (code) => {
  console.log(`\n\n--- Process Exit Code: ${code} ---`);

  // Try to parse JSON response
  const lines = responseData.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        const json = JSON.parse(line);
        console.log('\n📊 Parsed Response:', JSON.stringify(json, null, 2));
      } catch (e) {
        // Not valid JSON
      }
    }
  }
});

// Send request
setTimeout(() => {
  mcpServer.stdin.write(JSON.stringify(mcpRequest) + '\n');

  // Close after 10 seconds
  setTimeout(() => {
    mcpServer.kill();
  }, 10000);
}, 1000);
