const fs = require('fs');
const path = 'c:/Users/evanm/Downloads/Staff App/src/components/AdminPanel.jsx';
let content = fs.readFileSync(path, 'utf8');

// Normalize newlines to \n for easier regex
content = content.replace(/\r\n/g, '\n');

// 1. Remove the stray )} at line 215
content = content.replace(
  '  return (\n    <div className="admin-layout" style={styles.layoutContainer}>\n      )}\n      {/* Sub tabs navigation */}',
  '  return (\n    <div className="admin-layout" style={styles.layoutContainer}>\n      {/* Sub tabs navigation */}'
);

content = content.replace(
  '  return (\n    <div className="admin-layout" style={styles.layoutContainer}>\n      )}\n',
  '  return (\n    <div className="admin-layout" style={styles.layoutContainer}>\n'
);

// 2. Fix the misplaced )} around sub tab comments
// The pattern is:
//       {/* Sub Tab: X */}
//       )}
// {activeSubTab === 'x' && (
const regex = /(\{\/\* Sub Tab: [^\*]+ \*\/\})\s*\)\}\s*(\{activeSubTab === '[^']+' && \()/g;
content = content.replace(regex, ')}\n      $1\n      $2');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed syntax errors.');
