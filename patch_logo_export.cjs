const fs = require('fs');
let content = fs.readFileSync('src/utils/exportMetrics.ts', 'utf8');

const target1 = `export async function exportDocx(
  patientData: any,
  results: any,
  conclusions: any[],
  t: any
) {
  try {`;

const replace1 = `export async function exportDocx(
  patientData: any,
  results: any,
  conclusions: any[],
  t: any
) {
  try {
    let logoBuffer: ArrayBuffer | null = null;
    try {
      const response = await fetch('/logo.png');
      if (response.ok) {
        logoBuffer = await response.arrayBuffer();
      }
    } catch (e) {
      console.warn("Could not load logo for export", e);
    }
`;

content = content.replace(target1, replace1);

const target2 = `        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: t.title,`;

const replace2 = `        children: [
          ...(logoBuffer ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoBuffer,
                  transformation: {
                    width: 100,
                    height: 100,
                  },
                }),
              ],
              spacing: { after: 120 },
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: t.title,`;

content = content.replace(target2, replace2);

fs.writeFileSync('src/utils/exportMetrics.ts', content);
