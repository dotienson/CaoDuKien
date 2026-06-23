import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export async function exportPdf(
  elementIdForReport: string,
  patientName: string,
  conclusions: string[],
  t: any
) {
  try {
    const reportEl = document.getElementById(elementIdForReport);
    if (!reportEl) return;

    // Create a clone to safely append conclusions without mutating React DOM
    const clone = reportEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = reportEl.offsetWidth + 'px'; // Ensure same layout width
    document.body.appendChild(clone);

    const conclusionsDiv = document.createElement('div');
    conclusionsDiv.className = 'mt-8 p-4 bg-white/50 border border-gray-400 rounded-xl';
    conclusionsDiv.innerHTML = `
      <h3 class="font-bold text-lg mb-2 border-b border-gray-400 pb-2">Kết luận</h3>
      ${conclusions.map(c => `<p class="text-sm mb-2 text-gray-800 font-medium text-justify">${c}</p>`).join('')}
    `;
    clone.appendChild(conclusionsDiv);

    // Wait briefly for browser layout
    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    
    document.body.removeChild(clone);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HexaPAH_Report_${patientName || 'Khach'}.pdf`);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
  }
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
    const chartEl = document.getElementById(elementIdForChart);
    if (chartEl) {
      const clone = chartEl.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = chartEl.offsetWidth + 'px';
      clone.style.height = chartEl.offsetHeight + 'px';
      document.body.appendChild(clone);
      await new Promise(resolve => setTimeout(resolve, 50));
      const canvas = await html2canvas(clone, { scale: 2 });
      chartImage = canvas.toDataURL('image/png');
      document.body.removeChild(clone);
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
