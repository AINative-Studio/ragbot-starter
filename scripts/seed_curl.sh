#!/bin/bash

ZERODB_API_URL="https://api.ainative.studio"
ZERODB_PROJECT_ID="e7b115fd-234b-4892-95df-47fd53807f74"
ZERODB_EMAIL="bojewarsanket@gmail.com"
ZERODB_PASSWORD="Letgo12!"

echo "🔐 Authenticating with ZeroDB..."

# Get auth token
TOKEN_RESPONSE=$(curl -s -X POST "${ZERODB_API_URL}/v1/public/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ZERODB_EMAIL}&password=${ZERODB_PASSWORD}")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful"
echo ""
echo "📤 Reading sample data..."

# Read just the first document for testing
FIRST_DOC=$(node -e "
const data = require('./scripts/sample_data.json');
const first = data[0];
console.log(JSON.stringify({
  texts: [\`\${first.title}\\n\\n\${first.content}\`],
  metadata_list: [{
    document_id: 'transmutes_0',
    title: first.title,
    url: first.url,
    source: 'transmutes_rag'
  }],
  namespace: 'knowledge_base',
  model: 'BAAI/bge-small-en-v1.5',
  project_id: '${ZERODB_PROJECT_ID}'
}));
")

echo "📤 Uploading test document..."

UPLOAD_RESPONSE=$(curl -s -X POST \
  "${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "${FIRST_DOC}")

echo "$UPLOAD_RESPONSE"
