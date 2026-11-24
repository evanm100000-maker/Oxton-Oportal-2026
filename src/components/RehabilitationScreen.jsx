import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Target,
  ClipboardCheck,
  Briefcase,
  Scale,
  AlertTriangle,
  Sparkles,
  Clock,
  Lock,
  ArrowRight,
  ArrowLeft,
  PenTool,
  LogOut
} from 'lucide-react';

const PAGE_LOCK_SECONDS = 10;

export const REHAB_PAGES = [
  {
    id: 'respect',
    stepLabel: 'Respect',
    title: 'Respect & Workplace Conduct',
    subtitle: 'Maintaining courtesy, patience, and composure with everyone',
    icon: HeartHandshake,
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.12)',
    accentBorder: 'rgba(56, 189, 248, 0.32)',
    body: 'Every smooth operation at Luma Airways starts with how we treat the people around us. Passengers, fellow crew members, and supervisors all deserve calm, polite, and patient communication—especially when situations get tense. Disagreeing respectfully and listening to direction without pushback keeps flights welcoming and preserves a healthy team culture.',
    standards: [
      'Speak calmly and professionally in every interaction, even under pressure.',
      'Listen to instructions from supervisors without arguing or escalating tension.',
      'Treat passengers and teammates with consistent courtesy at all times.'
    ]
  },
  {
    id: 'accountability',
    stepLabel: 'Accountability',
    title: 'Accountability & Ownership',
    subtitle: 'Owning decisions honestly and acting on feedback',
    icon: CheckCircle2,
    accent: '#a78bfa',
    accentSoft: 'rgba(167, 139, 250, 0.12)',
    accentBorder: 'rgba(167, 139, 250, 0.32)',
    body: 'Mistakes happen, but how you respond to them defines your character as a staff member. At Luma Airways, accountability means stepping up and owning what went wrong rather than shifting blame, making excuses, or withholding facts from leadership. Welcoming feedback and adjusting right away shows real maturity and keeps small errors from repeating.',
    standards: [
      'Acknowledge missteps openly instead of deflecting blame onto others.',
      'Provide truthful, complete context when asked by management.',
      'Apply constructive feedback immediately on your very next shift.'
    ]
  },
  {
    id: 'responsibility',
    stepLabel: 'Responsibility',
    title: 'Responsibility & Reliability',
    subtitle: 'Meeting daily operational expectations without reminders',
    icon: ClipboardCheck,
    accent: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.32)',
    body: 'Your team depends on you to carry out your assigned role consistently. Responsibility means showing up prepared—in the proper uniform, using clear and proper grammar, and staying attentive at your station throughout operations. When every staff member handles their duties reliably, supervisors can focus on running great flights instead of chasing reminders.',
    standards: [
      'Wear the approved staff uniform and maintain clean, proper grammar.',
      'Remain at your assigned post and stay engaged throughout each flight.',
      'Complete assigned duties proactively without needing repeated prompts.'
    ]
  },
  {
    id: 'determination',
    stepLabel: 'Determination',
    title: 'Determination & Work Ethic',
    subtitle: 'Bringing consistent focus and effort through busy operations',
    icon: Target,
    accent: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.12)',
    accentBorder: 'rgba(245, 158, 11, 0.32)',
    body: 'High-volume flights and unexpected delays test every crew. Determination is choosing to stay locked in, keep your service quality high, and push through challenging moments rather than checking out or giving minimum effort. Showing up with energy and commitment lifts the entire team and helps Luma Airways deliver a standout passenger experience.',
    standards: [
      'Give full effort across every briefing, shift, and flight assignment.',
      'Stay steady and solution-focused when operations become demanding.',
      'Support teammates actively so the crew succeeds together.'
    ]
  },
  {
    id: 'professionalism',
    stepLabel: 'Professionalism',
    title: 'Professionalism Across All Spaces',
    subtitle: 'Representing Luma Airways with maturity on and off duty',
    icon: Briefcase,
    accent: '#60a5fa',
    accentSoft: 'rgba(96, 165, 250, 0.12)',
    accentBorder: 'rgba(96, 165, 250, 0.32)',
    body: 'Whether you are in an airport server, on a flight, or chatting in staff channels, you represent Luma Airways. Professionalism means keeping personal drama out of the workplace, controlling how you react in public and private chats, and upholding company guidelines even when things feel frustrating.',
    standards: [
      'Keep all airport, in-game, and portal communications mature and composed.',
      'Avoid gossip, public arguments, and unnecessary workplace drama.',
      'Represent Luma Airways in a manner that reflects pride in our community.'
    ]
  },
  {
    id: 'integrity',
    stepLabel: 'Integrity',
    title: 'Integrity & Ethical Standards',
    subtitle: 'Doing what is right even when nobody is watching',
    icon: Scale,
    accent: '#ec4899',
    accentSoft: 'rgba(236, 72, 153, 0.12)',
    accentBorder: 'rgba(236, 72, 153, 0.32)',
    body: 'Trust is earned through consistent honesty. Integrity means following airline rules even when no supervisor is nearby, logging accurate information in reports and registers, and never using staff tools or permissions for personal benefit. Upholding ethical standards protects both our passengers and the credibility of the entire staff team.',
    standards: [
      'Follow every policy consistently, whether supervised or working independently.',
      'Submit truthful, accurate details in all logs and incident reports.',
      'Never misuse staff authority, tools, or privileges for personal gain.'
    ]
  },
  {
    id: 'consequences',
    stepLabel: 'Consequences',
    title: 'Rule Breaking Adds Up',
    subtitle: 'Understanding how repeated infractions affect your standing',
    icon: AlertTriangle,
    accent: '#ef4444',
    accentSoft: 'rgba(239, 68, 68, 0.12)',
    accentBorder: 'rgba(239, 68, 68, 0.35)',
    body: 'No rule violation exists in isolation. Under Luma Airways policy, each consequence—from C1/C2 warnings and C3 informal sanctions to C4 detentions and C5 suspensions—adds weighted points to your permanent staff record. Reaching 35 consequence points results in automatic dismissal from the staff team, and repeated infractions also impact supervisor trust and promotion eligibility. Taking accountability now prevents small habits from costing you your role.',
    standards: [
      'Every logged consequence stays on record and adds toward the 35-point termination limit.',
      'Repeated rule breaking escalates penalties from warnings to detentions and suspensions.',
      'Protect your future on the team by correcting patterns early and following guidelines.'
    ]
  },
  {
    id: 'reflection',
    stepLabel: 'Agreement',
    title: 'Reflection & Reinstatement Agreement',
    subtitle: 'Acknowledging lessons learned and committing to a fresh start',
    icon: Sparkles,
    accent: '#34d399',
    accentSoft: 'rgba(52, 211, 153, 0.12)',
    accentBorder: 'rgba(52, 211, 153, 0.35)',
    body: 'Returning from a suspension is an opportunity to reset and prove your reliability. Before stepping back into active service, take a moment to reflect honestly on the behavior that led here and commit to holding yourself to Luma Airways standards moving forward.',
    standards: [
      'I recognize why my previous actions fell short of Luma Airways expectations.',
      'I commit to applying Respect, Accountability, Responsibility, and Integrity on every shift.',
      'I am determined to contribute positively and be my best self going forward.'
    ],
    isFinal: true
  }
];

