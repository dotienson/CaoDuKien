const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetLoginPopup = `            <div className="text-center mb-6 w-full flex justify-center">
              <img src="/logo.png" alt="Logo" className="h-40 w-auto max-w-full mx-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; setLogoError(true); }} />
              {logoError && (
                <h1 className="font-bold text-gray-900 tracking-tight">
                  <span className="block md:hidden text-2xl">
                    OmniAPH® Dr.Son
                  </span>
                  <span className="hidden md:block text-3xl">
                    OmniAPH® 8.2<br/>
                    <span className="text-xl font-medium opacity-80 mt-1 block">Tác giả: Bác sĩ Đỗ Tiến Sơn</span>
                  </span>
                </h1>
              )}
            </div>`;

const replaceLoginPopup = `            <div className="text-center mb-6 w-full flex justify-center">
              <img src="/logo.png" alt="Logo" className="h-40 w-auto max-w-full mx-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; setLogoError(true); }} />
            </div>`;

content = content.replace(targetLoginPopup, replaceLoginPopup);
fs.writeFileSync('src/App.tsx', content);
