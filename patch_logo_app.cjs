const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const loginTarget = `<div className="text-center mb-8">
              <h1 className="font-bold text-gray-900 tracking-tight">`;
const loginReplace = `<div className="text-center mb-8">
              <img src="/logo.png" alt="Logo" className="h-20 w-auto mx-auto mb-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <h1 className="font-bold text-gray-900 tracking-tight">`;

content = content.replace(loginTarget, loginReplace);

const headerTarget = `              <div>
                <h1 className={\`font-bold tracking-tight \${primaryColor} flex items-center justify-center md:justify-start gap-3\`}>
                  <span className="block md:hidden text-2xl">
                    OmniAPH® Dr.Son
                  </span>
                  <span className="hidden md:block text-3xl">`;

const headerReplace = `              <div>
                <h1 className={\`font-bold tracking-tight \${primaryColor} flex items-center justify-center md:justify-start gap-3\`}>
                  <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain hidden md:block" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <span className="block md:hidden text-2xl">
                    <img src="/logo.png" alt="Logo" className="h-8 w-auto inline-block mr-2 align-middle object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    OmniAPH® Dr.Son
                  </span>
                  <span className="hidden md:block text-3xl">`;

content = content.replace(headerTarget, headerReplace);

fs.writeFileSync('src/App.tsx', content);
