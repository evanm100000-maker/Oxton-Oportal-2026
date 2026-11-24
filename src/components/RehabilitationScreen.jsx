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
  Sparkles,
  Clock,
  Lock,
  ArrowRight,
  ArrowLeft,
  PenTool,
  LogOut
} from 'lucide-react';

const PAGE_LOCK_SECONDS = 15;

export const REHAB_PAGES = [
  {
    id: 'respect',
    title: 'Respect',
    subtitle: 'Courtesy, Composure & Teamwork',
    icon: HeartHandshake,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.35)',
    body: 'I will show complete respect to passengers, staff, and management at Oxton Airways. Respect means speaking politely, controlling my tone of voice, and listening to instructions without arguing. I understand that disrespect degrades the flight environment and damages our team spirit, so I am committed to handling every interaction with courtesy and professionalism.',
    keyTakeaway: 'Treat passengers, peers, and supervisors with courtesy and listen without arguing.'
  },
  {
    id: 'accountability',
    title: 'Accountability',
    subtitle: 'Owning Mistakes & Growing',
    icon: CheckCircle2,
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.14)',
    border: 'rgba(167, 139, 250, 0.35)',
    body: 'I am fully accountable for my own actions, choices, and mistakes while on duty at Oxton Airways. Accountability means taking ownership when I mess up instead of making excuses, pointing fingers, or lying to supervisors. I understand that admitting my mistakes is necessary for growth, and I commit to accepting constructive feedback and correcting my behavior immediately.',
    keyTakeaway: 'Take honest ownership of mistakes and act on constructive feedback right away.'
  },
  {
    id: 'determination',
    title: 'Determination',
    subtitle: 'Effort & Resilience Under Pressure',
    icon: Target,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)',
    body: 'I will remain determined and put full effort into every shift, flight operation, and assigned task. Determination means staying focused at my post, upholding high service standards even during busy flights, and not giving up when situations become challenging. I commit to showing up with energy and dedicating my best effort to help Oxton Airways succeed.',
    keyTakeaway: 'Stay focused, bring full effort to every shift, and uphold standards during busy flights.'
  },
  {
    id: 'responsibility',
    title: 'Responsibility',
    subtitle: 'Reliability & Role Standards',
    icon: ClipboardCheck,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    body: 'I am responsible for fulfilling all expectations of my staff role, including wearing the correct uniform, using proper grammar, and staying at my assigned station. Being responsible means being reliable so that my team and supervisors can count on me during flights. I commit to staying on top of my duties and carrying out my assignment without needing constant reminders.',
    keyTakeaway: 'Follow uniform, grammar, and station expectations reliably without needing reminders.'
  },
  {
    id: 'professionalism',
    title: 'Professionalism',
    subtitle: 'Mature Conduct Everywhere',
    icon: Briefcase,
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.14)',
    border: 'rgba(96, 165, 250, 0.35)',
    body: 'I will maintain strict professionalism at all times across all Oxton Airways airports, games, and communications. Professionalism means keeping my composure under pressure, avoiding drama, and representing the airline in a way that makes our community proud. I commit to keeping all public and private interactions mature, composed, and aligned with company guidelines.',
    keyTakeaway: 'Keep composure under pressure, avoid drama, and represent Oxton Airways maturely.'
  },
  {
    id: 'integrity',
    title: 'Integrity',
    subtitle: 'Honesty & Ethical Standards',
    icon: Scale,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.14)',
    border: 'rgba(236, 72, 153, 0.35)',
    body: 'I will act with total integrity and honesty in every aspect of my work at Oxton Airways, even when no supervisors are watching. Integrity means following all airline policies, being truthful in server reports, and never exploiting my staff power or privileges for personal gain. I commit to doing the right thing at all times and holding myself to the highest moral and ethical standard.',
    keyTakeaway: 'Do the right thing even when unsupervised and never misuse staff permissions.'
  },
  {
    id: 'reflection',
    title: 'Reflection & Agreement',
    subtitle: 'Commitment Moving Forward',
    icon: Sparkles,
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
    body: 'I understand that my actions were wrong and will strive to be my best self in everything that I do within Oxton Airways.',
    keyTakeaway: 'Reflect honestly, learn from the past, and commit to being your best going forward.',
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
      setErrorMsg('Please confirm the agreement checkbox before signing.');
      return;
    }
    if (!signature.trim() || signature.trim().length < 2) {
      setErrorMsg('Please enter your full name as your digital signature.');
      return;
    }
    completeRehabilitation(signature.trim());
  };

  const staffFullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.robloxUsername || 'Staff Member';
  const timerPercent = Math.round(((PAGE_LOCK_SECONDS - secondsLeft) / PAGE_LOCK_SECONDS) * 100);
  const overallPercent = Math.round(((currentPageIndex + (isPageUnlocked ? 1 : 0)) / REHAB_PAGES.length) * 100);

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.headerBadgeIcon}>
              <ShieldCheck size={24} color="#34d399" />
            </div>
            <div>
              <span style={styles.kicker}>Post-Suspension Rehabilitation Meeting</span>
              <h1 style={styles.mainTitle}>Welcome Back, {currentUser?.firstName || 'Staff'}</h1>
            </div>
          </div>
          <button type="button" onClick={logout} className="btn-secondary" style={styles.logoutBtn}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        <p style={styles.introText}>
          Your suspension has ended. Before returning to active duty at <strong>Oxton Airways</strong>, please read each core standard below carefully. Each page requires a <strong>15-second review</strong> before you can continue.
        </p>

        {/* Stepper / Progress Pills */}
        <div style={styles.stepperWrapper}>
          <div style={styles.stepperHeader}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>
              Page {currentPageIndex + 1} of {REHAB_PAGES.length}: <strong style={{ color: page.color }}>{page.title}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399' }}>
              {overallPercent}% Complete
            </span>
          </div>
          <div style={styles.stepsGrid}>
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
                    background: isCurrent ? p.bg : isDone ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255,255,255,0.04)',
                    borderColor: isCurrent ? p.color : isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.08)',
                    color: isCurrent ? p.color : isDone ? '#34d399' : '#64748b',
                    cursor: canJump ? 'pointer' : 'not-allowed',
                    opacity: !canJump && !isCurrent ? 0.6 : 1
                  }}
                >
                  <span>{idx + 1}. {p.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Page Content */}
        <div style={{ ...styles.pageBox, borderColor: page.border, background: 'rgba(15, 23, 42, 0.55)' }}>
          <div style={styles.pageTitleRow}>
            <div style={{ ...styles.pageIconCircle, background: page.bg, borderColor: page.border }}>
              <PageIcon size={24} color={page.color} />
            </div>
            <div>
              <h2 style={{ ...styles.pageTitle, color: page.color }}>{page.title}</h2>
              <div style={styles.pageSubtitle}>{page.subtitle}</div>
            </div>
          </div>

          <p style={styles.pageBody}>{page.body}</p>

          <div style={{ ...styles.takeawayBox, borderColor: page.border, background: page.bg }}>
            <strong style={{ color: page.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Core Expectation
            </strong>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginTop: '4px' }}>
              {page.keyTakeaway}
            </div>
          </div>

          {/* 15-Second Unskippable Timer Bar */}
          <div style={styles.timerSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPageUnlocked ? '#34d399' : '#fbbf24', fontWeight: '700' }}>
                {isPageUnlocked ? <CheckCircle2 size={15} /> : <Lock size={15} />}
                {isPageUnlocked
                  ? 'Review complete — you may proceed'
                  : `Reading lock active — please wait ${secondsLeft}s`}
              </span>
              <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                {isPageUnlocked ? '15s / 15s' : `${PAGE_LOCK_SECONDS - secondsLeft}s / ${PAGE_LOCK_SECONDS}s`}
              </span>
            </div>
            <div style={styles.timerTrack}>
              <div
                style={{
                  ...styles.timerFill,
                  width: `${timerPercent}%`,
                  background: isPageUnlocked ? '#10b981' : page.color
                }}
              />
            </div>
          </div>
        </div>

        {/* Final Agreement & Digital Signature on Last Page */}
        {isLastPage && (
          <form onSubmit={handleSubmitAgreement} style={styles.agreementBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', fontSize: '0.95rem' }}>
              <PenTool size={18} />
              <span>Rehabilitation Agreement & Signature</span>
            </div>

            <label style={{
              ...styles.checkboxLabel,
              opacity: isPageUnlocked ? 1 : 0.55,
              cursor: isPageUnlocked ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                disabled={!isPageUnlocked}
                checked={agreed}
                onChange={e => {
                  setAgreed(e.target.checked);
                  setErrorMsg('');
                }}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', flexShrink: 0 }}
              />
              <span>
                I, <strong>{staffFullName}</strong>, confirm that I have read all rehabilitation pages, learned from my actions, and am determined to be my best in the future at Oxton Airways.
              </span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: '600', color: '#cbd5e1' }}>
                Digital Signature (Type your full name) *
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
                placeholder={`Sign as ${staffFullName}`}
                className="input-field"
                style={{ fontStyle: signature ? 'italic' : 'normal', fontSize: '1rem' }}
              />
            </div>

            {errorMsg && (
              <div style={styles.errorBox}>{errorMsg}</div>
            )}

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
                    <ShieldCheck size={16} /> Sign Agreement & Continue
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Navigation Footer for Pages 1..6 */}
        {!isLastPage && (
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
                  <span>Next: {REHAB_PAGES[currentPageIndex + 1].title}</span>
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
    padding: '24px 16px',
    background: 'var(--color-bg-deep)',
  },
  card: {
    maxWidth: '760px',
    width: '100%',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '16px',
  },
  headerBadgeIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kicker: {
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#34d399',
    display: 'block',
  },
  mainTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    margin: 0,
  },
  logoutBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
  },
  introText: {
    fontSize: '0.92rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
    margin: 0,
  },
  stepperWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  stepperHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  stepsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  stepPill: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.76rem',
    fontWeight: '700',
    transition: 'all 0.2s ease',
  },
  pageBox: {
    borderRadius: '14px',
    border: '1px solid',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  pageTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  pageIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  pageBody: {
    fontSize: '1.02rem',
    color: '#f1f5f9',
    lineHeight: '1.68',
    margin: 0,
  },
  takeawayBox: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid',
  },
  timerSection: {
    marginTop: '4px',
  },
  timerTrack: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.35s ease',
  },
  agreementBox: {
    padding: '20px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '0.9rem',
    color: '#e2e8f0',
    lineHeight: '1.45',
  },
  errorBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  nextBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  submitBtn: {
    padding: '11px 22px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #10b981, #059669)',
  },
};
