const fs = require('fs');
const path = require('path');

const filePath = 'd:/saas IA/Kuettu Crypto Academy/src/app/(instructor)/instructor/courses/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

function search(term) {
  console.log(`\n=== Searching for "${term}" ===`);
  const lines = content.split('\n');
  let count = 0;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(term.toLowerCase())) {
      console.log(`${index + 1}: ${line.trim()}`);
      count++;
    }
  });
  console.log(`Found ${count} occurrences.`);
}

search('category');
search('categories');
search('categoriesData');
search('categoriesMap');
