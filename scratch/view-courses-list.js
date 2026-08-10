const fs = require('fs');
const path = require('path');

const filePath = 'd:/saas IA/Kuettu Crypto Academy/src/app/(instructor)/instructor/courses/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

console.log('Total Lines:', content.split('\n').length);
// Let's print lines 50 to 120
console.log('=== Lines 50-120 ===');
console.log(content.split('\n').slice(50, 120).join('\n'));
