const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (resultTextStr && krResult && mph) {
      const krText = \` krPAH: \${krResult.pah}cm +/- \${krResult.error}cm\`;
      if (resultTextStr.includes(\`MPH \${mph}cm\`)) {
        resultTextStr = resultTextStr.replace(\`MPH \${mph}cm\`, \`MPH \${mph}cm, \${krText}\`);
      }
    }`;

const replace = `    const isMphFromMotherOnly = !numFatherHeight && numMotherHeight && isValidHeight(numMotherHeight);

    if (resultTextStr && krResult && mph) {
      const krText = \` krPAH: \${krResult.pah}cm +/- \${krResult.error}cm\`;
      if (resultTextStr.includes(\`MPH \${mph}cm\`)) {
        resultTextStr = resultTextStr.replace(\`MPH \${mph}cm\`, \`MPH \${mph}cm, \${krText}\`);
      }
    } else if (resultTextStr && isMphFromMotherOnly && mph) {
      const suffix = lang === 'vi' ? ' - tính từ chiều cao mẹ' : ' - calculated from mother\\'s height';
      if (resultTextStr.includes(\`MPH \${mph}cm\`)) {
        resultTextStr = resultTextStr.replace(\`MPH \${mph}cm\`, \`MPH \${mph}cm\${suffix}\`);
      }
    }`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
