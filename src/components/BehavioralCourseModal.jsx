import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Award,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatUpcomingSanctionTime } from './ConsequenceLoggedModal';

const COURSE_MODULES = [
  {
    id: 'self-regulation',
    title: 'Module 1: Emotional Control & Self-Regulation',
    subtitle: 'Staying composed before reacting during tense situations',
    content:
      'Working on live flights and managing busy airports can be stressful. Self-regulation means pausing when frustrated, keeping your tone respectful, and choosing a measured response rather than reacting impulsively. At Luma Airways, staff members are expected to de-escalate pressure instead of adding to it.',
    points: [
      'Take a brief pause before responding when a passenger or teammate is frustrated.',
      'Never let personal irritation dictate your tone in chat or voice communications.',
      'Ask a senior staff member for support early if a situation starts getting overwhelming.'
    ]
  },
  {
    id: 'communication',
    title: 'Module 2: Respectful Communication & De-escalation',
    subtitle: 'Professional tone, active listening, and teamwork',
    content:
      'Every message you send on duty represents Luma Airways. De-escalation relies on listening carefully, speaking clearly with proper grammar, and addressing issues constructively without sarcasm, hostility, or public arguments.',
    points: [
      'Acknowledge concerns calmly and provide clear, polite instructions.',
      'Resolve disagreements with colleagues privately through leadership rather than public channels.',
      'Follow supervisor instructions promptly without arguing in front of passengers.'
    ]
  },
  {
    id: 'accountability',
    title: 'Module 3: Accountability & Chain of Command',
    subtitle: 'Owning decisions and respecting operational structure',
    content:
      'Accountability is accepting full responsibility for your actions and following the chain of command. Making excuses, hiding mistakes, or bypassing leadership undermines operational safety and team trust.',
    points: [
      'Be honest and transparent when reporting incidents or mistakes to supervisors.',
      'Accept corrective feedback constructively and adjust behavior immediately.',
      'Respect rank boundaries and escalate issues through the proper channels.'
    ]
  },
  {
    id: 'integrity',
    title: 'Module 4: Integrity & Cumulative Consequences',
    subtitle: 'Protecting your standing and upholding company policy',
    content:
      'Behavioral expectations apply at every rank and even when no supervisor is watching. Repeated infractions accumulate weighted consequence points toward the 35-point dismissal threshold, damage promotion eligibility, and weaken leadership trust. Completing this course is a commitment to lasting behavioral change.',
    points: [
      'Follow all airline policies consistently across every airport, flight, and portal channel.',
      'Never abuse staff permissions, tools, or rank authority.',
      'Recognize that repeated rule breaking compounds consequences—protect your standing by correcting habits permanently.'
    ]
  }
];

const COURSE_QUESTIONS = [
  {
    id: 'q1',
    question: 'A passenger is upset about a boarding delay and uses a rude tone. What is the correct behavioral response?',
    options: [
      'Match their tone so they know staff are in charge.',
      'Stay calm, respond politely, and explain the update clearly or escalate to a supervisor if needed.',
      'Ignore them completely and walk away from your post.'
    ],
    correctIndex: 1
  },
  {
    id: 'q2',
    question: 'A supervisor corrects you for being out of station during boarding. How should you respond?',
    options: [
      'Argue in front of passengers that another staff member was supposed to cover.',
      'Return to your assigned post immediately, accept the feedback, and discuss any concerns privately afterward.',
      'Leave the shift early because you feel criticized.'
    ],
    correctIndex: 1
  },
  {
    id: 'q3',
    question: 'Why does Luma Airways track cumulative consequence points across C1–C6 sanctions?',
    options: [
      'Because repeated infractions add up over time, and reaching 35 points results in termination from the staff team.',
      'They are only cosmetic and have no impact on your staff record.',
      'Only C5 suspensions count toward your record.'
    ],
    correctIndex: 0
  },
  {
    id: 'q4',
    question: 'You notice you made a mistake in a flight or operational log. What shows integrity?',
    options: [
      'Cover it up and hope no supervisor checks the log.',
      'Blame another staff member on the shift.',
      'Report the error honestly to leadership and correct it promptly.'
    ],
    correctIndex: 2
  }
];

export default function BehavioralCourseModal({ isOpen, onClose, sanction, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0); // 0..3 modules, 4 = assessment
  const [answers, setAnswers] = useState({});
  const [pledged, setPledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !sanction) return null;

  const totalSteps = COURSE_MODULES.length + 1;
  const isAssessment = stepIndex === COURSE_MODULES.length;
  const currentModule = !isAssessment ? COURSE_MODULES[stepIndex] : null;
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const allQuestionsAnswered = COURSE_QUESTIONS.every(q => answers[q.id] !== undefined);
  const allQuestionsCorrect = COURSE_QUESTIONS.every(q => answers[q.id] === q.correctIndex);

  const handleFinishCourse = (e) => {
    e.preventDefault();
    if (!allQuestionsAnswered) {
      setErrorMsg('Please answer all 4 assessment questions before completing the course.');
      return;
    }
    if (!allQuestionsCorrect) {
      setErrorMsg('One or more answers are incorrect. Please review the highlighted questions and select the right responses.');
      return;
    }
    if (!pledged) {
      setErrorMsg('Please check the behavioral commitment pledge to finish the course.');
      return;
    }
    onComplete(sanction.id || sanction._firebaseKey);
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
              <h3 style={styles.title}>Full Staff Behavioral Course</h3>
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
            <strong>Scheduled:</strong> {sanction.detentionDate || 'Assigned Date'} &bull; {formatUpcomingSanctionTime(sanction.detentionTime, sanction.type)}
          </span>
          {sanction.mainMessage && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Reason: {sanction.mainMessage}
            </span>
          )}
        </div>

        {/* Content Area */}
        {!isAssessment && currentModule ? (
          <div style={styles.moduleBox}>
            <div>
              <h4 style={styles.moduleTitle}>{currentModule.title}</h4>
              <p style={styles.moduleSub}>{currentModule.subtitle}</p>
            </div>
            <p style={styles.moduleBody}>{currentModule.content}</p>
            <div style={styles.pointsBox}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#c084fc', marginBottom: '8px' }}>
                Core Behavioral Takeaways
              </div>
              <ul style={styles.pointsList}>
                {currentModule.points.map((pt, idx) => (
                  <li key={idx} style={styles.pointItem}>
                    <CheckCircle2 size={15} color="#a855f7" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFinishCourse} style={styles.assessmentBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Award size={18} color="#c084fc" />
              <h4 style={styles.moduleTitle}>Module 5: Behavioral Assessment & Commitment</h4>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 8px 0' }}>
              Answer every scenario question correctly (100% required) and sign the pledge below to complete your C6 Behavioral Course.
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
                        <AlertTriangle size={13} /> Incorrect — please review and choose the professional response.
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
                I confirm that I have completed the full C6 Behavioral Course, understand Luma Airways conduct expectations, and commit to maintaining professional behavior moving forward.
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
    maxWidth: '720px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '26px',
    borderRadius: '18px',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    fontSize: '1.25rem',
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
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  moduleSub: {
    margin: '4px 0 0 0',
    fontSize: '0.84rem',
    color: '#94a3b8',
  },
  moduleBody: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: '1.65',
    color: 'var(--color-text-main)',
  },
  pointsBox: {
    padding: '14px',
    borderRadius: '10px',
    background: 'rgba(168, 85, 247, 0.09)',
    border: '1px solid rgba(168, 85, 247, 0.25)',
  },
  pointsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  pointItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '0.88rem',
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
