const fs = require('fs');
let code = fs.readFileSync('src/components/PrintableReport.tsx', 'utf8');

const target = `{/* Conclusions */}
        <div className="border-[2px] border-[#1E3A8A] p-4 mb-6 leading-relaxed">
          {conclusions.map((c: any, i: number) => (`;
          
const replacement = `{/* Conclusions */}
        <div className="border-[2px] border-[#1E3A8A] mb-6 leading-relaxed bg-[#F8FAFC]">
          <div className="bg-[#E0E7FF] text-[#1E3A8A] font-bold text-lg text-center py-2">
            {t.conclusionTitle || 'KẾT LUẬN'}
          </div>
          <div className="p-4">
            {conclusions.map((c: any, i: number) => (`;
            
const targetEnd = `</div>
          ))}
        </div>`;
const replacementEnd = `</div>
            ))}
          </div>
        </div>`;
        
code = code.replace(target, replacement);
code = code.replace(targetEnd, replacementEnd);
fs.writeFileSync('src/components/PrintableReport.tsx', code, 'utf8');
