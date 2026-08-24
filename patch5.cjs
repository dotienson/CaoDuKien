const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = 'const krText = ` K-R APH: ${krResult.pah}cm +/- ${krResult.error}cm`;';
const replace1 = 'const krText = ` krPAH: ${krResult.pah}cm +/- ${krResult.error}cm`;';
content = content.replace(target1, replace1);

const oldKrCard = `              {krResult && (
                <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <div className="text-sm font-medium text-blue-900 mb-2">{lang === 'vi' ? 'Dự kiến theo Khamis-Roche' : 'Khamis-Roche Prediction'}</div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{Math.round((krResult.pah - krResult.error) * 10) / 10} cm</span>
                      <span className="font-bold text-blue-700">{krResult.pah} cm (+/- {krResult.error})</span>
                      <span className="text-gray-500">{Math.round((krResult.pah + krResult.error) * 10) / 10} cm</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative mt-1">
                      <div className="absolute top-0 bottom-0 bg-red-400" style={{ left: '0%', width: '25%' }}></div>
                      <div className="absolute top-0 bottom-0 bg-green-400" style={{ left: '25%', width: '50%' }}></div>
                      <div className="absolute top-0 bottom-0 bg-red-400" style={{ left: '75%', width: '25%' }}></div>
                      <div className="absolute top-0 bottom-0 w-1 bg-blue-600 z-10" style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                    </div>
                  </div>
                </div>
              )}`;

content = content.replace(oldKrCard, '');

const target2 = `              <div className={\`\${theme.cardBg} p-3 rounded-xl border \${theme.cardBorder} text-sm flex justify-between items-center shadow-sm\`}>
                <span className={\`font-medium \${theme.labelDark}\`}>{t.mph}:</span>
                <span className={\`font-bold text-lg \${theme.labelDark}\`}>{mph} cm <span className={\`text-xs font-normal opacity-70\`}>(\u00B1{gender === 'boy' ? 10 : 9})</span></span>
              </div>`;

const replace2 = `              <div className={\`\${theme.cardBg} p-3 rounded-xl border \${theme.cardBorder} text-sm flex justify-between items-center shadow-sm\`}>
                <span className={\`font-medium \${theme.labelDark}\`}>{t.mph}:</span>
                <span className={\`font-bold text-lg \${theme.labelDark}\`}>{mph} cm <span className={\`text-xs font-normal opacity-70\`}>(\u00B1{gender === 'boy' ? 10 : 9})</span></span>
              </div>
              
              {krResult && (
                <div className={\`mt-4 \${theme.cardBg} p-3 rounded-xl border \${theme.cardBorder} text-sm flex justify-between items-center shadow-sm\`}>
                  <span className={\`font-medium \${theme.labelDark}\`}>{lang === 'vi' ? 'Dự kiến theo Khamis-Roche' : 'Khamis-Roche Prediction'}:</span>
                  <span className={\`font-bold text-lg \${theme.labelDark}\`}>{krResult.pah} cm <span className={\`text-xs font-normal opacity-70\`}>(+/- {krResult.error})</span></span>
                </div>
              )}`;

content = content.replace(target2, replace2);

fs.writeFileSync('src/App.tsx', content);
