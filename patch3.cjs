const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (resultTextStr && (boneXpertPah || boneXpertError || aphv)) {`;
const replace = `    if (resultTextStr && krResult && mph) {
      const krText = \` K-R APH: \${krResult.pah}cm +/- \${krResult.error}cm\`;
      if (resultTextStr.includes(\`MPH \${mph}cm\`)) {
        resultTextStr = resultTextStr.replace(\`MPH \${mph}cm\`, \`MPH \${mph}cm, \${krText}\`);
      }
    }
    
    if (resultTextStr && (boneXpertPah || boneXpertError || aphv)) {`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
