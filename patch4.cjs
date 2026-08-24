const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 bg-blue-500/30 rounded-full" style={{ left: '0%', width: '100%' }}></div>
                      <div className="absolute top-0 bottom-0 bg-blue-500 rounded-full" style={{ left: '25%', width: '50%' }}></div>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-blue-800" style={{ left: '50%' }}></div>
                    </div>`;

const replace = `                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative mt-1">
                      <div className="absolute top-0 bottom-0 bg-red-400" style={{ left: '0%', width: '25%' }}></div>
                      <div className="absolute top-0 bottom-0 bg-green-400" style={{ left: '25%', width: '50%' }}></div>
                      <div className="absolute top-0 bottom-0 bg-red-400" style={{ left: '75%', width: '25%' }}></div>
                      <div className="absolute top-0 bottom-0 w-1 bg-blue-600 z-10" style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                    </div>`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
