const fs = require('fs');
let content = fs.readFileSync('src/i18n/index.ts', 'utf8');

const targetVi = `    resultTextRWT: (name: string, genderStr: string, ageY: string, ageM: string, currentH: string, weight: string, mph: string, boneAge: string, doctor: string, date: string, pahRWT: string, errorRWT: string, examDate: string, noBoneAge: boolean, isTeleconsultation?: boolean) => 
      \`* \${isTeleconsultation ? 'HỘI CHẨN TỪ XA VỚI BÁC SĨ SƠN VỀ CHIỀU CAO KHI TRƯỞNG THÀNH' : 'DỰ KIẾN CHIỀU CAO KHI TRƯỞNG THÀNH'}\\nBằng thuật toán kinh điển, chiều cao cuối (trẻ \${genderStr}\${name ? \` \${name}\` : ''}, \${ageY} tuổi \${ageM} tháng, hiện cao \${currentH}cm\${weight ? \`, nặng \${weight}kg\` : ''}\${mph ? \`, MPH \${mph}cm\` : ''}, \${noBoneAge ? 'chưa có số liệu tuổi xương' : \`tuổi xương ~ \${boneAge} tuổi\` }) dự kiến như sau: \${pahRWT}cm +/- \${errorRWT}cm (Roche-Wainer-Thissen). Kết quả tính phục vụ cho các chỉ định lâm sàng, không mang tính tiên đoán, chỉ áp dụng cho nhóm trẻ khoẻ mạnh không kèm bệnh lý đặc biệt. Kết quả tính ngày: \${new Date().toLocaleDateString('vi-VN')} - OmniAPH® 8.2.\`,`;

const replaceVi = targetVi + `
    resultTextKROnly: (name: string, genderStr: string, ageY: string, ageM: string, currentH: string, weight: string, mph: string, krPAH: string, krError: string, isTeleconsultation?: boolean) => 
      \`* \${isTeleconsultation ? 'HỘI CHẨN TỪ XA VỚI BÁC SĨ SƠN VỀ CHIỀU CAO KHI TRƯỞNG THÀNH' : 'DỰ KIẾN CHIỀU CAO KHI TRƯỞNG THÀNH'}\\nBằng thuật toán kinh điển, chiều cao cuối (trẻ \${genderStr}\${name ? \` \${name}\` : ''}, \${ageY} tuổi \${ageM} tháng, hiện cao \${currentH}cm\${weight ? \`, nặng \${weight}kg\` : ''}\${mph ? \`, MPH \${mph}cm, krPAH: \${krPAH}cm +/- \${krError}cm\` : ''}, chưa có số liệu tuổi xương) dự kiến theo Khamis-Roche. Kết quả tính phục vụ cho các chỉ định lâm sàng, không mang tính tiên đoán, chỉ áp dụng cho nhóm trẻ khoẻ mạnh không kèm bệnh lý đặc biệt. Kết quả tính ngày: \${new Date().toLocaleDateString('vi-VN')} - OmniAPH® 8.2.\`,`;

content = content.replace(targetVi, replaceVi);

const targetEn = `    resultTextRWT: (name: string, genderStr: string, ageY: string, ageM: string, currentH: string, weight: string, mph: string, boneAge: string, doctor: string, date: string, pahRWT: string, errorRWT: string, examDate: string, noBoneAge: boolean, isTeleconsultation?: boolean) => 
      \`* \${isTeleconsultation ? 'TELECONSULTATION WITH DR. SON FOR PREDICTED ADULT HEIGHT' : 'PREDICTED ADULT HEIGHT'}\\nUsing a classic algorithm, the predicted adult height (\${name ? \`\${name} \` : ''}(\${genderStr}), \${ageY} years \${ageM} months old, height \${currentH}cm\${weight ? \`, weight \${weight}kg\` : ''}\${mph ? \`, MPH \${mph}cm\` : ''}, \${noBoneAge ? 'no bone age data' : \`bone age ~ \${boneAge} years\`}) is: \${pahRWT}cm +/- \${errorRWT}cm (Roche-Wainer-Thissen). The calculated result is for clinical indications, not predictive, and only applicable to healthy children without special medical conditions. Calculation date: \${new Date().toLocaleDateString('en-US')} - OmniAPH® 8.2.\`,`;

const replaceEn = targetEn + `
    resultTextKROnly: (name: string, genderStr: string, ageY: string, ageM: string, currentH: string, weight: string, mph: string, krPAH: string, krError: string, isTeleconsultation?: boolean) => 
      \`* \${isTeleconsultation ? 'TELECONSULTATION WITH DR. SON FOR PREDICTED ADULT HEIGHT' : 'PREDICTED ADULT HEIGHT'}\\nUsing a classic algorithm, the predicted adult height (\${name ? \`\${name} \` : ''}(\${genderStr}), \${ageY} years \${ageM} months old, height \${currentH}cm\${weight ? \`, weight \${weight}kg\` : ''}\${mph ? \`, MPH \${mph}cm, krPAH: \${krPAH}cm +/- \${krError}cm\` : ''}, no bone age data) predicted by Khamis-Roche. The calculated result is for clinical indications, not predictive, and only applicable to healthy children without special medical conditions. Calculation date: \${new Date().toLocaleDateString('en-US')} - OmniAPH® 8.2.\`,`;

content = content.replace(targetEn, replaceEn);
fs.writeFileSync('src/i18n/index.ts', content);
