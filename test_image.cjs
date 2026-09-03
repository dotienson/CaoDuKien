const fs = require('fs');
let content = fs.readFileSync('src/utils/exportMetrics.ts', 'utf8');

const target1 = `    let logoBuffer: ArrayBuffer | null = null;
    try {
      const response = await fetch('/logo.png');
      if (response.ok) {
        logoBuffer = await response.arrayBuffer();
      }
    } catch (e) {
      console.warn("Could not load logo for export", e);
    }`;

const replace1 = `    let logoBuffer: ArrayBuffer | null = null;
    let logoWidth = 100;
    let logoHeight = 100;
    try {
      const response = await fetch('/logo.png');
      if (response.ok) {
        logoBuffer = await response.arrayBuffer();
        const blob = new Blob([logoBuffer], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const maxW = 300; 
            const maxH = 150; 
            const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
            logoWidth = Math.round(img.naturalWidth * ratio);
            logoHeight = Math.round(img.naturalHeight * ratio);
            resolve();
          };
          img.onerror = () => resolve();
        });
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn("Could not load logo for export", e);
    }`;

content = content.replace(target1, replace1);

const target2 = `        children: [
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
                  type: 'png',
                }),
              ],
              spacing: { after: 120 },
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: t.title,
                size: 40,
                bold: true,
                color: "1E3A8A"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t.subtitle === "Dự đoán APH đa mô thức" ? "Dự đoán chiều cao khi trưởng thành đa mô thức" : t.subtitle,
                size: 28,
                color: "1E3A8A"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),`;

const replace2 = `        children: [
          ...(logoBuffer ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoBuffer,
                  transformation: {
                    width: logoWidth,
                    height: logoHeight,
                  },
                  type: 'png',
                }),
              ],
              spacing: { after: 120 },
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: t.title === "OmniAPH® - Bác sĩ Đỗ Tiến Sơn" ? "BÁO CÁO DỰ KIẾN CHIỀU CAO CUỐI" : "PREDICTED ADULT HEIGHT REPORT",
                size: 32,
                bold: true,
                color: "1E3A8A"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
          }),`;

content = content.replace(target2, replace2);

fs.writeFileSync('src/utils/exportMetrics.ts', content);
