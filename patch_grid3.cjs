const fs = require('fs');
let code = fs.readFileSync('src/components/PrintableReport.tsx', 'utf8');

const target = `<div className="border-[2px] border-[#1E3A8A] p-4 mb-6">
          <div className="flex bg-[#F8FAFC]">
            <div className="w-1/2 flex flex-col gap-2 p-4">`;
          
const replacement = `<div className="border-[2px] border-[#1E3A8A] mb-6">
          <div className="bg-[#E0E7FF] text-[#1E3A8A] font-bold text-lg text-center py-2">
            {t.adminInfoTitle || 'THÔNG TIN HÀNH CHÍNH'}
          </div>
          <div className="flex bg-[#F8FAFC]">
            <div className="w-1/2 flex flex-col gap-2 p-4">`;
          
code = code.replace(target, replacement);
fs.writeFileSync('src/components/PrintableReport.tsx', code, 'utf8');
