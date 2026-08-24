const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  if ((numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && ageYears !== '') {`;

const replace = `  if (ageYears !== '' && krResult && numBoneAge === '' && !noBoneAge) {
    resultTextStr = t.resultTextKROnly(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(krResult.pah), String(krResult.error), isTeleconsultation);
  }

  if ((numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && ageYears !== '') {`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
