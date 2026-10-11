const fs = require('fs');

const path = 'c:/Users/evanm/Downloads/Staff App/src/components/AdminPanel.jsx';
let content = fs.readFileSync(path, 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Remove the IntersectionObserver useEffect
const observerStart = content.indexOf('  useEffect(() => {\n    const observer = new IntersectionObserver');
if (observerStart !== -1) {
  const observerEnd = content.indexOf('  }, []);\n', observerStart) + '  }, []);\n'.length;
  content = content.substring(0, observerStart) + content.substring(observerEnd);
}

// 2. Change scrollIntoView to setActiveSubTab
const tabs = ['approvals', 'roles', 'staff', 'infractions', 'flights', 'flight_logs', 'loas', 'passwords', 'status', 'audit'];
tabs.forEach(tab => {
  content = content.replaceAll(
    `onClick={() => document.getElementById('section-${tab}')?.scrollIntoView({ behavior: 'smooth' })}`,
    `onClick={() => setActiveSubTab('${tab}')}`
  );
});

// 3. Wrap sections properly
const transitions = [
  { prev: null, curr: 'approvals', comment: '{/* Sub Tab: Approvals */}' },
  { prev: 'approvals', curr: 'infractions', comment: '{/* Sub Tab: Infractions */}' },
  { prev: 'infractions', curr: 'roles', comment: '{/* Sub Tab: Roles */}' },
  { prev: 'roles', curr: 'staff', comment: '{/* Sub Tab: Staff Actions (Remove, Points) */}' },
  { prev: 'staff', curr: 'flight_logs', comment: '{/* Sub Tab: Flight Logs Review */}' },
  { prev: 'flight_logs', curr: 'flights', comment: '{/* Sub Tab: Schedule Flight */}' },
  { prev: 'flights', curr: 'loas', comment: '{/* Sub Tab: LOA Review */}' },
  { prev: 'loas', curr: 'passwords', comment: '{/* Sub Tab: Password Resets */}' },
  { prev: 'passwords', curr: 'status', comment: '{/* Sub Tab: System Status */}' },
  { prev: 'status', curr: 'audit', comment: '{/* Sub Tab: Audit Log */}' }
];

transitions.forEach(t => {
  if (t.prev === null) {
    // We use regular expressions to match regardless of exact spacing
    const regex = new RegExp(`(\\{/\\* Sub Tab: Approvals \\*/\\})\\s*(<div id="section-approvals">)`);
    content = content.replace(regex, `$1\n      {activeSubTab === 'approvals' && (\n      $2`);
  } else {
    // For subsequent sections, we find the comment and the div, and insert `)}\n` before the comment
    const regex = new RegExp(`(\\{/\\* Sub Tab: [^\\*]+ \\*/\\})\\s*(<div id="section-${t.curr}">)`);
    content = content.replace(regex, `)}\n\n      $1\n      {activeSubTab === '${t.curr}' && (\n      $2`);
  }
});

// Add the final closing bracket for the audit section
content = content.replace(
  '      </div>\n    </div>\n  );\n}',
  '      )}\n      </div>\n    </div>\n  );\n}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored AdminPanel.jsx.');
