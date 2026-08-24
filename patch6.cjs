const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const krLogic = `      // Khamis-Roche Calculation
      if (numCurrentHeight && numWeight && mph !== null && numFatherHeight && numMotherHeight) {
        krResult = calculateKhamisRoche(
          gender,
          chronAge,
          Number(numCurrentHeight),
          Number(numWeight),
          Number(numFatherHeight),
          Number(numMotherHeight)
        );
      }
      
`;

content = content.replace(krLogic, '');

const insertTarget = `  if (numCurrentHeight && isValidHeight(numCurrentHeight) && ageYears !== '' && (numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && !invalidAgeError) {`;

const newKrLogic = `  // Khamis-Roche Calculation
  if (numCurrentHeight && isValidHeight(numCurrentHeight) && ageYears !== '' && !invalidAgeError && numWeight && mph !== null && numFatherHeight && numMotherHeight) {
    krResult = calculateKhamisRoche(
      gender,
      chronAge,
      Number(numCurrentHeight),
      Number(numWeight),
      Number(numFatherHeight),
      Number(numMotherHeight)
    );
  }

  if (numCurrentHeight && isValidHeight(numCurrentHeight) && ageYears !== '' && (numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && !invalidAgeError) {`;

content = content.replace(insertTarget, newKrLogic);

fs.writeFileSync('src/App.tsx', content);
