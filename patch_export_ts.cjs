const fs = require('fs');
let content = fs.readFileSync('src/utils/exportMetrics.ts', 'utf8');

const targetBorder = `                left: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                right: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                top: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },`;

const replaceBorder = `                pageBorderLeft: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                pageBorderRight: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                pageBorderTop: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                pageBorderBottom: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },`;

content = content.replace(targetBorder, replaceBorder);

const targetImage = `                new ImageRun({
                  data: logoBuffer,
                  transformation: {
                    width: 100,
                    height: 100,
                  },
                }),`;

const replaceImage = `                new ImageRun({
                  data: logoBuffer,
                  transformation: {
                    width: 100,
                    height: 100,
                  },
                  type: 'png',
                }),`;

content = content.replace(targetImage, replaceImage);

fs.writeFileSync('src/utils/exportMetrics.ts', content);
