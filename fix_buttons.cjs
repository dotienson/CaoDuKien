const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `<button 
                        onClick={handleExportDocx}
                        className={\`inline-flex items-center gap-2 px-6 py-2.5 rounded-full transition-all shadow-sm border font-bold hover:scale-105 bg-red-50 hover:bg-red-100/70 border-red-200 text-red-700\`}
                        title={t.exportDocx}
                      >
                        <FileText size={18} />
                        {t.exportDocx}
                      </button>`;
                      
const replacement = targetStr + `
                      <button 
                        onClick={() => window.print()}
                        className={\`inline-flex items-center gap-2 px-6 py-2.5 rounded-full transition-all shadow-sm border font-bold hover:scale-105 bg-orange-50 hover:bg-orange-100/70 border-orange-200 text-orange-700\`}
                        title={t.exportPdf}
                      >
                        <FileDown size={18} />
                        {t.exportPdf}
                      </button>`;
                      
code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code, 'utf8');
