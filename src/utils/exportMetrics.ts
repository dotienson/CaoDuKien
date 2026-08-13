import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Footer, PageBorderDisplay, PageBorderZOrder, Table, TableRow, TableCell, WidthType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

function generateChartImageBuffer(data: any[]): Uint8Array {
  const canvas = document.createElement('canvas');
  const width = 800;
  const rowHeight = 60;
  const marginTop = 40;
  const marginBottom = 60;
  const marginLeft = 200;
  const marginRight = 100;
  const height = marginTop + marginBottom + data.length * rowHeight;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8Array();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const minPah = Math.min(...data.map(d => d.pah - d.error));
  const maxPah = Math.max(...data.map(d => d.pah + d.error));
  const padding = 2;
  const xMin = Math.floor(minPah - padding);
  const xMax = Math.ceil(maxPah + padding);

  const xScale = (val: number) => marginLeft + ((val - xMin) / (xMax - xMin)) * (width - marginLeft - marginRight);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginLeft, height - marginBottom);
  ctx.lineTo(width - marginRight, height - marginBottom);
  ctx.stroke();

  ctx.font = '16px Arial';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const range = xMax - xMin;
  let interval = 2;
  if (range > 40) interval = 10;
  else if (range > 20) interval = 5;

  const firstTick = Math.ceil(xMin / interval) * interval;

  for (let i = firstTick; i <= xMax; i += interval) {
    const x = xScale(i);
    ctx.beginPath();
    ctx.moveTo(x, height - marginBottom);
    ctx.lineTo(x, height - marginBottom + 8);
    ctx.stroke();
    ctx.fillText(i.toString(), x, height - marginBottom + 12);
    ctx.save();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, marginTop);
    ctx.lineTo(x, height - marginBottom);
    ctx.stroke();
    ctx.restore();
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  data.forEach((d, i) => {
    const y = marginTop + (i + 0.5) * rowHeight;
    const xCenter = xScale(d.pah);
    const xLeft = xScale(d.pah - d.error);
    const xRight = xScale(d.pah + d.error);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(d.method, marginLeft - 20, y);

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    if (d.style && d.style.lineDash) {
      ctx.setLineDash(d.style.lineDash.split(',').map(Number));
    }
    ctx.beginPath();
    ctx.moveTo(xLeft, y);
    ctx.lineTo(xRight, y);
    ctx.stroke();
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xLeft, y - 8);
    ctx.lineTo(xLeft, y + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xRight, y - 8);
    ctx.lineTo(xRight, y + 8);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    switch (d.style?.markerType) {
      case 'circle':
        ctx.arc(xCenter, y, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.rect(xCenter - 6, y - 6, 12, 12);
        ctx.fill();
        break;
      case 'triangle':
        ctx.moveTo(xCenter, y - 7);
        ctx.lineTo(xCenter - 7, y + 6);
        ctx.lineTo(xCenter + 7, y + 6);
        ctx.fill();
        break;
      case 'star':
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(xCenter + Math.cos((18 + j * 72) / 180 * Math.PI) * 8, y - Math.sin((18 + j * 72) / 180 * Math.PI) * 8);
          ctx.lineTo(xCenter + Math.cos((54 + j * 72) / 180 * Math.PI) * 3.5, y - Math.sin((54 + j * 72) / 180 * Math.PI) * 3.5);
        }
        ctx.fill();
        break;
      default:
        ctx.arc(xCenter, y, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.textAlign = 'left';
    ctx.font = '16px Arial';
    ctx.fillText(`${d.pah.toFixed(1)} ± ${d.error.toFixed(1)}`, xRight + 15, y);
    ctx.textAlign = 'right';
  });

  const dataUrl = canvas.toDataURL('image/png');
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
}

