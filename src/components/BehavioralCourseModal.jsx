import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Award,
  AlertTriangle,
  Clock,
  Lock
} from 'lucide-react';
import { formatUpcomingSanctionTime } from './ConsequenceLoggedModal';

const COURSE_MODULES = [
  {
    id: 'conduct-tos',
    title: 'Module 1: Core Conduct, Language & Zero-Tolerance Rules',
    subtitle: 'Rules 1.0.1 – 1.0.8 & 1.7.1 · Communication, commands, and TOS',
    overview:
      'Every member of the Luma Airways staff team is expected to uphold clear communication, respect, and strict compliance with Roblox and Discord Terms of Service at all times.',
    rules: [
      { code: '1.0.1', text: 'Spelling, punctuation, and grammar are required at all times during flights, events, and communications in any servers related to or involving Luma Airways | Roblox.' },
      { code: '1.0.2', text: 'Staff members are to use respectful, positive language at all times when interacting with passengers, co-workers, and senior staff.' },
      { code: '1.0.3', text: 'Commands must not be run where visible to passengers. All commands must be executed via the Command bar, /e [command], or by whispering the command to another staff member.' },
      { code: '1.0.4', text: 'Advertising of any kind, or attempting to promote your own groups or services, is forbidden in any form across Luma Roblox games, groups, servers, or messaging channels.' },
      { code: '1.0.5', text: 'You must not do anything that jeopardises our Roblox group or Discord server.' },
      { code: '1.0.6', text: 'Failure to follow Discord or Roblox TOS at any point will result in your immediate termination from the staff team.' },
      { code: '1.0.7', text: 'Any form of threat or threatening remarks is not permitted under any circumstances.' },
      { code: '1.0.8', text: 'Homophobia, racism, sexism, religious discrimination, and maternal discrimination are NOT tolerated and WILL result in immediate termination from the staff team.' },
      { code: '1.7.1', text: 'Staff are required to use common sense and general human decency at all times.' },
    ]
  },
  {
    id: 'infractions-leadership',
    title: 'Module 2: Infractions, Leadership & Professionalism',
    subtitle: 'Rules 1.1.1 – 1.2.3 & 1.5.1 · Disputes, hierarchy, and duty standards',
    overview:
      'Respecting the chain of command, handling infraction disputes properly, and maintaining professional focus during trainings and flights are mandatory for every staff member.',
    rules: [
      { code: '1.1.1', text: 'To dispute a staff infraction, you must open a ticket. Not following this rule will result in further action.' },
      { code: '1.1.2', text: 'Staff members are not permitted to discuss infractions with other staff members.' },
      { code: '1.1.3', text: 'Hinting for a promotion of any kind will result in a strike, no matter how small.' },
      { code: '1.2.1', text: 'When attending flights, you must follow the instructions of your department directors, flight host, and management staff.' },
      { code: '1.2.2', text: 'Failure to follow a reasonable request from a member of the management team could result in immediate suspension.' },
      { code: '1.2.3', text: 'When attending training or flights, professionalism must be maintained at all times. Examples of breaking this rule include driving recklessly, messing around with commands, and breaking or abusing systems.' },
      { code: '1.5.1', text: 'If at any point you need to go AFK, your department manager must be informed with adequate notice.' },
    ]
  },
  {
    id: 'flights-commands',
    title: 'Module 3: Flight Quotas, Logging & Command Rules',
    subtitle: 'Rules 1.3.1 – 1.4.4 & 1.11.1 – 1.11.3 · Attendance, logs, and admin commands',
    overview:
      'Accurate flight logging, reliable shift attendance, and responsible command usage protect both passenger experience and operational fairness across Luma Airways.',
    rules: [
      { code: '1.3.1', text: 'Staff are required to attend at least two flights per week (unless on an approved LOA).' },
      { code: '1.3.2', text: 'To log a flight, go to Flight Logs and follow the instructions. All logs may only be submitted if you have attended at least 80% of the flight.' },
      { code: '1.3.3', text: 'Attempting to forge or in any way abuse our flight logging system will result in your immediate termination.' },
      { code: '1.3.4', text: 'If you are unable to attend a flight you reacted to, you MUST inform your team leader with at least 30 minutes notice. Failure to do so will result in a strike.' },
      { code: '1.4.1', text: 'Staff are not permitted to run any commands that negatively impact passenger experience or welfare.' },
      { code: '1.4.2', text: 'Commands that cause a user to perform unrealistic actions are forbidden (unless stated otherwise), including speed, jheight, flying, r15, etc.' },
      { code: '1.4.3', text: 'When using commands, you must type your own username—NOT "me".' },
      { code: '1.4.4', text: 'Unless a command is URGENT, staff members are REQUIRED to use 6+ letters when typing usernames (preferably the full username).' },
      { code: '1.11.1', text: 'Logging a flight before 50 minutes will result in the flight log being deleted.' },
      { code: '1.11.2', text: 'Logging a flight when you have not attended AT LEAST 80% of that flight will result in it being deleted.' },
      { code: '1.11.3', text: 'Multiple cases of improper flight logging (1.11.1 / 1.11.2) will result in a strike.' },
    ]
  },
  {
    id: 'security-trainees',
    title: 'Module 4: Confidentiality, Trainees & Staff Standing',
    subtitle: 'Rules 1.6.1, 1.8.1 – 1.10.1 & 1.12.1 – 1.13.1 · Security, appeals, and exclusivity',
    overview:
      'Luma Airways documents, training materials, and internal operations are strictly confidential. Understand trainee expectations, termination/reapplication policies, and exclusivity rules.',
    rules: [
      { code: '1.6.1', text: 'Leaking, sharing, copying, or theft of any Luma manuals, documents, exams, or assets will result in termination and potentially further action.' },
      { code: '1.8.1', text: 'Luma management reserves the right to terminate any staff member for any reason.' },
      { code: '1.8.2', text: 'Terminations can be appealed directly via our support/helpdesk or by direct messaging a higher senior staff member.' },
      { code: '1.9.1', text: 'Trainee staff are limited to 1 role and 2 user pings per day for requests (use common sense during normal conversations).' },
      { code: '1.9.2', text: 'Trainee staff are hired temporarily; Luma Airways reserves the right to terminate any trainee at any time for any reason.' },
      { code: '1.9.3', text: 'If trainee staff are not "fit for staff" (adequate device, adequate speed & competency, adequate grammar & spelling, etc.), Luma Airways reserves the right to terminate for these reasons.' },
      { code: '1.10.1', text: 'If staff are terminated or resign, you must wait 7 days before reapplying if you wish to do so.' },
      { code: '1.12.1', text: 'Staff are not permitted to disclose any training or staff information to non-staff members, including in-game, DMs, or main server general chats.' },
      { code: '1.12.2', text: 'Staff members are not permitted to share any staff documents, staff-specific information (e.g., emergency flights), or any staff team-related media images with non-staff members.' },
      { code: '1.13.1', text: 'Staff members are not permitted to work for or own another Roblox recreation of Luma. Staff members in violation of this rule will be given 72 hours notice.' },
    ]
  }
];

