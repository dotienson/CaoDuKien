import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Footer, PageBorderDisplay, PageBorderZOrder } from 'docx';
const doc = new Document({
  sections: [{
    properties: {
      page: {
        borders: {
          pageBorders: {
            display: PageBorderDisplay.ALL_PAGES,
            zOrder: PageBorderZOrder.FRONT,
          },
          pageBorderTop: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 24 },
          pageBorderRight: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 24 },
          pageBorderBottom: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 24 },
          pageBorderLeft: { style: BorderStyle.SINGLE, size: 24, color: "000000", space: 24 },
        }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph("footer")]
      })
    },
    children: [new Paragraph("test")]
  }]
});
console.log("Success");
