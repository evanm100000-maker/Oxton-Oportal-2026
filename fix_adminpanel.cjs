const fs = require('fs');

const path = 'c:/Users/evanm/Downloads/Staff App/src/components/AdminPanel.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the misplaced `)}`
// We need to find `      {/* Sub Tab: X */}\n      )}\n{activeSubTab === 'X' && (`
// and change it to `      )}\n      {/* Sub Tab: X */}\n{activeSubTab === 'X' && (`

const tabs = ['Roles', 'Staff', 'Infractions', 'Flights', 'Flight Logs', 'LOAs', 'Passwords', 'System Status', 'Audit Log'];

tabs.forEach(tab => {
  const comment = `{/* Sub Tab: ${tab} */}`;
  
  // The script might have variations in spaces. Let's use regex or indexOf
  const searchPattern = `${comment}\n      )}\n`;
  if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, `)}\n      ${comment}\n`);
  } else {
    // If different spacing
    const regex = new RegExp(`(\\{/\\* Sub Tab: ${tab} \\*/\\})\\s*\\)\\}\\s*`, 'g');
    content = content.replace(regex, `)}\n      $1\n`);
  }
});

// For "System Status", the comment is `      {/* Sub Tab: System Status */}`
// Wait, the comment for 'flight_logs' might be `Flight Logs`, 'status' might be `System Status`.
// Let's just do a generic regex that finds ANY comment `{/* ... */}` followed by `)}`
// Wait, the regex `(\\{/\\*.*?\\*/\\})\\s*\\)\\}` replaces `{/* comment */} )}` with `)} {/* comment */}`
content = content.replace(/(\{\/\*[\s\S]*?\*\/\})\s*\)\}/g, ')}\n      $1');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully fixed syntax errors in AdminPanel.jsx.');
