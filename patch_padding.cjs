const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetMainContainer = `        {/* Main Content to Export */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-4 md:p-10 relative">`;

const replaceMainContainer = `        {/* Main Content to Export */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-4 md:px-8 md:py-6 relative">`;

content = content.replace(targetMainContainer, replaceMainContainer);

fs.writeFileSync('src/App.tsx', content);
