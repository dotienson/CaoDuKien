const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetState = `export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);`;

const replaceState = `export default function App() {
  const [logoError, setLogoError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);`;

content = content.replace(targetState, replaceState);

const targetHeader = `                <h1 className={\`font-bold tracking-tight \${primaryColor} flex items-center justify-center md:justify-start gap-3\`}>
                  <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain hidden md:block" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <span className="block md:hidden text-2xl">
                    <img src="/logo.png" alt="Logo" className="h-8 w-auto inline-block mr-2 align-middle object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    OmniAPH® Dr.Son
                  </span>
                  <span className="hidden md:block text-3xl">
                    OmniAPH® 8.2<br/>
                    <span className="text-xl font-medium opacity-80 mt-1 block">Tác giả: Bác sĩ Đỗ Tiến Sơn</span>
                  </span>
                </h1>`;

const replaceHeader = `                <h1 className={\`font-bold tracking-tight \${primaryColor} flex flex-col md:flex-row items-center justify-center md:justify-start gap-3\`}>
                  <img src="/logo.png" alt="Logo" className="h-20 md:h-28 w-auto object-contain max-w-full" onError={(e) => { e.currentTarget.style.display = 'none'; setLogoError(true); }} />
                  {logoError && (
                    <>
                      <span className="block md:hidden text-2xl">
                        OmniAPH® Dr.Son
                      </span>
                      <span className="hidden md:block text-3xl">
                        OmniAPH® 8.2<br/>
                        <span className="text-xl font-medium opacity-80 mt-1 block">Tác giả: Bác sĩ Đỗ Tiến Sơn</span>
                      </span>
                    </>
                  )}
                </h1>`;

content = content.replace(targetHeader, replaceHeader);

fs.writeFileSync('src/App.tsx', content);
