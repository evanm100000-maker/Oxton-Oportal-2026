const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/evanm/Downloads/Staff App/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/color:\s*'(#ffffff|#fff)'/gi, "color: 'var(--color-text-main)'");
  newContent = newContent.replace(/color:\s*"(#ffffff|#fff)"/gi, 'color: "var(--color-text-main)"');
  
  // also handle conditional colors e.g. color: isActive ? '#ffffff' : '#9ca3af'
  newContent = newContent.replace(/'#ffffff'/gi, "'var(--color-text-main)'");
  newContent = newContent.replace(/"#ffffff"/gi, '"var(--color-text-main)"');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed', file);
  }
});
console.log('Done');