export default function RehabilitationScreen() {
  const { currentUser, completeRehabilitation, logout } = useApp();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [completedPages, setCompletedPages] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(PAGE_LOCK_SECONDS);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const page = REHAB_PAGES[currentPageIndex];
  const PageIcon = page.icon;
  const isPageUnlocked = completedPages.includes(currentPageIndex);
  const isLastPage = currentPageIndex === REHAB_PAGES.length - 1;

  useEffect(() => {
    if (completedPages.includes(currentPageIndex)) {
      setSecondsLeft(0);
      return;
    }

    let remaining = PAGE_LOCK_SECONDS;
    setSecondsLeft(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
        setCompletedPages(done => (done.includes(currentPageIndex) ? done : [...done, currentPageIndex]));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPageIndex, completedPages]);

  const handleNext = () => {
    if (!isPageUnlocked) return;
    if (currentPageIndex < REHAB_PAGES.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      setErrorMsg('');
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      setErrorMsg('');
    }
  };

  const handleSubmitAgreement = (e) => {
    e.preventDefault();
    if (!isPageUnlocked) return;
    if (!agreed) {
      setErrorMsg('Please check the confirmation box before signing.');
      return;
    }
    if (!signature.trim() || signature.trim().length < 2) {
      setErrorMsg('Please enter your full name as your digital signature.');
      return;
    }
    completeRehabilitation(signature.trim());
  };

  const staffFullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.robloxUsername || 'Staff Member';
  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timerPercent = Math.round(((PAGE_LOCK_SECONDS - secondsLeft) / PAGE_LOCK_SECONDS) * 100);
  const completedCount = completedPages.length;
  const overallPercent = Math.round((completedCount / REHAB_PAGES.length) * 100);

  return (
    <div style={styles.container}>
      <div className="glass-panel-glow" style={styles.shell}>
        {/* Top Progress Strip */}
        <div style={styles.topProgressStrip}>
          <div style={{ ...styles.topProgressFill, width: `${overallPercent}%` }} />
        </div>

        {/* Executive Header */}
        <div style={styles.header}>
          <div style={styles.brandRow}>
            <div style={styles.logoWrap}>
              <img src="./logo.png" alt="Luma Airways" style={styles.logoImg} />
            </div>
            <div>
              <div style={styles.badgeRow}>
                <span style={styles.docBadge}>Luma Airways · Staff Reinstatement</span>
                <span style={styles.stepCountBadge}>
                  Module {currentPageIndex + 1} / {REHAB_PAGES.length}
                </span>
              </div>
              <h1 style={styles.mainTitle}>Rehabilitation & Conduct Briefing</h1>
            </div>
          </div>

          <button type="button" onClick={logout} className="btn-secondary" style={styles.logoutBtn}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Staff Context Bar */}
        <div style={styles.contextBar}>
          <div style={styles.contextItem}>
            <span style={styles.contextLabel}>Staff Member</span>
            <strong style={styles.contextValue}>{staffFullName}</strong>
          </div>
          <div style={styles.contextDivider} />
          <div style={styles.contextItem}>
            <span style={styles.contextLabel}>Briefing Date</span>
            <strong style={styles.contextValue}>{todayFormatted}</strong>
          </div>
          <div style={styles.contextDivider} />
          <div style={styles.contextItem}>
            <span style={styles.contextLabel}>Progress</span>
            <strong style={{ ...styles.contextValue, color: '#34d399' }}>{completedCount} of {REHAB_PAGES.length} Completed</strong>
          </div>
        </div>

        {/* Stepper Navigation Pills */}
        <div style={styles.stepperGrid}>
          {REHAB_PAGES.map((p, idx) => {
            const isDone = completedPages.includes(idx);
            const isCurrent = idx === currentPageIndex;
            const canJump = isDone || idx < currentPageIndex;
            return (
              <button
                key={p.id}
                type="button"
                disabled={!canJump}
                onClick={() => canJump && setCurrentPageIndex(idx)}
                title={p.title}
                style={{
                  ...styles.stepPill,
                  background: isCurrent
                    ? p.accentSoft
                    : isDone
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(148, 163, 184, 0.06)',
                  borderColor: isCurrent
                    ? p.accent
                    : isDone
                      ? 'rgba(16, 185, 129, 0.35)'
                      : 'var(--color-border)',
                  color: isCurrent ? p.accent : isDone ? '#34d399' : 'var(--color-text-muted)',
                  cursor: canJump ? 'pointer' : 'not-allowed',
                  opacity: !canJump && !isCurrent ? 0.55 : 1,
                }}
              >
                <span style={{ opacity: 0.75 }}>{String(idx + 1).padStart(2, '0')}</span>
                <span>{p.stepLabel}</span>
                {isDone && !isCurrent && <CheckCircle2 size={12} />}
              </button>
            );
          })}
        </div>

        {/* Active Module Card */}
        <div style={{ ...styles.moduleCard, borderColor: page.accentBorder }}>
          <div style={styles.moduleHeader}>
            <div style={{ ...styles.moduleIconBox, background: page.accentSoft, borderColor: page.accentBorder }}>
              <PageIcon size={24} color={page.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: page.accent }}>
                Section {String(currentPageIndex + 1).padStart(2, '0')} · {page.stepLabel}
              </div>
              <h2 style={styles.moduleTitle}>{page.title}</h2>
              <p style={styles.moduleSubtitle}>{page.subtitle}</p>
            </div>
          </div>

          <p style={styles.moduleBody}>{page.body}</p>

          {/* Key Commitments List */}
          <div style={{ ...styles.standardsBox, borderColor: page.accentBorder, background: page.accentSoft }}>
            <div style={{ fontSize: '0.76rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: page.accent, marginBottom: '8px' }}>
              Key Standards & Expectations
            </div>
            <ul style={styles.standardsList}>
              {page.standards.map((item, i) => (
                <li key={i} style={styles.standardItem}>
                  <span style={{ ...styles.bulletDot, background: page.accent }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 10-Second Unskippable Timer */}
          <div style={styles.timerBox}>
            <div style={styles.timerMeta}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontWeight: '700', color: isPageUnlocked ? '#34d399' : '#fbbf24' }}>
                {isPageUnlocked ? <CheckCircle2 size={15} /> : <Lock size={15} />}
                {isPageUnlocked
                  ? 'Section reviewed — ready to continue'
                  : `Mandatory review timer — ${secondsLeft}s remaining`}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>
                {isPageUnlocked ? `${PAGE_LOCK_SECONDS}s / ${PAGE_LOCK_SECONDS}s` : `${PAGE_LOCK_SECONDS - secondsLeft}s / ${PAGE_LOCK_SECONDS}s`}
              </span>
            </div>
            <div style={styles.timerTrack}>
              <div
                style={{
                  ...styles.timerFill,
                  width: `${timerPercent}%`,
                  background: isPageUnlocked ? '#10b981' : page.accent
                }}
              />
            </div>
          </div>
        </div>

        {/* Final Reinstatement Agreement & Signature */}
        {isLastPage ? (
          <form onSubmit={handleSubmitAgreement} style={styles.agreementCard}>
            <div style={styles.agreementHeader}>
              <PenTool size={18} color="#34d399" />
              <div>
                <h3 style={styles.agreementTitle}>Reinstatement Acknowledgement & Digital Signature</h3>
                <p style={styles.agreementDesc}>Complete this sign-off after the review timer finishes to return to active duty.</p>
              </div>
            </div>

            <label
              style={{
                ...styles.checkboxLabel,
                opacity: isPageUnlocked ? 1 : 0.55,
                cursor: isPageUnlocked ? 'pointer' : 'not-allowed'
              }}
            >
              <input
                type="checkbox"
                disabled={!isPageUnlocked}
                checked={agreed}
                onChange={e => {
                  setAgreed(e.target.checked);
                  setErrorMsg('');
                }}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', flexShrink: 0, marginTop: '2px' }}
              />
              <span>
                I, <strong>{staffFullName}</strong>, confirm that I have read every section of this briefing, learned from my past actions, understand that repeated infractions accumulate toward termination, and am determined to perform at my best at Luma Airways.
              </span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
                Full Name Signature *
              </label>
              <input
                type="text"
                required
                disabled={!isPageUnlocked}
                value={signature}
                onChange={e => {
                  setSignature(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={`Type "${staffFullName}" to sign`}
                className="input-field"
                style={{ fontStyle: signature ? 'italic' : 'normal', fontSize: '1rem' }}
              />
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            <div style={styles.navFooter}>
              <button type="button" onClick={handlePrev} className="btn-secondary" style={styles.navBtn}>
                <ArrowLeft size={16} /> Previous
              </button>
              <button
                type="submit"
                disabled={!isPageUnlocked || !agreed || !signature.trim()}
                className="btn-primary"
                style={{
                  ...styles.submitBtn,
                  opacity: (!isPageUnlocked || !agreed || !signature.trim()) ? 0.5 : 1,
                  cursor: (!isPageUnlocked || !agreed || !signature.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {!isPageUnlocked ? (
                  <>
                    <Clock size={16} /> Wait {secondsLeft}s to Sign
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Sign & Complete Reinstatement
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.navFooter}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPageIndex === 0}
              className="btn-secondary"
              style={{
                ...styles.navBtn,
                opacity: currentPageIndex === 0 ? 0.45 : 1,
                cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isPageUnlocked}
              className="btn-primary"
              style={{
                ...styles.nextBtn,
                opacity: isPageUnlocked ? 1 : 0.55,
                cursor: isPageUnlocked ? 'pointer' : 'not-allowed'
              }}
            >
              {isPageUnlocked ? (
                <>
                  <span>Continue to {REHAB_PAGES[currentPageIndex + 1].stepLabel}</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <Clock size={16} />
                  <span>Wait {secondsLeft}s to Continue</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 16px',
    background: 'var(--color-bg-deep)',
  },
  shell: {
    maxWidth: '820px',
    width: '100%',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  topProgressStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'rgba(148, 163, 184, 0.14)',
  },
  topProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8, #8b5cf6, #10b981)',
    transition: 'width 0.4s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    flexShrink: 0,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  docBadge: {
    fontSize: '0.72rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#34d399',
  },
  stepCountBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '999px',
    background: 'rgba(148, 163, 184, 0.14)',
    color: 'var(--color-text-muted)',
  },
  mainTitle: {
    fontSize: '1.45rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  logoutBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
  },
  contextBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(148, 163, 184, 0.06)',
    border: '1px solid var(--color-border)',
  },
  contextItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: '1 1 140px',
  },
  contextLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-text-muted)',
  },
  contextValue: {
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
  },
  contextDivider: {
    width: '1px',
    height: '28px',
    background: 'var(--color-border)',
  },
  stepperGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
    gap: '8px',
  },
  stepPill: {
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  moduleCard: {
    borderRadius: '14px',
    border: '1px solid',
    padding: '24px',
    background: 'rgba(148, 163, 184, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  moduleIconBox: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleTitle: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    margin: '2px 0',
  },
  moduleSubtitle: {
    fontSize: '0.86rem',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  moduleBody: {
    fontSize: '0.98rem',
    color: 'var(--color-text-main)',
    lineHeight: '1.7',
    margin: 0,
  },
  standardsBox: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid',
  },
  standardsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  standardItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '0.89rem',
    color: 'var(--color-text-main)',
    lineHeight: '1.45',
  },
  bulletDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    marginTop: '7px',
    flexShrink: 0,
  },
  timerBox: {
    paddingTop: '4px',
  },
  timerMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    marginBottom: '8px',
    gap: '8px',
    flexWrap: 'wrap',
  },
  timerTrack: {
    width: '100%',
    height: '7px',
    borderRadius: '999px',
    background: 'rgba(148, 163, 184, 0.16)',
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.35s ease',
  },
  agreementCard: {
    padding: '22px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.07)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  agreementHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  agreementTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '800',
    color: '#34d399',
  },
  agreementDesc: {
    margin: '2px 0 0 0',
    fontSize: '0.82rem',
    color: 'var(--color-text-muted)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
    lineHeight: '1.5',
  },
  errorBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#ef4444',
    fontSize: '0.84rem',
    fontWeight: '600',
  },
  navFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  navBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  nextBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  submitBtn: {
    padding: '11px 22px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #10b981, #059669)',
  },
};
