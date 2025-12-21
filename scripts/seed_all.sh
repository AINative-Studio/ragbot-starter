#!/bin/bash

ZERODB_API_URL="https://api.ainative.studio"
ZERODB_PROJECT_ID="e7b115fd-234b-4892-95df-47fd53807f74"
ZERODB_EMAIL="bojewarsanket@gmail.com"
ZERODB_PASSWORD="Letgo12!"

echo "🚀 Starting ZeroDB data population..."
echo ""
echo "   API: ${ZERODB_API_URL}"
echo "   Project ID: ${ZERODB_PROJECT_ID}"
echo ""

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

# Count total documents
TOTAL=$(node -e "console.log(require('./scripts/sample_data.json').length)")
echo "📊 Total documents to upload: ${TOTAL}"
echo ""

# Upload in batches of 5
BATCH_SIZE=5
UPLOADED=0
FAILED=0

for ((i=0; i<TOTAL; i+=BATCH_SIZE)); do
  BATCH_NUM=$((i/BATCH_SIZE + 1))
  END=$((i + BATCH_SIZE))

  if [ $END -gt $TOTAL ]; then
    END=$TOTAL
  fi

  echo "📤 Batch ${BATCH_NUM}: Uploading documents ${i}-$((END-1))..."

  # Create batch payload
  BATCH_PAYLOAD=$(node -e "
    const data = require('./scripts/sample_data.json');
    const batch = data.slice(${i}, ${END});

    const texts = batch.map(item => \`\${item.title}\\n\\n\${item.content}\`);
    const metadata_list = batch.map((item, idx) => ({
      document_id: \`transmutes_\${${i} + idx}\`,
      title: item.title,
      url: item.url,
      source: 'transmutes_rag',
      similarity_metric: 'cosine'
    }));

    console.log(JSON.stringify({
      texts,
      metadata_list,
      namespace: 'knowledge_base',
      model: 'BAAI/bge-small-en-v1.5',
      project_id: '${ZERODB_PROJECT_ID}'
    }));
  ")

  # Upload batch
  UPLOAD_RESPONSE=$(curl -s -X POST \
    "${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "${BATCH_PAYLOAD}")

  # Check if successful
  SUCCESS=$(echo $UPLOAD_RESPONSE | grep -o '"success":true')

  if [ -n "$SUCCESS" ]; then
    VECTORS_STORED=$(echo $UPLOAD_RESPONSE | grep -o '"vectors_stored":[0-9]*' | cut -d':' -f2)
    UPLOADED=$((UPLOADED + VECTORS_STORED))
    echo "   ✅ Stored ${VECTORS_STORED} vectors (Total: ${UPLOADED}/${TOTAL})"
  else
    FAILED=$((FAILED + BATCH_SIZE))
    echo "   ❌ Batch failed"
    echo "   Response: ${UPLOAD_RESPONSE}"
  fi

  # Small delay between batches
  sleep 1
done

echo ""
echo "🎉 Seeding complete!"
echo "   ✅ Uploaded: ${UPLOADED}"
echo "   ❌ Failed: ${FAILED}"
echo "   📊 Total: ${TOTAL}"
