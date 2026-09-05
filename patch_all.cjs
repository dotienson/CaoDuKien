const fs = require('fs');

// Patch exportMetrics.ts
let exportContent = fs.readFileSync('src/utils/exportMetrics.ts', 'utf8');

const targetLogoFetch = `    let logoBuffer: ArrayBuffer | null = null;
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
exportContent = exportContent.replace(targetLogoFetch, '');

const targetLogoHeader = `        children: [
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

const replaceLogoHeader = `        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: t.title === "OmniAPH® - Bác sĩ Đỗ Tiến Sơn" ? "KẾT QUẢ TÍNH CHIỀU CAO TRƯỞNG THÀNH" : "PREDICTED ADULT HEIGHT REPORT",
                size: 32,
                bold: true,
                color: "1E3A8A"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
          }),`;
exportContent = exportContent.replace(targetLogoHeader, replaceLogoHeader);

exportContent = exportContent.replace(
  "Các kết quả này không mang tính tiên đoán tương lai.",
  "Các kết quả này không mang tính tiên đoán tương lai và thay đổi theo tuổi xương, nhân trắc từng thời điểm."
);

fs.writeFileSync('src/utils/exportMetrics.ts', exportContent);

// Patch i18n/index.ts
let i18nContent = fs.readFileSync('src/i18n/index.ts', 'utf8');
i18nContent = i18nContent.replace(
  "Không mang tính tiên đoán tương lai.",
  "Các kết quả này không mang tính tiên đoán tương lai và thay đổi theo tuổi xương, nhân trắc từng thời điểm."
);
fs.writeFileSync('src/i18n/index.ts', i18nContent);

