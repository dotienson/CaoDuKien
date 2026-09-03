const fs = require('fs');
let content = fs.readFileSync('src/utils/exportMetrics.ts', 'utf8');

const targetBorder = `            borders: {
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                zOrder: PageBorderZOrder.FRONT,
                pageBorderLeft: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                pageBorderRight: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                pageBorderTop: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                pageBorderBottom: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
              }
            }`;

const replaceBorder = `            borders: {
              pageBorderLeft: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
              pageBorderRight: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
              pageBorderTop: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
              pageBorderBottom: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                zOrder: PageBorderZOrder.FRONT,
              }
            }`;

content = content.replace(targetBorder, replaceBorder);
fs.writeFileSync('src/utils/exportMetrics.ts', content);
