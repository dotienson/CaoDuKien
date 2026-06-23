import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export async function exportDocx(
  patientData: any,
  results: any,
  conclusions: string[],
  t: any
) {
  try {
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

        // Conclusions
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          text: 'Kết luận'
        }),
        ...conclusions.map(c => new Paragraph({
          children: [new TextRun({ text: c, size: 24 })], // size 24 half-points = 12pt
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED
        })),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Lưu ý: ', 
              bold: true,
              italics: true,
              size: 24
            }),
            new TextRun({
              text: 'Kết quả tính phục vụ cho theo dõi định kì, đánh giá xu hướng tăng trưởng và chỉ định lâm sàng, không mang tính tiên đoán. Các thuật toán hiện tại đều dựa trên các quần thể tham chiếu không phải trẻ em Việt Nam.',
              italics: true,
              size: 24
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 200 }
        })
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
