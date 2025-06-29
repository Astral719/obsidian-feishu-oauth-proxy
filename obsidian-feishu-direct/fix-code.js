// 快速修复脚本 - 移除console.log和innerHTML
const fs = require('fs');

function fixMainJs() {
    let content = fs.readFileSync('main.js', 'utf8');
    
    // 移除所有console.log，但保留console.error
    content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
    content = content.replace(/console\.warn\([^)]*\);?\s*/g, '');
    
    // 替换innerHTML为textContent（简单情况）
    content = content.replace(/\.innerHTML\s*=\s*`([^`]*)`/g, '.textContent = `$1`');
    content = content.replace(/\.innerHTML\s*=\s*"([^"]*)"/g, '.textContent = "$1"');
    content = content.replace(/\.innerHTML\s*=\s*'([^']*)'/g, ".textContent = '$1'");
    
    // 移除内联样式设置
    content = content.replace(/\.style\.cssText\s*=\s*`[^`]*`;?\s*/g, '');
    content = content.replace(/\.style\.[a-zA-Z]+\s*=\s*"[^"]*";?\s*/g, '');
    content = content.replace(/\.style\.[a-zA-Z]+\s*=\s*'[^']*';?\s*/g, '');
    
    // 清理多余的空行
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync('main.js', content);
    console.log('✅ Fixed main.js - removed console.log, innerHTML, and inline styles');
}

fixMainJs();
