// Script to help convert remaining Next.js API routes to Netlify Functions
// Run this after setting up the basic structure

const fs = require('fs');
const path = require('path');

const apiDir = './pages/api';
const functionsDir = './netlify/functions';

// Ensure functions directory exists
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Get all API route files
const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.ts'));

console.log('🔄 Converting API routes to Netlify Functions...');
console.log(`Found ${apiFiles.length} API routes to convert:`);

apiFiles.forEach(file => {
  console.log(`📄 ${file}`);
});

console.log('\n📝 Manual conversion needed for:');
console.log('- socketio.ts (requires special handling for WebSocket)');
console.log('- Any routes using Next.js specific features');

console.log('\n✅ Already converted:');
console.log('- health.ts → netlify/functions/health.mjs');
console.log('- stats.ts → netlify/functions/stats.mjs');

console.log('\n🎯 Next steps:');
console.log('1. Convert remaining API routes manually');
console.log('2. Update import paths to use .js extensions');
console.log('3. Test functions locally with `netlify dev`');
console.log('4. Deploy to Netlify');
