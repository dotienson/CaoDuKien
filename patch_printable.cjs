const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = "const handleExportDocx = () => {";
const injectData = `
  const patientDataForPrint = {
    name,
    gender,
    genderStr,
    ageYears: ageYears || '0',
    ageMonths: ageMonths || 0,
    currentHeight,
    xrayDate: formatDate(xrayDate),
    examDate: formatDate(examDate),
    dob: formatDate(dob),
    weight,
    menarche,
    effectiveBoneAge,
    mph: mph || '---',
    isTeleconsultation,
    hideCoefficients,
    boneXpertPah
  };
`;
code = code.replace(anchor, injectData + '\n  ' + anchor);

const renderAnchor = "{/* Note Panel */}";
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
