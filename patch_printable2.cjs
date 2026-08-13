const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const renderAnchor = "{/* Reset Confirmation Modal */}";
const injectRender = `
      {/* Printable Report (Hidden in UI, only visible when printing) */}
      <PrintableReport 
        patientData={patientDataForPrint} 
        results={{ resultText: resultTextStr, chartData }} 
        conclusions={conclusions} 
        t={t} 
        chartData={chartData} 
      />
      
      `;
code = code.replace(renderAnchor, injectRender + renderAnchor);

fs.writeFileSync('src/App.tsx', code, 'utf8');
