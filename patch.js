const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const newContent = content.replace(
  'let bpResult: { pah: number; error: number; fraction: number } | null = null;',
  'let bpResult: { pah: number; error: number; fraction: number } | null = null;\n  let krResult: { pah: number; error: number } | null = null;'
);
fs.writeFileSync('src/App.tsx', newContent);
