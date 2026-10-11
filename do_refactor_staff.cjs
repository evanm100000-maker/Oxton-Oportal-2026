const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AdminPanel.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The goal is to replace `activeSubTab === 'roles'` and `activeSubTab === 'staff'` with a unified `activeSubTab === 'staffManagement'`.

// 1. Rename tab buttons. We must match the style object call.
const btnRoles = `<button type="button" onClick={() => setActiveSubTab('roles')} style={getTabStyle(activeSubTab === 'roles')}>
          <Users size={16} /> Roles
        </button>`;
const btnStaff = `<button type="button" onClick={() => setActiveSubTab('staff')} style={getTabStyle(activeSubTab === 'staff')}>
          <UserCheck size={16} /> Staff Actions
        </button>`;
const btnStaffMgmt = `<button type="button" onClick={() => setActiveSubTab('staffManagement')} style={getTabStyle(activeSubTab === 'staffManagement')}>
          <Users size={16} /> Staff Management
        </button>`;

if (content.includes(btnRoles)) {
  content = content.replace(btnRoles, btnStaffMgmt);
}
if (content.includes(btnStaff)) {
  content = content.replace(btnStaff, '');
}

// Ensure Windows vs Unix line endings don't break string matching
const btnRolesWin = `<button type="button" onClick={() => setActiveSubTab('roles')} style={getTabStyle(activeSubTab === 'roles')}>\r\n          <Users size={16} /> Roles\r\n        </button>`;
const btnStaffWin = `<button type="button" onClick={() => setActiveSubTab('staff')} style={getTabStyle(activeSubTab === 'staff')}>\r\n          <UserCheck size={16} /> Staff Actions\r\n        </button>`;

if (content.includes(btnRolesWin)) {
  content = content.replace(btnRolesWin, btnStaffMgmt);
}
if (content.includes(btnStaffWin)) {
  content = content.replace(btnStaffWin, '');
}

// 2. We need to construct the new section
const startRoles = content.indexOf('{/* Sub Tab: Roles */}');
const endStaff = content.indexOf('{/* Sub Tab: Flight Logs Review */}');

if (startRoles !== -1 && endStaff !== -1) {
  const newSection = `{/* Sub Tab: Staff Management */}
      {activeSubTab === 'staffManagement' && (
      <div id="section-staffManagement">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>Staff Management</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Search staff..." 
              value={staffSearchQuery} 
              onChange={(e) => setStaffSearchQuery(e.target.value)} 
              className="input-field" 
              style={{ width: '100%', maxWidth: '300px' }} 
            />
          </div>
          {!(currentUser?.siteRole === 'Admin' || currentUser?.siteRole === 'Owner' || currentUser?.email?.toLowerCase() === 'evanm.100000@gmail.com') && (
            <div style={styles.securityAlert}><ShieldAlert size={18} /><span>NOTE: You do not have permission to modify account roles.</span></div>
          )}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Staff Member</th>
                  <th style={styles.th}>Role & Permissions</th>
                  <th style={styles.th}>Points</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.filter(user => \`\${user.firstName} \${user.lastName} \${user.email}\`.toLowerCase().includes(staffSearchQuery.toLowerCase())).map(user => {
                  const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now();
                  return (
                    <tr key={user.email} style={styles.trBody}>
                      <td style={styles.td}>
                        <strong>{user.firstName} {user.lastName}</strong><br/>{user.email}
                        {isSuspended && <div style={{color: '#ef4444', fontSize: '0.8rem', marginTop: '4px'}}>Suspended until: {new Date(user.suspendedUntil).toLocaleString()}</div>}
                      </td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            {user.siteRole === 'Owner' ? <span className="badge badge-admin" style={{background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)'}}>Owner</span> : 
                             user.siteRole === 'Admin' ? <span className="badge badge-admin">Admin</span> : 
                             user.siteRole === 'Moderator' ? <span className="badge badge-admin" style={{background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.5)'}}>Moderator</span> : 
                             <span className="badge">Staff</span>}
                            
                            <select 
                              value={user.siteRole || 'Staff'} 
                              onChange={(e) => {
                                changeSiteRole(user.email, e.target.value); 
                                displaySuccess('Role updated');
                              }}
                              className="input-field"
                              style={{padding: '4px', fontSize: '0.85rem'}}
                              disabled={!canTakeAction(currentUser, user)}
                            >
                              <option value="Staff">Staff</option>
                              <option value="Moderator">Moderator</option>
                              {getRankWeight(currentUser) >= 60 && (
                                <option value="Admin">Admin</option>
                              )}
                              {getRankWeight(currentUser) >= 80 && (
                                <option value="Owner">Owner</option>
                              )}
                            </select>
                          </div>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <input type="text" placeholder={user.customRole || "Custom Role"} value={roleInputs[user.email] !== undefined ? roleInputs[user.email] : user.customRole} onChange={e => setRoleInputs({...roleInputs, [user.email]: e.target.value})} className="input-field" style={{width: '120px', padding: '6px'}} />
                            <button type="button" onClick={() => handleSetRole(user.email)} className="btn-primary" style={{padding: '6px 10px', borderRadius: '6px'}}>Save</button>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{marginBottom: '4px'}}>Current: <strong>{user.points || 0}</strong></div>
                        <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                          <input type="number" placeholder="Amt" value={pointsAmounts[user.email] || ''} onChange={e => setPointsAmounts({...pointsAmounts, [user.email]: e.target.value})} className="input-field" style={{width: '60px', padding: '6px'}} />
                          <input type="text" placeholder="Reason" value={pointsReasons[user.email] || ''} onChange={e => setPointsReasons({...pointsReasons, [user.email]: e.target.value})} className="input-field" style={{width: '100px', padding: '6px'}} />
                          <button type="button" onClick={() => handleAddPoints(user.email)} className="btn-primary" style={{padding: '6px', borderRadius: '6px'}}><Plus size={14}/></button>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                          <button type="button" onClick={() => {
                            if (window.confirm(\`Log Missed Flight for \${user.firstName}?\`)) {
                              logMissedFlight(user.email);
                              displaySuccess('Missed flight logged.');
                            }
                          }} className="btn-secondary" style={{padding: '6px 10px', fontSize: '0.8rem'}}>
                            Missed Flight
                          </button>

                          {isSuspended ? (
                            <button type="button" disabled={!canTakeAction(currentUser, user)} onClick={() => {unsuspendUser(user.email); displaySuccess('User unsuspended.');}} className="btn-success" style={{padding: '6px 10px', fontSize: '0.8rem', opacity: (!canTakeAction(currentUser, user)) ? 0.5 : 1}}>
                              Unsuspend
                            </button>
                          ) : (
                            <button type="button" disabled={!canTakeAction(currentUser, user)} onClick={() => setSuspendModalUser(user)} className="btn-danger" style={{padding: '6px 10px', fontSize: '0.8rem', opacity: (!canTakeAction(currentUser, user)) ? 0.5 : 1}}>Suspend</button>
                          )}

                          {user.email !== currentUser.email && canTakeAction(currentUser, user) && (
                            <button type="button" onClick={() => {removeUser(user.email); displaySuccess('Staff removed.');}} className="btn-danger" style={{padding: '6px 10px', fontSize: '0.8rem'}}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      )}
      `;

  content = content.substring(0, startRoles) + newSection + content.substring(endStaff);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully refactored Staff Management.');
} else {
  console.log('Could not find roles or staff sections.');
}
