const fs = require('fs');
const path = require('path');

// 清理console.log的脚本，保留console.error和console.warn
function cleanConsoleLogs() {
    const srcDir = './src';
    const files = [
        'feishu-api.ts',
        'main.ts', 
        'settings.ts',
        'manual-auth-modal.ts',
        'folder-select-modal.ts'
    ];

    files.forEach(file => {
        const filePath = path.join(srcDir, file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // 只移除console.log，保留console.error和console.warn
            content = content.replace(/console\.log\([^)]*\);\s*/g, '');
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Cleaned console.log from: ${file}`);
        }
    });
}

cleanConsoleLogs();
console.log('Console.log cleanup completed!');
