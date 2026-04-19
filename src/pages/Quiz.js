import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoreQuiz } from '../api';

const QUESTIONS = [
  // Dimension 1: Deep (A) vs Reef (B)
  { id: 1,  text: 'After a long day you prefer to…',                        a: 'Recharge alone',                   b: 'Hang out with friends' },
  { id: 2,  text: 'You work best…',                                         a: 'Independently',                    b: 'Collaborating with a group' },
  { id: 3,  text: "You'd rather have…",                                     a: 'A few deep friendships',           b: 'Know lots of people' },
  { id: 4,  text: 'At a party you…',                                        a: 'Find one person and talk deeply',  b: 'Work the whole room' },
  // Dimension 2: Current (A) vs Tide (B)
  { id: 5,  text: 'You trust…',                                             a: 'Concrete facts and data',          b: 'Gut feelings and patterns' },
  { id: 6,  text: 'You prefer…',                                            a: 'Step-by-step instructions',        b: 'Figuring it out as you go' },
  { id: 7,  text: 'You focus on…',                                          a: "What's happening now",             b: 'What could happen in the future' },
  { id: 8,  text: "You're more…",                                           a: 'Realistic',                        b: 'Imaginative' },
  // Dimension 3: Predator (A) vs Nurturer (B)
  { id: 9,  text: 'Decisions should be based on…',                          a: 'Logic',                            b: 'How people feel' },
  { id: 10, text: 'You value…',                                             a: 'Being right',                      b: 'Being kind' },
  { id: 11, text: 'A friend vents to you, you…',                            a: 'Give advice',                      b: 'Just listen and empathize' },
  { id: 12, text: "You'd rather be seen as…",                               a: 'Competent',                        b: 'Warm' },
  // Dimension 4: Structured (A) vs Flowing (B)
  { id: 13, text: 'You prefer…',                                            a: 'A clear plan',                     b: 'Keeping options open' },
  { id: 14, text: 'Your workspace is…',                                     a: 'Organized',                        b: 'Creatively messy' },
  { id: 15, text: 'Deadlines feel…',                                        a: 'Helpful',                          b: 'Restrictive' },
  { id: 16, text: "You'd rather…",                                          a: 'Follow a schedule',                b: 'Be spontaneous' },
];

const DIM_LABELS = ['Deep vs Reef', 'Current vs Tide', 'Predator vs Nurturer', 'Structured vs Flowing'];

