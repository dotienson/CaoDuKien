const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogin = `export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);`;

const replaceLogin = `export default function App() {
  const [logoError, setLogoError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);`;

content = content.replace(targetLogin, replaceLogin);

const targetLoginPopup = `          <div className="bg-white px-10 pt-10 pb-8 border border-gray-300 flex flex-col items-center">
            
            <div className="text-center mb-8">
              <img src="/logo.png" alt="Logo" className="h-20 w-auto mx-auto mb-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <h1 className="font-bold text-gray-900 tracking-tight">
                <span className="block md:hidden text-2xl">
                  OmniAPH® Dr.Son
                </span>
                <span className="hidden md:block text-3xl">
                  OmniAPH® 8.2<br/>
                  <span className="text-xl font-medium opacity-80 mt-1 block">Tác giả: Bác sĩ Đỗ Tiến Sơn</span>
                </span>
              </h1>
            </div>`;

const replaceLoginPopup = `          <div className="bg-white px-8 pt-8 pb-8 border border-gray-300 flex flex-col items-center">
            
            <div className="text-center mb-6 w-full flex justify-center">
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

content = content.replace(targetLoginPopup, replaceLoginPopup);

const targetHeader = `          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 border-b border-gray-200/50 pb-6">
            <div className="md:col-span-7 text-center md:text-left flex flex-col md:flex-row items-center md:items-start gap-3">
              <div>
                <h1 className={\`font-bold tracking-tight \${primaryColor} flex flex-col md:flex-row items-center justify-center md:justify-start gap-3\`}>`;

const replaceHeader = `          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 border-b border-gray-200/50 pb-4">
            <div className="md:col-span-7 text-center md:text-left flex flex-col md:flex-row items-center md:items-start gap-2">
              <div>
                <h1 className={\`font-bold tracking-tight \${primaryColor} flex flex-col md:flex-row items-center justify-center md:justify-start gap-2\`}>`;

content = content.replace(targetHeader, replaceHeader);

const targetFormGrid = `          </div>

          {/* Form Grid */}
          <div className={\`\${theme.cardBg} px-4 md:px-6 pt-8 pb-6 rounded-2xl border \${theme.cardBorder} relative shadow-sm mb-8 mt-6\`}>`;

const replaceFormGrid = `          </div>

          {/* Form Grid */}
          <div className={\`\${theme.cardBg} px-4 md:px-6 pt-6 pb-6 rounded-2xl border \${theme.cardBorder} relative shadow-sm mb-6 mt-2\`}>`;

content = content.replace(targetFormGrid, replaceFormGrid);

fs.writeFileSync('src/App.tsx', content);
