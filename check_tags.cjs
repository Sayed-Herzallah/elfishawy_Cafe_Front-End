const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminExpensesPage.tsx', 'utf8');
let openTags = 0;
let inString = false;
let stringChar = '';
for(let i=0; i<content.length; i++) {
  const c = content[i];
  if (!inString && (c === '"' || c === "'")) {
    inString = true;
    stringChar = c;
  } else if (inString && c === stringChar && content[i-1] !== '\\') {
    inString = false;
  }
  if (!inString && c === '<') {
    if (i+1 < content.length && content[i+1] !== '/' && content[i+1] !== '!' && content[i+1] !== '?') {
      const tagEnd = content.indexOf('>', i);
      if (tagEnd === -1) {
        console.log('Unclosed tag at', i);
        break;
      }
      const tag = content.substring(i+1, tagEnd).split(' ')[0];
      if (!tag.endsWith('/')) {
        openTags++;
      }
    } else if (i+1 < content.length && content[i+1] === '/') {
      openTags--;
    }
  }
}
console.log('Open tags:', openTags);