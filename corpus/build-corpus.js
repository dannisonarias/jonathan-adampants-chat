#!/usr/bin/env node
// Strips embeddings from index.json and writes corpus-text.json for the web app.
// Usage: node build-corpus.js <path-to-index.json>
// Default source: ../../.claude/skills/jonathan-teacher/streamlined/index.json

const fs = require('fs');
const path = require('path');

const src = process.argv[2] || path.join(__dirname, '../../.claude/skills/jonathan-teacher/streamlined/index.json');
const dest = path.join(__dirname, 'corpus-text.json');

if (!fs.existsSync(src)) {
  console.error(`Source not found: ${src}`);
  process.exit(1);
}

console.log(`Reading ${src}...`);
const chunks = JSON.parse(fs.readFileSync(src, 'utf8'));

const stripped = chunks.map(({ file, chunk_idx, text }) => ({ file, chunk_idx, text }));

fs.writeFileSync(dest, JSON.stringify(stripped));
console.log(`Wrote ${stripped.length} chunks → ${dest} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
