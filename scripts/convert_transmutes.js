const fs = require('fs');
const path = require('path');

// Path to Transmutes_RAG folder
const transmutesPath = '/Users/sanketbojewar/Desktop/transmutes/Transmutes_RAG';
const outputPath = path.join(__dirname, 'sample_data.json');

console.log('🔍 Scanning Transmutes_RAG folder...\n');

// Get all JSON files
const files = fs.readdirSync(transmutesPath)
  .filter(file => file.endsWith('.json'))
  .sort();

console.log(`Found ${files.length} JSON files\n`);

const convertedData = [];
let totalContent = 0;

files.forEach((filename, index) => {
  try {
    const filePath = path.join(transmutesPath, filename);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    // Extract title and content
    const title = data.title || filename.replace('.json', '');
    const content = data.textContent || '';

    // Skip if no content
    if (!content || content.trim().length === 0) {
      console.log(`⏭️  Skipping ${filename} (no content)`);
      return;
    }

    // Create entry
    const entry = {
      url: `transmutes://notes/${filename.replace('.json', '')}`,
      title: title,
      content: content.trim()
    };

    convertedData.push(entry);
    totalContent += content.length;

    console.log(`✅ ${index + 1}. ${title} (${content.length} chars)`);

  } catch (error) {
    console.log(`❌ Error processing ${filename}:`, error.message);
  }
});

// Write output
fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));

console.log(`\n🎉 Conversion complete!`);
console.log(`📊 Statistics:`);
console.log(`   - Total documents: ${convertedData.length}`);
console.log(`   - Total characters: ${totalContent.toLocaleString()}`);
console.log(`   - Average per document: ${Math.round(totalContent / convertedData.length).toLocaleString()} chars`);
console.log(`\n💾 Saved to: ${outputPath}`);
console.log(`\n🚀 Now run: npm run seed`);
