import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Clock, Plus, Trash2, CheckCircle, X } from 'lucide-react';

export default function Tasks() {
  const { currentUser, activeUsers, tasks, addTask, updateTaskStatus, deleteTask } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [assignedToEmails, setAssignedToEmails] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const myTasks = tasks.filter(t => t.assignedToEmail === currentUser.email);
  const allTasks = tasks; // Admin views all tasks

  const handleAssign = (e) => {
    e.preventDefault();
    if (assignedToEmails.length === 0 || !title) return;
    
    assignedToEmails.forEach(email => {
      addTask({ assignedToEmail: email, title, description });
    });
    
    setAssignedToEmails([]);
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  const tasksToDisplay = currentUser.isAdmin ? allTasks : myTasks;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h3 style={styles.title}>Tasks & Assignments</h3>
          <p style={styles.subtitle}>{currentUser.isAdmin ? 'Manage and assign tasks to staff members.' : 'View and complete your assigned tasks.'}</p>
        </div>
        {currentUser.isAdmin && (
          <button style={styles.newButton} onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> {showForm ? 'Cancel' : 'Assign New Task'}
          </button>
        )}
      </div>

      {showForm && currentUser.isAdmin && (
        <form onSubmit={handleAssign} className="glass-panel" style={styles.form}>
          <h4 style={styles.formTitle}>Assign Task</h4>
          <div style={styles.formGroup}>
            <label style={styles.label}>Assign To *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select 
                value="" 
                onChange={(e) => {
                  if (e.target.value && !assignedToEmails.includes(e.target.value)) {
                    setAssignedToEmails([...assignedToEmails, e.target.value]);
                  }
                }} 
                style={styles.input}
              >
                <option value="">-- Add Staff to Task --</option>
                {activeUsers.filter(u => !assignedToEmails.includes(u.email)).map(u => (
                  <option key={u.email} value={u.email}>{u.firstName} {u.lastName} (@{u.robloxUsername})</option>
                ))}
              </select>
              {assignedToEmails.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {assignedToEmails.map(email => {
                    const u = activeUsers.find(user => user.email === email);
                    return (
                      <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        {u ? u.firstName + ' ' + u.lastName : email}
                        <button type="button" onClick={() => setAssignedToEmails(assignedToEmails.filter(e => e !== email))} style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: '4px' }}><X size={14} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Task Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} placeholder="e.g. Host a training session" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description (Optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{...styles.input, minHeight: '80px'}} placeholder="Add any specific details here..."></textarea>
          </div>
          <button type="submit" style={styles.submitBtn}>Assign Task</button>
        </form>
      )}

      <div style={styles.taskList}>
        {tasksToDisplay.length === 0 ? (
          <div className="glass-panel" style={styles.emptyState}>
            <CheckSquare size={48} color="rgba(255,255,255,0.2)" />
            <p>No tasks currently assigned.</p>
          </div>
        ) : (
          [...tasksToDisplay].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(task => {
            const isCompleted = task.status === 'Completed';
            const assignedUser = activeUsers.find(u => u.email === task.assignedToEmail);
            
            return (
              <div key={task.id} className="glass-panel interactive-card" style={styles.taskCard}>
                <div style={styles.taskContent}>
                  <div style={styles.taskHeader}>
                    <h4 style={{...styles.taskTitle, textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? '#9ca3af' : '#fff'}}>{task.title}</h4>
                    {isCompleted ? (
                      <span className="badge badge-success"><CheckCircle size={14}/> Completed</span>
                    ) : (
                      <span className="badge badge-warning"><Clock size={14}/> Pending</span>
                    )}
                  </div>
                  {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                  <div style={styles.taskMeta}>
                    <span>Assigned by {task.assignedByName}</span>
                    {currentUser.isAdmin && <span> • Assigned to {assignedUser ? assignedUser.firstName : task.assignedToEmail}</span>}
                    <span> • {new Date(task.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div style={styles.taskActions}>
                  {!isCompleted && (task.assignedToEmail === currentUser.email || currentUser.isAdmin) && (
                    <button onClick={() => updateTaskStatus(task.id, 'Completed')} style={styles.completeBtn}>
                      <CheckCircle size={18} /> Mark Complete
                    </button>
                  )}
                  {isCompleted && currentUser.isAdmin && (
                    <button onClick={() => updateTaskStatus(task.id, 'Pending')} style={styles.reopenBtn}>
                      Reopen
                    </button>
                  )}
                  {currentUser.isAdmin && (
                    <button onClick={() => deleteTask(task.id)} style={styles.deleteBtn}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' },
  subtitle: { color: 'var(--color-text-muted)' },
  newButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  formTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#fff', marginBottom: '8px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', color: '#d1d5db', fontWeight: '500' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  submitBtn: { padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  emptyState: { padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  taskCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', gap: '16px', flexWrap: 'wrap' },
  taskContent: { display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '300px' },
  taskHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  taskTitle: { fontSize: '1.1rem', fontWeight: '600', margin: 0 },
  taskDesc: { color: '#d1d5db', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' },
  taskMeta: { display: 'flex', gap: '8px', color: '#9ca3af', fontSize: '0.85rem', flexWrap: 'wrap' },
  taskActions: { display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 },
  completeBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  reopenBtn: { padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  deleteBtn: { display: 'flex', alignItems: 'center', padding: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }
};
