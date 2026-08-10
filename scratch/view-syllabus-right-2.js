const fs = require('fs');
const path = require('path');

const filePath = 'd:/saas IA/Kuettu Crypto Academy/src/app/(instructor)/instructor/courses/[courseId]/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Let's print lines 1245 to 1315
const lines = content.split('\n');
console.log('=== Lines 1245 to 1315 ===');
console.log(lines.slice(1245, 1315).join('\n'));
