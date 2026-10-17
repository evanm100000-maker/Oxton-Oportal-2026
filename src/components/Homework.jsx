import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  ExternalLink, 
  BookOpen, 
  CheckCircle, 
  Copy, 
  Check, 
  HelpCircle, 
  Settings, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function Homework() {
  const { currentUser, homeworkConfig, updateHomeworkConfig } = useApp();

  const [copied, setCopied] = useState(false);
  const [isAdminConfigOpen, setIsAdminConfigOpen] = useState(false);
  const [classroomUrlInput, setClassroomUrlInput] = useState(homeworkConfig?.classroomUrl || 'https://classroom.google.com/');
  const [classCodeInput, setClassCodeInput] = useState(homeworkConfig?.classCode || '');
  const [titleInput, setTitleInput] = useState(homeworkConfig?.title || 'Oxton Staff Training & Homework');
  const [descInput, setDescInput] = useState(homeworkConfig?.description || 'Complete mandatory airline staff training modules, procedures homework, and aviation tests.');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const classroomUrl = homeworkConfig?.classroomUrl || 'https://classroom.google.com/';
  const classCode = homeworkConfig?.classCode || '';
  const title = homeworkConfig?.title || 'Oxton Staff Training & Homework';
  const description = homeworkConfig?.description || 'Access Google Classroom to view assigned training coursework, revision materials, and staff homework tasks.';

  const handleCopyCode = () => {
    if (!classCode) return;
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenClassroom = () => {
    window.open(classroomUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (updateHomeworkConfig) {
      updateHomeworkConfig({
        classroomUrl: classroomUrlInput.trim() || 'https://classroom.google.com/',
        classCode: classCodeInput.trim(),
        title: titleInput.trim() || 'Oxton Staff Training & Homework',
        description: descInput.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div className="glass-panel" style={styles.headerCard}>
        <div style={styles.headerInfo}>
          <div style={styles.headerIconWrapper}>
            <GraduationCap size={32} color="#10b981" />
          </div>
          <div>
            <h2 style={styles.headerTitle}>{title}</h2>
            <p style={styles.headerDesc}>{description}</p>
          </div>
        </div>

        {currentUser?.isAdmin && (
          <button 
            type="button"
            onClick={() => setIsAdminConfigOpen(!isAdminConfigOpen)} 
            className="btn-secondary"
            style={styles.adminSettingsBtn}
          >
            <Settings size={16} />
            <span>{isAdminConfigOpen ? 'Close Settings' : 'Configure Classroom'}</span>
          </button>
        )}
      </div>

      {/* Admin Classroom Settings Box */}
      {currentUser?.isAdmin && isAdminConfigOpen && (
        <form onSubmit={handleSaveConfig} className="glass-panel" style={styles.adminConfigBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Settings size={20} color="#60a5fa" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: '700' }}>
              Google Classroom Link Settings
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
            Admins can set the direct Google Classroom invite link or class URL and the class joining code for all staff members.
          </p>

          <div style={styles.formRow}>
            <div style={styles.inputWrapper}>
              <label style={styles.inputLabel}>Google Classroom URL</label>
              <input
                type="url"
                value={classroomUrlInput}
                onChange={(e) => setClassroomUrlInput(e.target.value)}
                placeholder="https://classroom.google.com/c/..."
                className="input-field"
                style={styles.textInput}
                required
              />
              <span style={styles.inputHint}>Paste your specific Google Classroom class or invite link.</span>
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.inputLabel}>Class Join Code (Optional)</label>
              <input
                type="text"
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value)}
                placeholder="e.g. 7xy2abc"
                className="input-field"
                style={styles.textInput}
              />
              <span style={styles.inputHint}>Staff can copy this code to join if prompted.</span>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.inputWrapper}>
              <label style={styles.inputLabel}>Page Title</label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="input-field"
                style={styles.textInput}
              />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.inputLabel}>Page Description</label>
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="input-field"
                style={styles.textInput}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
            <button type="submit" className="btn-primary" style={styles.saveBtn}>
              Save Classroom Settings
            </button>
            {saveSuccess && (
              <span style={{ color: '#34d399', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> Saved to Firebase!
              </span>
            )}
          </div>
        </form>
      )}

      {/* Main Google Classroom Hero Card */}
      <div className="glass-panel" style={styles.heroCard}>
        <div style={styles.heroBadgeRow}>
          <div style={styles.googleBadge}>
            <span style={{ color: '#4285F4', fontWeight: '800' }}>G</span>
            <span style={{ color: '#EA4335', fontWeight: '800' }}>o</span>
            <span style={{ color: '#FBBC05', fontWeight: '800' }}>o</span>
            <span style={{ color: '#4285F4', fontWeight: '800' }}>g</span>
            <span style={{ color: '#34A853', fontWeight: '800' }}>l</span>
            <span style={{ color: '#EA4335', fontWeight: '800' }}>e</span>
            <span style={{ color: '#fff', marginLeft: '6px', fontWeight: '700' }}>Classroom</span>
          </div>
          <span style={styles.officialBadge}>Official Training Portal</span>
        </div>

        <div style={styles.heroBody}>
          <div style={styles.heroTextCol}>
            <h3 style={styles.heroTitle}>Staff Curriculum & Homework Hub</h3>
            <p style={styles.heroSubtitle}>
              All official homework assignments, flight operation study guides, in-flight protocol exams, and training tasks are hosted on our dedicated Google Classroom. Click below to launch directly.
            </p>

            {classCode && (
              <div style={styles.codeBox}>
                <span style={styles.codeLabel}>Class Code:</span>
                <span style={styles.codeValue}>{classCode}</span>
                <button 
                  type="button" 
                  onClick={handleCopyCode} 
                  style={styles.copyBtn} 
                  title="Copy class code"
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} color="#9ca3af" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            )}
          </div>

          <div style={styles.heroActionCol}>
            <button 
              type="button" 
              onClick={handleOpenClassroom} 
              className="btn-primary"
              style={styles.launchBtn}
            >
              <BookOpen size={20} />
              <span>Launch Google Classroom</span>
              <ExternalLink size={18} />
            </button>
            <span style={styles.launchNote}>Opens in a secure new tab</span>
          </div>
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div style={styles.cardsGrid}>
        <div className="glass-panel" style={styles.guideCard}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.iconCircle, background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <HelpCircle size={20} color="#60a5fa" />
            </div>
            <h4 style={styles.cardTitle}>How to Join</h4>
          </div>
          <ol style={styles.stepList}>
            <li>Click <strong>Launch Google Classroom</strong> above.</li>
            <li>Sign in with your Google Account if prompted.</li>
            <li>If asked to join a class, click <strong>+</strong> in the top right.</li>
            {classCode ? (
              <li>Enter class code <strong style={{ color: '#60a5fa' }}>{classCode}</strong> and confirm.</li>
            ) : (
              <li>Accept the class invitation on your Google account dashboard.</li>
            )}
          </ol>
        </div>

        <div className="glass-panel" style={styles.guideCard}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.iconCircle, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <FileCheck size={20} color="#34d399" />
            </div>
            <h4 style={styles.cardTitle}>Assignments Checklist</h4>
          </div>
          <ul style={styles.checkList}>
            <li>
              <CheckCircle size={15} color="#34d399" />
              <span>Pre-Flight Emergency & Safety Protocols</span>
            </li>
            <li>
              <CheckCircle size={15} color="#34d399" />
              <span>In-Flight Cabin Crew Procedures</span>
            </li>
            <li>
              <CheckCircle size={15} color="#34d399" />
              <span>Radio Telephony & ATC Communications</span>
            </li>
            <li>
              <CheckCircle size={15} color="#34d399" />
              <span>Customer Service & Passenger Satisfaction</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel" style={styles.guideCard}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.iconCircle, background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Clock size={20} color="#fbbf24" />
            </div>
            <h4 style={styles.cardTitle}>Deadlines & Grading</h4>
          </div>
          <p style={styles.cardText}>
            Ensure all homework assignments are submitted before the weekly cycle cutoff. Completed and passed coursework credits training points to your staff profile and fulfills promotion requirements.
          </p>
          <div style={styles.tipBox}>
            <ShieldCheck size={16} color="#fbbf24" />
            <span>Grades are reviewed directly by airline instructors and management.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  headerCard: {
    padding: '24px 28px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    minWidth: '280px'
  },
  headerIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    letterSpacing: '-0.3px'
  },
  headerDesc: {
    margin: '4px 0 0 0',
    fontSize: '0.9rem',
    color: '#9ca3af',
    lineHeight: '1.4'
  },
  adminSettingsBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  adminConfigBox: {
    padding: '22px 26px',
    borderRadius: '16px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    background: 'rgba(15, 23, 42, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  inputWrapper: {
    flex: 1,
    minWidth: 'min(280px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#cbd5e1'
  },
  textInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  inputHint: {
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  saveBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700'
  },
  heroCard: {
    padding: '32px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)'
  },
  heroBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  googleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    fontSize: '0.9rem'
  },
  officialBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    textTransform: 'uppercase'
  },
  heroBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '32px',
    flexWrap: 'wrap'
  },
  heroTextCol: {
    flex: 1,
    minWidth: 'min(300px, 100%)'
  },
  heroTitle: {
    margin: '0 0 10px 0',
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.3px'
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#cbd5e1',
    lineHeight: '1.6'
  },
  codeBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '16px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  codeLabel: {
    fontSize: '0.82rem',
    color: '#9ca3af',
    fontWeight: '600'
  },
  codeValue: {
    fontSize: '1.05rem',
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#34d399',
    letterSpacing: '0.05em'
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#cbd5e1',
    fontSize: '0.78rem',
    cursor: 'pointer'
  },
  heroActionCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  launchBtn: {
    padding: '16px 28px',
    borderRadius: '12px',
    fontSize: '1.05rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
    cursor: 'pointer'
  },
  launchNote: {
    fontSize: '0.78rem',
    color: '#9ca3af'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px'
  },
  guideCard: {
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--color-text-main)'
  },
  stepList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.88rem',
    color: '#cbd5e1',
    lineHeight: '1.5'
  },
  checkList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '0.88rem',
    color: '#cbd5e1'
  },
  cardText: {
    margin: 0,
    fontSize: '0.88rem',
    color: '#cbd5e1',
    lineHeight: '1.5'
  },
  tipBox: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    color: '#fef3c7',
    fontSize: '0.8rem'
  }
};