const COURSE_QUESTIONS = [
  {
    id: 'q1',
    question: 'Per Rule 1.0.3, how must staff run admin commands so passengers cannot see them?',
    options: [
      'Type them openly in public chat so passengers see staff working.',
      'Use the Command bar, /e [command], or whisper the command to another staff member.',
      'Use "me" in public chat as long as it is quick.'
    ],
    correctIndex: 1
  },
  {
    id: 'q2',
    question: 'Per Rules 1.1.1 and 1.1.2, what must you do if you want to dispute a staff infraction?',
    options: [
      'Discuss it with other staff members in chat to get their opinions first.',
      'Open a support ticket and do not discuss infractions with other staff members.',
      'Hint to a manager during a flight for it to be removed.'
    ],
    correctIndex: 1
  },
  {
    id: 'q3',
    question: 'Per Rules 1.3.1, 1.3.2, and 1.11.1, what are the flight attendance & logging requirements?',
    options: [
      'At least 2 flights per week (unless on LOA), at least 80% flight attendance, and never log before 50 minutes.',
      '1 flight per month and logging after 20 minutes.',
      'You can log any flight you reacted to even if you did not attend.'
    ],
    correctIndex: 0
  },
  {
    id: 'q4',
    question: 'Per Rules 1.4.3 and 1.4.4, how must usernames be typed in non-urgent commands?',
    options: [
      'Use "me" for yourself and 2–3 letters for everyone else.',
      'Always type your own username (never "me") and use 6+ letters (preferably the full username).',
      'Only full usernames are allowed even during urgent emergencies.'
    ],
    correctIndex: 1
  },
  {
    id: 'q5',
    question: 'Per Rules 1.3.4 and 1.5.1, what notice is required if you cannot attend a reacted flight or need to go AFK?',
    options: [
      'No notice is required as long as you leave quietly.',
      'Inform your team leader at least 30 minutes before a flight you cannot attend, and give your department manager adequate notice before going AFK.',
      'Only inform passengers in general chat.'
    ],
    correctIndex: 1
  },
  {
    id: 'q6',
    question: 'Per Rules 1.6.1, 1.12.1, and 1.13.1, which of the following is strictly prohibited?',
    options: [
      'Sharing Luma manuals, exams, or staff-only media with non-staff, or working for/owning another Roblox recreation of Luma.',
      'Opening a support ticket to appeal a termination.',
      'Asking a supervisor for help with a passenger issue.'
    ],
    correctIndex: 0
  }
];