export async function exportDocx(
  patientData: any,
  results: any,
  conclusions: any[],
  t: any
) {
  try {
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 22, // 11pt
              font: "Arial",
            },
            paragraph: {
              spacing: { line: 240, before: 60, after: 60 },
            }
          },
          heading1: {
            run: {
              size: 40, // 20pt
              bold: true,
              color: "000000",
              font: "Arial",
            },
            paragraph: {
              spacing: { before: 120, after: 60 },
              alignment: AlignmentType.CENTER,
            }
          },
          heading2: {
            run: {
              size: 32, // 16pt
              bold: true,
              color: "000000",
              font: "Arial",
            },
            paragraph: {
              spacing: { before: 120, after: 60 },
            }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1080,
              right: 1800,
              bottom: 720,
              left: 1800,
            },
            borders: {
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                zOrder: PageBorderZOrder.FRONT,
                left: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                right: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                top: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: "808080", space: 24 },
              }
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'DỮ LIỆU CÁ NHÂN BÍ MẬT - KHÔNG SAO CHỤP',
                    color: '808080',
                    bold: true,
                    size: 16
                  })
                ]
              })
            ]
          })
        },
        children: [
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
          }),
          new Paragraph({ text: '' }), // Spacing

          // Patient Info
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              left: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              right: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    shading: { fill: "E0E7FF" },
                    margins: { top: 100, bottom: 100, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: t.adminInfoTitle || 'THÔNG TIN HÀNH CHÍNH', bold: true, size: 24, color: "1E3A8A" })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    shading: { fill: "F8FAFC" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Họ tên: ', bold: true, size: 22 }),
                          new TextRun({ text: String(patientData.name || 'Ẩn danh'), size: 22 }),
                        ]
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Tuổi: ', bold: true, size: 22 }),
                          new TextRun({ text: `${patientData.ageYears} tuổi ${patientData.ageMonths} tháng`, size: 22 }),
                        ]
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Giới tính: ', bold: true, size: 22 }),
                          new TextRun({ text: String(patientData.genderStr || ''), size: 22 }),
                        ]
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Tuổi xương: ', bold: true, size: 22 }),
                          new TextRun({ text: String(patientData.effectiveBoneAge || ''), size: 22 }),
                        ]
                      }),
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    shading: { fill: "F8FAFC" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Chiều cao: ', bold: true, size: 22 }),
                          new TextRun({ text: `${patientData.currentHeight} cm`, size: 22 }),
                        ]
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Cân nặng: ', bold: true, size: 22 }),
                          new TextRun({ text: `${patientData.weight || ''} kg`, size: 22 }),
                        ]
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'MPH: ', bold: true, size: 22 }),
                          new TextRun({ text: `${patientData.mph || ''} cm`, size: 22 }),
                        ]
                      }),
                      ...(patientData.gender === 'girl' ? [
                        new Paragraph({
                          children: [
                            new TextRun({ text: 'Kinh nguyệt: ', bold: true, size: 22 }),
                            new TextRun({ text: patientData.menarche === 'yes' ? 'Đã có' : 'Chưa', size: 22 }),
                          ]
                        })
                      ] : []),
                    ]
                  })
                ]
              })
            ]
          }),
          
          new Paragraph({ text: '' }), // Spacing

          // Conclusions Box
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              left: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              right: { style: BorderStyle.SINGLE, size: 2, color: "1E3A8A" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "E0E7FF" },
                    margins: { top: 100, bottom: 100, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: t.conclusionTitle || 'KẾT LUẬN', bold: true, size: 24, color: "1E3A8A" })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    shading: { fill: "F8FAFC" },
                    children: conclusions.map(c => new Paragraph({
                      bullet: { level: 0 },
                      children: [
                        new TextRun({ text: c.methodName, bold: true, italics: true }),
                        new TextRun({ text: c.midText }),
                        new TextRun({ text: `${c.pah} +/- ${c.error}`, bold: true, color: "800000" }),
                        new TextRun({ text: c.endText })
                      ],
                      spacing: { after: 60 },
                      alignment: AlignmentType.JUSTIFIED
                    }))
                  })
                ]
              })
            ]
          }),
          
          new Paragraph({ text: '' }),
          
          ...(results.chartData && results.chartData.length > 0 ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: generateChartImageBuffer(results.chartData),
                  transformation: {
                    width: 600,
                    height: (600 / 800) * (100 + results.chartData.length * 60)
                  },
                  type: "png"
                })
              ],
              spacing: { before: 120, after: 60 },
            }),
            new Paragraph({
              text: 'Biểu đồ: Dự kiến chiều cao trưởng thành (PolyPredict APH - Dr. Do Tien Son)',
              alignment: AlignmentType.CENTER,
              italics: true,
              style: 'Caption',
              spacing: { before: 60, after: 120 }
            })
          ] : []),
          
          new Paragraph({
            children: [
              new TextRun({ 
                text: 'Lưu ý: ', 
                bold: true,
                italics: true,
                size: 16
              }),
              new TextRun({
                text: `Kết quả phụ thuộc nhiều vào kết quả tuổi xương, xu hướng biến đổi trong tương lai và nhiều yếu tố sức khoẻ - môi trường khác. Tất cả thuật toán đều chưa có dữ liệu tương tự cho quần thể người Việt Nam đương thời. Các công thức cổ điển đều dựa trên số liệu của quần thể trẻ Âu, Mỹ.${patientData.boneXpertPah ? ' BoneXpert hiện dùng tham chiếu trẻ dân tộc Hán tại Trung Quốc (Asian Chinese).' : ''} Kết quả chỉ phục vụ đánh giá hướng tăng trưởng, hỗ trợ tư vấn và đưa ra quyết định lâm sàng. Các kết quả này không mang tính tiên đoán tương lai.`,
                italics: true,
                size: 16
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 100 }
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Bác sĩ phân tích', bold: true }),
              ...(patientData.isTeleconsultation ? [
                new TextRun({ text: '\n(Hội chẩn từ xa)', bold: true })
              ] : [])
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'ThS.BS. Đỗ Tiến Sơn', bold: true })
            ],
            alignment: AlignmentType.RIGHT,
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    const patientName = patientData.name ? patientData.name.trim() : 'Unknown Name';
    saveAs(blob, `PolyPredict APH Report ${dateStr} ${patientName} Dr Do Tien Son.docx`);
  } catch (error) {
    console.error("Error exporting DOCX:", error);
    alert("Có lỗi xảy ra khi xuất báo cáo DOCX. Vui lòng thử lại.");
  }
}
