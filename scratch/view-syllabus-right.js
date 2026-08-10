const fs = require('fs');
const path = require('path');

const filePath = 'd:/saas IA/Kuettu Crypto Academy/src/app/(instructor)/instructor/courses/[courseId]/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Let's find selectedLessonId and check how the right panel is structured
const lines = content.split('\n');
console.log('Total Lines:', lines.length);

const idx = lines.findIndex(l => l.includes('selectedLessonId') && l.includes('?'));
console.log('Found selectedLessonId reference at index:', idx + 1);

console.log('=== Lines 1160 to 1250 ===');
console.log(lines.slice(1160, 1250).join('\n'));