export default function BehavioralCourseModal({ isOpen, onClose, sanction, onComplete }) {
  const { infractions = [] } = useApp();
  const [stepIndex, setStepIndex] = useState(0); // 0..3 modules, 4 = assessment
  const [answers, setAnswers] = useState({});
  const [pledged, setPledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !sanction) return null;

  const liveSanction = (infractions || []).find(
    inf => inf && ((sanction.id && inf.id === sanction.id) || (sanction._firebaseKey && inf._firebaseKey === sanction._firebaseKey))
  ) || sanction;

  if (!liveSanction.courseUnlocked) {
    return (
      <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="glass-panel" style={{ ...styles.modal, maxWidth: '520px', textAlign: 'center', alignItems: 'center' }}>
          <button type="button" onClick={onClose} style={{ ...styles.closeBtn, position: 'absolute', top: '18px', right: '18px' }} title="Close">
            <X size={20} />
          </button>
          <div style={{
            width: '62px',
            height: '62px',
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '8px'
          }}>
            <Lock size={30} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#fbbf24' }}>
            C6 Behavioral Course Locked
          </div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
            You must be in the meeting before you can begin.
          </h3>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.55' }}>
            Please attend your scheduled C6 Behavioral Course meeting first. Once you are in the meeting, an administrator will grant you access to start the course.
          </p>
          <div style={{ ...styles.metaBar, width: '100%', textAlign: 'left' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e9d5ff', fontSize: '0.82rem' }}>
              <Clock size={14} color="#c084fc" />
              <strong>Scheduled:</strong> {liveSanction.detentionDate || 'Assigned Date'} &bull; {formatUpcomingSanctionTime(liveSanction.detentionTime, liveSanction.type)}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Location: {liveSanction.detentionLocation || 'Behavioral Course'}
            </span>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '10px 24px', borderRadius: '10px', marginTop: '4px' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const totalSteps = COURSE_MODULES.length + 1;
  const isAssessment = stepIndex === COURSE_MODULES.length;
  const currentModule = !isAssessment ? COURSE_MODULES[stepIndex] : null;
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const allQuestionsAnswered = COURSE_QUESTIONS.every(q => answers[q.id] !== undefined);
  const allQuestionsCorrect = COURSE_QUESTIONS.every(q => answers[q.id] === q.correctIndex);

  const handleFinishCourse = (e) => {
    e.preventDefault();
    if (!allQuestionsAnswered) {
      setErrorMsg('Please answer all 6 assessment questions before completing the course.');
      return;
    }
    if (!allQuestionsCorrect) {
      setErrorMsg('One or more answers are incorrect. Please review the highlighted questions and select the right responses.');
      return;
    }
    if (!pledged) {
      setErrorMsg('Please check the Luma Airways Staff Rules pledge to finish the course.');
      return;
    }
    onComplete(liveSanction.id || liveSanction._firebaseKey);
    setStepIndex(0);
    setAnswers({});
    setPledged(false);
    setErrorMsg('');
  };

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel" style={styles.modal}>
        {/* Progress Strip */}
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
        </div>

        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.iconBox}>
              <BookOpen size={22} color="#c084fc" />
            </div>
            <div>
              <div style={styles.kicker}>C6 Behavioral Course · Step {stepIndex + 1} of {totalSteps}</div>
              <h3 style={styles.title}>Luma Airways Staff Rules & Behavioral Course</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Schedule Metadata */}
        <div style={styles.metaBar}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e9d5ff', fontSize: '0.82rem' }}>
            <Clock size={14} color="#c084fc" />
            <strong>Scheduled:</strong> {liveSanction.detentionDate || 'Assigned Date'} &bull; {formatUpcomingSanctionTime(liveSanction.detentionTime, liveSanction.type)}
          </span>
          {liveSanction.mainMessage && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Reason: {liveSanction.mainMessage}
            </span>
          )}
        </div>

        {/* Module Stepper */}
        <div style={styles.stepperRow}>
          {COURSE_MODULES.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setStepIndex(idx);
                setErrorMsg('');
              }}
              style={{
                ...styles.stepChip,
                background: stepIndex === idx ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.04)',
                borderColor: stepIndex === idx ? '#a855f7' : 'rgba(255,255,255,0.1)',
                color: stepIndex === idx ? '#e9d5ff' : '#94a3b8'
              }}
            >
              Module {idx + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setStepIndex(COURSE_MODULES.length);
              setErrorMsg('');
            }}
            style={{
              ...styles.stepChip,
              background: isAssessment ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.04)',
              borderColor: isAssessment ? '#a855f7' : 'rgba(255,255,255,0.1)',
              color: isAssessment ? '#e9d5ff' : '#94a3b8'
            }}
          >
            Assessment
          </button>
        </div>

        {/* Content Area */}
        {!isAssessment && currentModule ? (
          <div style={styles.moduleBox}>
            <div>
              <h4 style={styles.moduleTitle}>{currentModule.title}</h4>
              <p style={styles.moduleSub}>{currentModule.subtitle}</p>
            </div>
            <p style={styles.moduleBody}>{currentModule.overview}</p>
            <div style={styles.rulesBox}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc', marginBottom: '10px' }}>
                Official Luma Airways Staff Rules
              </div>
              <div style={styles.rulesList}>
                {currentModule.rules.map(rule => (
                  <div key={rule.code} style={styles.ruleRow}>
                    <span style={styles.ruleCode}>{rule.code}</span>
                    <span style={styles.ruleText}>{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFinishCourse} style={styles.assessmentBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Award size={18} color="#c084fc" />
              <h4 style={styles.moduleTitle}>Module 5: Luma Airways Staff Rules Assessment</h4>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 8px 0' }}>
              Answer all 6 questions correctly (100% required) and sign the pledge below to complete your C6 Behavioral Course.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {COURSE_QUESTIONS.map((q, qIdx) => {
                const chosen = answers[q.id];
                const isWrong = chosen !== undefined && chosen !== q.correctIndex;
                const isRight = chosen !== undefined && chosen === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    style={{
                      ...styles.questionCard,
                      borderColor: isRight ? 'rgba(16, 185, 129, 0.4)' : isWrong ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                      {qIdx + 1}. {q.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {q.options.map((opt, oIdx) => {
                        const selected = chosen === oIdx;
                        return (
                          <label
                            key={oIdx}
                            style={{
                              ...styles.optionLabel,
                              background: selected ? 'rgba(168, 85, 247, 0.16)' : 'rgba(255,255,255,0.03)',
                              borderColor: selected ? '#a855f7' : 'rgba(255,255,255,0.08)'
                            }}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={selected}
                              onChange={() => {
                                setAnswers(prev => ({ ...prev, [q.id]: oIdx }));
                                setErrorMsg('');
                              }}
                              style={{ accentColor: '#a855f7' }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                    {isWrong && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.78rem', marginTop: '6px', fontWeight: '600' }}>
                        <AlertTriangle size={13} /> Incorrect — please review the Luma Airways Staff Rules and select the right response.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <label style={styles.pledgeLabel}>
              <input
                type="checkbox"
                checked={pledged}
                onChange={e => {
                  setPledged(e.target.checked);
                  setErrorMsg('');
                }}
                style={{ width: '17px', height: '17px', accentColor: '#10b981', flexShrink: 0, marginTop: '2px' }}
              />
              <span>
                I confirm that I have reviewed all Luma Airways Staff Rules (1.0.1 – 1.13.1), completed the full C6 Behavioral Course, and commit to following every policy moving forward.
              </span>
            </label>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            <div style={styles.footer}>
              <button type="button" onClick={() => setStepIndex(prev => prev - 1)} className="btn-secondary" style={styles.navBtn}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  ...styles.completeBtn,
                  opacity: (allQuestionsCorrect && pledged) ? 1 : 0.6
                }}
              >
                <ShieldCheck size={16} /> Complete Behavioral Course
              </button>
            </div>
          </form>
        )}

        {/* Navigation Footer for Modules 1..4 */}
        {!isAssessment && (
          <div style={styles.footer}>
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
              className="btn-secondary"
              style={{ ...styles.navBtn, opacity: stepIndex === 0 ? 0.45 : 1 }}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button
              type="button"
              onClick={() => setStepIndex(prev => prev + 1)}
              className="btn-primary"
              style={styles.nextBtn}
            >
              <span>{stepIndex === COURSE_MODULES.length - 1 ? 'Proceed to Assessment' : 'Next Module'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 6, 23, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1250,
    padding: '20px',
    overflowY: 'auto',
  },
  modal: {
    width: '100%',
    maxWidth: '780px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '26px',
    borderRadius: '18px',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #a855f7, #ec4899)',
    transition: 'width 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(168, 85, 247, 0.15)',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kicker: {
    fontSize: '0.74rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#c084fc',
  },
  title: {
    margin: 0,
    fontSize: '1.22rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  metaBar: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  stepperRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stepChip: {
    padding: '5px 11px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.76rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  moduleBox: {
    padding: '18px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  moduleTitle: {
    margin: 0,
    fontSize: '1.08rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  moduleSub: {
    margin: '4px 0 0 0',
    fontSize: '0.82rem',
    color: '#94a3b8',
  },
  moduleBody: {
    margin: 0,
    fontSize: '0.93rem',
    lineHeight: '1.6',
    color: 'var(--color-text-main)',
  },
  rulesBox: {
    padding: '14px',
    borderRadius: '10px',
    background: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.25)',
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  ruleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  ruleCode: {
    fontSize: '0.74rem',
    fontWeight: '800',
    color: '#d8b4fe',
    background: 'rgba(168, 85, 247, 0.22)',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    padding: '2px 7px',
    borderRadius: '6px',
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  ruleText: {
    fontSize: '0.86rem',
    color: 'var(--color-text-main)',
    lineHeight: '1.45',
  },
  assessmentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionCard: {
    padding: '14px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
  },
  pledgeLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    fontSize: '0.86rem',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    lineHeight: '1.45',
  },
  errorBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    fontSize: '0.84rem',
    fontWeight: '600',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px',
  },
  navBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  nextBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
  },
  completeBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #10b981, #059669)',
  },
};
