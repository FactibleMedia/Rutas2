import fs from 'fs';

const content = fs.readFileSync('src/Mapas.jsx', 'utf8');
const lines = content.split('\n');

// Find start: "Side Panel:" comment
let startIdx = -1;
// Find end: "mapas-ui-bottom" div
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Side Panel:')) {
    startIdx = i;
  }
  if (lines[i].includes('mapas-ui-bottom') && startIdx !== -1 && endIdx === -1) {
    endIdx = i;
  }
}

console.log(`Start: line ${startIdx + 1}, End: line ${endIdx + 1}`);

const newLines = [
  ...lines.slice(0, startIdx),
  ...lines.slice(endIdx)
];

fs.writeFileSync('src/Mapas.jsx', newLines.join('\n'), 'utf8');
console.log('Side panel removed successfully');
