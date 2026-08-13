const fs = require('fs');
let code = fs.readFileSync('src/components/PrintableReport.tsx', 'utf8');

const target = `<div className="grid grid-cols-2 gap-4">
            <div><strong>Họ tên:</strong> {patientData.name || '---'}</div>
            <div><strong>Giới tính:</strong> {patientData.gender === 'boy' ? t.boy : t.girl}</div>
            <div><strong>Ngày sinh:</strong> {patientData.dob || '---'}</div>
            <div><strong>Ngày chụp X-quang:</strong> {patientData.xrayDate || '---'}</div>
            <div><strong>Ngày khám:</strong> {patientData.examDate || '---'}</div>
            <div><strong>Tuổi hiện tại:</strong> {patientData.ageYears} tuổi {patientData.ageMonths} tháng</div>
            <div><strong>Tuổi xương (TW3):</strong> {patientData.effectiveBoneAge || '---'}</div>
            <div><strong>Cân nặng:</strong> {patientData.weight ? \`\${patientData.weight} kg\` : '---'}</div>
            <div><strong>Chiều cao:</strong> {patientData.currentHeight ? \`\${patientData.currentHeight} cm\` : '---'}</div>
            <div><strong>MPH:</strong> {patientData.mph ? \`\${patientData.mph} cm\` : '---'}</div>
            {patientData.gender === 'girl' && (
              <div><strong>Kinh nguyệt:</strong> {patientData.menarche === 'yes' ? 'Đã có' : 'Chưa'}</div>
            )}
          </div>`;
          
const replacement = `<div className="flex">
            <div className="w-1/2 flex flex-col gap-2">
              <div><strong>Họ tên:</strong> {patientData.name || '---'}</div>
              <div><strong>Giới tính:</strong> {patientData.gender === 'boy' ? t.boy : t.girl}</div>
              <div><strong>Ngày sinh:</strong> {patientData.dob || '---'}</div>
              <div><strong>Ngày chụp X-quang:</strong> {patientData.xrayDate || '---'}</div>
              <div><strong>Ngày khám:</strong> {patientData.examDate || '---'}</div>
            </div>
            <div className="w-1/2 flex flex-col gap-2">
              <div><strong>Tuổi hiện tại:</strong> {patientData.ageYears} tuổi {patientData.ageMonths} tháng</div>
              <div><strong>Tuổi xương (TW3):</strong> {patientData.effectiveBoneAge || '---'}</div>
              <div><strong>Chiều cao:</strong> {patientData.currentHeight ? \`\${patientData.currentHeight} cm\` : '---'}</div>
              <div><strong>Cân nặng:</strong> {patientData.weight ? \`\${patientData.weight} kg\` : '---'}</div>
              <div><strong>MPH:</strong> {patientData.mph ? \`\${patientData.mph} cm\` : '---'}</div>
              {patientData.gender === 'girl' && (
                <div><strong>Kinh nguyệt:</strong> {patientData.menarche === 'yes' ? 'Đã có' : 'Chưa'}</div>
              )}
            </div>
          </div>`;
          
code = code.replace(target, replacement);
fs.writeFileSync('src/components/PrintableReport.tsx', code, 'utf8');
