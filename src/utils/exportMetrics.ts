import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';

// Better way is to just use html2canvas to capture the entire report DOM and put into jsPDF.

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function exportDocx(
  elementIdForChart: string,
  patientData: any,
  results: any,
  conclusions: string[],
  t: any
) {
  try {
    let chartImage: string | null = null;
    try {
      const chartEl = document.getElementById(elementIdForChart);
      if (chartEl) {
        chartImage = await toPng(chartEl, { 
          backgroundColor: '#ffffff',
          pixelRatio: 2
        });
      }
    } catch (chartErr) {
      console.warn("Failed to capture chart image:", chartErr);
    }

    const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: t.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: t.subtitle,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }), // Spacing

        // Patient Info
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          text: 'Thông tin bệnh nhân' // Use translation if available
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tên: ', bold: true }),
            new TextRun(String(patientData.name || '---')),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Giới tính: ', bold: true }),
            new TextRun(String(patientData.genderStr || '')),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tuổi: ', bold: true }),
            new TextRun(`${patientData.ageYears} tuổi ${patientData.ageMonths} tháng`),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Chiều cao: ', bold: true }),
            new TextRun(`${patientData.currentHeight} cm`),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Cân nặng: ', bold: true }),
            new TextRun(`${patientData.weight || ''} kg`),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tuổi xương: ', bold: true }),
            new TextRun(String(patientData.effectiveBoneAge || '')),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'MPH: ', bold: true }),
            new TextRun(`${patientData.mph || ''} cm`),
          ]
        }),
        
        new Paragraph({ text: '' }), // Spacing

        // Chart
        ...(chartImage && chartImage.includes('base64,') ? [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: 'Biểu đồ kết quả'
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: base64ToUint8Array(chartImage.split(',')[1]),
                transformation: {
                  width: 500,
                  height: 350
                },
                type: 'png'
              })
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),
        ] : []),

        // Conclusions
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          text: 'Kết luận'
        }),
        ...conclusions.map(c => new Paragraph({
          children: [new TextRun({ text: c, size: 24 })], // size 24 half-points = 12pt
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED
        }))
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `HexaPAH_Report_${patientData.name || 'Khach'}.docx`);
  } catch (error) {
    console.error("Error exporting DOCX:", error);
    alert("Có lỗi xảy ra khi xuất báo cáo DOCX. Vui lòng thử lại.");
  }
}