export default function Quiz() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [animating, setAnimating] = useState(false);

  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;
  const dimIndex = Math.floor(current / 4);

  async function handleAnswer(choice) {
    if (animating || loading) return;
    setAnimating(true);

    const newAnswers = [...answers, choice];

    setTimeout(async () => {
      if (current < QUESTIONS.length - 1) {
        setAnswers(newAnswers);
        setCurrent(c => c + 1);
        setAnimating(false);
      } else {
        setAnswers(newAnswers);
        setLoading(true);
        try {
          const result = await scoreQuiz(newAnswers);
          navigate('/result', { state: { result } });
        } catch (err) {
          // Fallback: local scoring so the app still works
          const result = localScore(newAnswers);
          navigate('/result', { state: { result } });
        }
      }
    }, 320);
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingOrb}>🌊</div>
        <p style={styles.loadingText}>Reading the currents…</p>
        <p style={styles.loadingSubText}>Matching your ocean personality</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo} onClick={() => navigate('/')}>HYML</span>
        <div style={styles.dimLabel}>{DIM_LABELS[dimIndex]}</div>
        <span style={styles.counter}>{current + 1} / {QUESTIONS.length}</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }}
        />
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.progressDot,
              left: `${(i / QUESTIONS.length) * 100}%`,
              background: i < current
                ? '#48cae4'
                : i === current
                  ? '#90e0ef'
                  : 'rgba(255,255,255,0.1)',
              transform: i === current ? 'translateY(-50%) scale(1.4)' : 'translateY(-50%)',
            }}
          />
        ))}
      </div>

      {/* Question card */}
      <div style={styles.cardWrap}>
        <div
          style={{
            ...styles.card,
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(-20px) scale(0.97)' : 'translateY(0) scale(1)',
            transition: 'opacity 0.28s ease, transform 0.28s ease',
          }}
        >
          <p style={styles.qNumber}>Question {current + 1}</p>
          <h2 style={styles.qText}>{q.text}</h2>

          {error && <p style={styles.errorText}>{error}</p>}

          <div style={styles.options}>
            <button
              style={styles.optionBtn}
              onClick={() => handleAnswer('A')}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,150,200,0.25)';
                e.currentTarget.style.borderColor = '#48cae4';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(10,30,70,0.6)';
                e.currentTarget.style.borderColor = 'rgba(72,202,228,0.2)';
              }}
            >
              <span style={styles.optionLabel}>A</span>
              <span style={styles.optionText}>{q.a}</span>
            </button>

            <button
              style={styles.optionBtn}
              onClick={() => handleAnswer('B')}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,150,200,0.25)';
                e.currentTarget.style.borderColor = '#48cae4';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(10,30,70,0.6)';
                e.currentTarget.style.borderColor = 'rgba(72,202,228,0.2)';
              }}
            >
              <span style={styles.optionLabel}>B</span>
              <span style={styles.optionText}>{q.b}</span>
            </button>
          </div>
        </div>

        {/* Dimension indicators */}
        <div style={styles.dims}>
          {DIM_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                ...styles.dimPill,
                background: i === dimIndex
                  ? 'rgba(0,150,200,0.3)'
                  : 'rgba(255,255,255,0.04)',
                borderColor: i === dimIndex
                  ? 'rgba(72,202,228,0.5)'
                  : 'rgba(255,255,255,0.08)',
                color: i === dimIndex ? '#90e0ef' : 'rgba(200,230,255,0.3)',
              }}
            >
              {i < dimIndex ? '✓ ' : ''}{label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function localScore(answers) {
  const dim = (start) => {
    const slice = answers.slice(start, start + 4);
    const aCount = slice.filter(x => x === 'A').length;
    return aCount >= 2 ? 'A' : 'B';
  };
  const d1 = dim(0);  // A=Deep, B=Reef
  const d2 = dim(4);  // A=Current, B=Tide
  const d3 = dim(8);  // A=Predator, B=Nurturer
  const d4 = dim(12); // A=Structured, B=Flowing

  const codeMap = {
    AAPA: { animal: 'Great White Shark', group: 'Hunters',   emoji: '🦈', code: 'DCPS' },
    AAPB: { animal: 'Hammerhead Shark',  group: 'Hunters',   emoji: '🦈', code: 'DCPF' },
    AABА: { animal: 'Orca',              group: 'Hunters',   emoji: '🐋', code: 'DCNS' },
    AABB: { animal: 'Manta Ray',         group: 'Wanderers', emoji: '🐟', code: 'DCNF' },
    ABPA: { animal: 'Barracuda',         group: 'Hunters',   emoji: '🐟', code: 'DTPS' },
    ABPB: { animal: 'Swordfish',         group: 'Wanderers', emoji: '🐟', code: 'DTPF' },
    ABBA: { animal: 'Dolphin',           group: 'Wanderers', emoji: '🐬', code: 'DTNS' },
    ABBB: { animal: 'Sea Horse',         group: 'Wanderers', emoji: '🐟', code: 'DTNF' },
    BAPA: { animal: 'Blue Whale',        group: 'Guardians', emoji: '🐳', code: 'RCPS' },
    BAPB: { animal: 'Mantis Shrimp',     group: 'Builders',  emoji: '🦐', code: 'RCPF' },
    BABA: { animal: 'Sea Turtle',        group: 'Guardians', emoji: '🐢', code: 'RCNS' },
    BABB: { animal: 'Manatee',           group: 'Guardians', emoji: '🐟', code: 'RCNF' },
    BBPA: { animal: 'Octopus',           group: 'Builders',  emoji: '🐙', code: 'RTPS' },
    BBPB: { animal: 'Clownfish',         group: 'Builders',  emoji: '🐠', code: 'RTPF' },
    BBBA: { animal: 'Starfish',          group: 'Guardians', emoji: '⭐', code: 'RTNS' },
    BBBB: { animal: 'Jellyfish',         group: 'Wanderers', emoji: '🪼', code: 'RTNF' },
  };

  const key = `${d1}${d2}${d3}${d4}`;
  const match = codeMap[key] || codeMap['BBBA'];

  return {
    animal: match.animal,
    group: match.group,
    emoji: match.emoji,
    code: match.code,
    description: `As a ${match.animal}, you navigate life with a unique current. Your ocean personality shapes how you connect, decide, and move through the world.`,
  };
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #020b18 0%, #041428 30%, #061e3a 70%, #041428 100%)',
    display: 'flex',
    flexDirection: 'column',
    color: '#e8f4fd',
    position: 'relative',
  },
  bgGlow: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,80,160,0.2) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  loadingPage: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #020b18 0%, #041428 50%, #061e3a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e8f4fd',
  },
  loadingOrb: {
    fontSize: '80px',
    animation: 'floatSlow 3s ease-in-out infinite',
    marginBottom: '32px',
    filter: 'drop-shadow(0 0 30px rgba(72,202,228,0.5))',
  },
  loadingText: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#90e0ef',
    marginBottom: '10px',
  },
  loadingSubText: {
    fontSize: '14px',
    color: 'rgba(180,220,255,0.5)',
  },
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '22px 48px',
    borderBottom: '1px solid rgba(100,180,255,0.07)',
  },
  logo: {
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '5px',
    color: '#90e0ef',
    cursor: 'pointer',
  },
  dimLabel: {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.6)',
  },
  counter: {
    fontSize: '14px',
    color: 'rgba(180,220,255,0.55)',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  progressTrack: {
    position: 'relative',
    height: '4px',
    background: 'rgba(255,255,255,0.06)',
    margin: '0',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #0096c7, #48cae4)',
    borderRadius: '0 2px 2px 0',
  },
  progressDot: {
    position: 'absolute',
    top: '50%',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginLeft: '-4px',
    transition: 'background 0.3s, transform 0.3s',
  },
  cardWrap: {
    position: 'relative',
    zIndex: 5,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  card: {
    background: 'linear-gradient(145deg, rgba(10,30,70,0.85), rgba(5,18,45,0.95))',
    border: '1px solid rgba(72,202,228,0.15)',
    borderRadius: '28px',
    padding: '52px 48px',
    maxWidth: '680px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(0,80,160,0.1)',
    marginBottom: '32px',
  },
  qNumber: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: '#48cae4',
    marginBottom: '20px',
  },
  qText: {
    fontSize: 'clamp(22px, 3vw, 32px)',
    fontWeight: 700,
    color: '#e8f4fd',
    lineHeight: 1.3,
    marginBottom: '44px',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 24px',
    background: 'rgba(10,30,70,0.6)',
    border: '1.5px solid rgba(72,202,228,0.2)',
    borderRadius: '14px',
    color: '#e8f4fd',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
    width: '100%',
  },
  optionLabel: {
    flexShrink: 0,
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(72,202,228,0.15)',
    border: '1px solid rgba(72,202,228,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#48cae4',
  },
  optionText: {
    fontSize: '16px',
    color: 'rgba(220,240,255,0.9)',
    fontWeight: 500,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '13px',
    marginBottom: '16px',
  },
  dims: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '680px',
    width: '100%',
  },
  dimPill: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    letterSpacing: '0.3px',
  },
};
