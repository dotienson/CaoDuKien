const fs = require('fs');
let code = fs.readFileSync('src/utils/exportMetrics.ts', 'utf8');

const targetStr = `function generateChartImageBuffer(data: any[]): Uint8Array {
  const canvas = document.createElement('canvas');`;
  
let startIndex = code.indexOf(targetStr);
if (startIndex !== -1) {
  let endIndex = code.indexOf('export async function exportDocx(', startIndex);
  if (endIndex !== -1) {
    const replacement = `function generateChartImageBuffer(data: any[]): Uint8Array {
  const dataUrl = generateChartDataUrl(data);
  if (!dataUrl) return new Uint8Array();
  const base64Data = dataUrl.replace(/^data:image\\/png;base64,/, "");
  return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
}

`;
    code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    fs.writeFileSync('src/utils/exportMetrics.ts', code, 'utf8');
    console.log('Fixed exportMetrics.ts');
  }
}
