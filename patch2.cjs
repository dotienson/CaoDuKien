const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={\`block text-sm \${theme.labelDark} mb-1.5\`}>{t.weight}</label>
                  <input type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value.replace(',', '.'))} className={\`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm \${theme.inputBorder}\`} />
                </div>
                <div>
                  <label className={\`block text-sm \${theme.labelDark} mb-1.5\`}>{t.recumbentLength}</label>
                  <input type="text" inputMode="decimal" value={recumbentLength} onChange={e => setRecumbentLength(e.target.value.replace(',', '.'))} placeholder={numCurrentHeight ? String(numCurrentHeight + 1.25) : ''} className={\`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm \${theme.inputBorder}\`} />
                  {numRecumbentLength !== '' && numCurrentHeight !== '' && Number(numRecumbentLength) < Number(numCurrentHeight) && <p className="text-xs text-red-500 mt-1.5">Chiều dài nằm không hợp lệ</p>}
                </div>
              </div>`;

const newUI = target + `
              {krResult && (
                <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <div className="text-sm font-medium text-blue-900 mb-2">{lang === 'vi' ? 'Dự kiến theo Khamis-Roche' : 'Khamis-Roche Prediction'}</div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{Math.round((krResult.pah - krResult.error) * 10) / 10} cm</span>
                      <span className="font-bold text-blue-700">{krResult.pah} cm (+/- {krResult.error})</span>
                      <span className="text-gray-500">{Math.round((krResult.pah + krResult.error) * 10) / 10} cm</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 bg-blue-500/30 rounded-full" style={{ left: '0%', width: '100%' }}></div>
                      <div className="absolute top-0 bottom-0 bg-blue-500 rounded-full" style={{ left: '25%', width: '50%' }}></div>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-blue-800" style={{ left: '50%' }}></div>
                    </div>
                  </div>
                </div>
              )}`;

content = content.replace(target, newUI);
fs.writeFileSync('src/App.tsx', content);
