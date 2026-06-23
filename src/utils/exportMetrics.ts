import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Better way is to just use html2canvas to capture the entire report DOM and put into jsPDF.

export async function exportPdf(
  elementIdForReport: string,
  patientName: string
) {
  const chartEl = document.getElementById(elementIdForReport);
  if (!chartEl) return;

  const canvas = await html2canvas(chartEl, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`HexaPAH_Report_${patientName || 'Khach'}.pdf`);
}

export async function exportDocx(
  elementIdForChart: string,
  patientData: any,
  results: any,
  conclusions: string[],
  t: any
) {
  let chartImage: string | null = null;
  const chartEl = document.getElementById(elementIdForChart);
  if (chartEl) {
    const canvas = await html2canvas(chartEl, { scale: 2 });
    chartImage = canvas.toDataURL('image/png');
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
            new TextRun(patientData.name || '---'),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Giới tính: ', bold: true }),
            new TextRun(patientData.genderStr),
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
            new TextRun(`${patientData.weight} kg`),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tuổi xương: ', bold: true }),
            new TextRun(`${patientData.effectiveBoneAge}`),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'MPH: ', bold: true }),
            new TextRun(`${patientData.mph} cm`),
          ]
        }),
        
        new Paragraph({ text: '' }), // Spacing

        // Chart
        ...(chartImage ? [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: 'Biểu đồ kết quả'
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: chartImage.split(',')[1],
                transformation: {
                  width: 500,
                  height: 350
                },
                type: 'png'
              } as any)
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
          spacing: { after: 200 }
        }))
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `HexaPAH_Report_${patientData.name || 'Khach'}.docx`);
}
