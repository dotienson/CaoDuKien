const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      // RWT Calculation
      if (availableMethods.rwt && mph !== null) {`;

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
      
      // RWT Calculation
      if (availableMethods.rwt && mph !== null) {`;

const newContent = content.replace(target, krLogic);
fs.writeFileSync('src/App.tsx', newContent);
