import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoreQuiz } from '../api';
import { ARGOVIS_URL } from '../argoShared';

function OceanOrbSVG() {
  return (
    <svg width="220" height="220" viewBox="0 0 240 240" fill="none">
      <defs>
        <radialGradient id="qSkyGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0a3d6b" />
          <stop offset="100%" stopColor="#020e1f" />
        </radialGradient>
        <radialGradient id="qDeepGrad" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#0d4f8c" />
          <stop offset="100%" stopColor="#020b18" />
        </radialGradient>
        <clipPath id="qOrbClip">
          <circle cx="120" cy="120" r="116" />
        </clipPath>
        <style>{`
          @keyframes qWave1 {
            0%,100% { d: path("M0 128 C30 114 60 142 90 128 C120 114 150 142 180 128 C210 114 230 128 240 128 L240 240 L0 240 Z"); }
            50%      { d: path("M0 136 C30 150 60 122 90 136 C120 150 150 122 180 136 C210 150 230 136 240 136 L240 240 L0 240 Z"); }
          }
          @keyframes qWave2 {
            0%,100% { d: path("M0 148 C40 134 80 162 120 148 C160 134 200 162 240 148 L240 240 L0 240 Z"); }
            50%      { d: path("M0 156 C40 170 80 142 120 156 C160 170 200 142 240 156 L240 240 L0 240 Z"); }
          }
          @keyframes qWave3 {
            0%,100% { d: path("M0 168 C50 154 100 182 150 168 C180 158 210 174 240 168 L240 240 L0 240 Z"); }
            50%      { d: path("M0 174 C50 188 100 160 150 174 C180 184 210 168 240 174 L240 240 L0 240 Z"); }
          }
          @keyframes qGlowPulse {
            0%,100% { opacity: 0.55; }
            50%      { opacity: 0.85; }
          }
          @keyframes qFishFloat {
            0%   { transform: translateX(-20px); }
            100% { transform: translateX(260px); }
          }
          @keyframes qFishFloat2 {
            0%   { transform: translateX(260px) scaleX(-1); }
            100% { transform: translateX(-20px) scaleX(-1); }
          }
          @keyframes qBubbleRise {
            0%   { transform: translateY(0); opacity:0.7; }
            100% { transform: translateY(-80px); opacity:0; }
          }
        `}</style>
      </defs>
      <g clipPath="url(#qOrbClip)">
        <rect width="240" height="240" fill="url(#qDeepGrad)" />
        <rect width="240" height="128" fill="url(#qSkyGrad)" />
        {[[22,18],[55,10],[90,26],[130,8],[165,22],[198,12],[215,35],[40,40]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill="white" opacity={0.4 + (i%3)*0.2} />
        ))}
        <circle cx="178" cy="36" r="18" fill="#c8e6f5" opacity="0.08" />
        <circle cx="178" cy="36" r="12" fill="#d0eaf8" opacity="0.15" />
        <circle cx="178" cy="36" r="7"  fill="#e8f4fd" opacity="0.55" />
        {[80,100,120,140,160].map((x,i) => (
          <rect key={i} x={x-4} y="128" width="8" height="112"
            fill="rgba(72,202,228,0.06)"
            transform={`rotate(${(i-2)*5} ${x} 128)`}
            style={{ animation: `qGlowPulse ${2+i*0.4}s ${i*0.3}s ease-in-out infinite` }}
          />
        ))}
        <path d="M0 168 C50 154 100 182 150 168 C180 158 210 174 240 168 L240 240 L0 240 Z"
          fill="#083a6e" opacity="0.9" style={{ animation: 'qWave3 4.2s ease-in-out infinite' }} />
        <path d="M0 148 C40 134 80 162 120 148 C160 134 200 162 240 148 L240 240 L0 240 Z"
          fill="#0a4f8a" opacity="0.92" style={{ animation: 'qWave2 3.6s ease-in-out infinite' }} />
        <path d="M0 128 C30 114 60 142 90 128 C120 114 150 142 180 128 C210 114 230 128 240 128 L240 240 L0 240 Z"
          fill="#1565c0" opacity="0.9" style={{ animation: 'qWave1 3s ease-in-out infinite' }} />
        <path d="M0 128 C30 114 60 142 90 128 C120 114 150 142 180 128 C210 114 230 128 240 128"
          stroke="rgba(144,224,239,0.65)" strokeWidth="2" fill="none"
          style={{ animation: 'qWave1 3s ease-in-out infinite' }} />
        {[[65,200],[105,185],[148,196],[185,180]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={2.5 + i} fill="none"
            stroke="rgba(144,224,239,0.4)" strokeWidth="1"
            style={{ animation: `qBubbleRise ${2+i*0.6}s ${i*0.8}s ease-in infinite` }}
          />
        ))}
        <g style={{ animation: 'qFishFloat 8s 0s linear infinite' }}>
          <ellipse cx="30" cy="162" rx="9" ry="4" fill="rgba(72,202,228,0.5)" />
          <path d="M21 162 L14 157 L14 167 Z" fill="rgba(72,202,228,0.5)" />
          <circle cx="37" cy="160" r="2" fill="rgba(255,255,255,0.6)" />
        </g>
        <g style={{ animation: 'qFishFloat2 11s 2s linear infinite' }}>
          <ellipse cx="190" cy="175" rx="7" ry="3.5" fill="rgba(100,220,200,0.45)" />
          <path d="M197 175 L204 171 L204 179 Z" fill="rgba(100,220,200,0.45)" />
        </g>
        <ellipse cx="120" cy="240" rx="130" ry="22" fill="#041020" opacity="0.8" />
        {[[50,228],[95,232],[150,230],[195,226]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={3+i} fill={['#1a472a','#2d6a4f','#1a472a','#163a2a'][i]} opacity="0.9" />
        ))}
        <circle cx="120" cy="120" r="116" stroke="rgba(72,202,228,0.18)" strokeWidth="2" fill="none" />
        <circle cx="120" cy="120" r="110" stroke="rgba(0,180,216,0.08)" strokeWidth="6" fill="none" />
      </g>
    </svg>
  );
}

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

const ARGO_STATS = [
  { icon: '🌊', text: 'California Current avg temperature: 17.3°C' },
  { icon: '📍', text: '12 Argo floats monitoring this region right now' },
  { icon: '🐟', text: '28 fish species depend on this ecosystem' },
  { icon: '⚠️', text: 'Temperature has risen 1.2°C since Argo began' },
];

export default function Quiz() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [avgSST, setAvgSST] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    (async () => {
      try {
        const res = await fetch(ARGOVIS_URL, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('non-200');
        const raw = await res.json();
        if (!cancelled && Array.isArray(raw) && raw.length > 0) {
          const sstList = raw.map(p => {
            if (Array.isArray(p.measurements)) {
              const surf = p.measurements.find(m => m.pres < 20);
              return surf?.temp ?? null;
            }
            if (Array.isArray(p.data) && Array.isArray(p.data_info?.[0])) {
              const cols = p.data_info[0];
              const pi = cols.indexOf('pres'), ti = cols.indexOf('temp');
              if (pi >= 0 && ti >= 0) {
                const surf = p.data.find(r => r[pi] < 20);
                return surf?.[ti] ?? null;
              }
            }
            return null;
          }).filter(t => t != null);
          if (sstList.length && !cancelled) {
            setAvgSST((sstList.reduce((a, b) => a + b, 0) / sstList.length).toFixed(1));
          }
        }
      } catch {
        clearTimeout(timer);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, []);

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
        const scores = [0, 1, 2, 3].map(d =>
          newAnswers.slice(d * 4, d * 4 + 4).filter(x => x === 'A').length
        );
        try {
          const result = await scoreQuiz(newAnswers);
          navigate('/result', { state: { fromQuiz: true, result, scores } });
        } catch (err) {
          // Fallback: local scoring so the app still works
          const result = localScore(newAnswers);
          navigate('/result', { state: { fromQuiz: true, result, scores } });
        }
      }
    }, 320);
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingOrb}><OceanOrbSVG /></div>
        <p style={styles.loadingText}>Reading the currents…</p>
        <p style={styles.loadingSubText}>Matching your ocean personality</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`@keyframes statFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={styles.bgGlow} />

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo} onClick={() => navigate('/')}>HYML</span>
        <div style={styles.dimLabel}>{DIM_LABELS[dimIndex]}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {avgSST != null && (
            <span style={styles.sstBadge}>
              🌡 California Current: {avgSST}°C
            </span>
          )}
          <span style={styles.counter}>{current + 1} / {QUESTIONS.length}</span>
        </div>
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

      {/* Ocean stat bar */}
      <div style={styles.statBar}>
        <span
          key={dimIndex}
          style={{
            ...styles.statBarText,
            animation: 'statFadeIn 0.5s ease both',
          }}
        >
          {ARGO_STATS[dimIndex].icon}&nbsp;&nbsp;{ARGO_STATS[dimIndex].text}
        </span>
        <span style={styles.statBarSource}>· Scripps / Argo</span>
      </div>
    </div>
  );
}

function localScore(answers) {
  // Each dimension: count A answers in the 4-question block
const dim = (start) => {
    const slice = answers.slice(start, start + 4);
    const aCount = slice.filter(x => x === 'A').length;
    
    // Tie-breaker
    if (aCount === 2) {
      return slice[0];
    }
    
    return aCount > 2 ? 'A' : 'B';
  };

  // 1. Calculate the raw letters
  const d1 = dim(0) === 'A' ? 'D' : 'R';  // Deep vs Reef
  const d2 = dim(4) === 'A' ? 'C' : 'T';  // Current vs Tide
  const d3 = dim(8) === 'A' ? 'P' : 'N';  // Predator vs Nurturer
  const d4 = dim(12) === 'A' ? 'S' : 'F'; // Structured vs Flowing

  // 2. The Fix: Normalize 'T' to 'R' so it matches the dictionary keys
  const normalizedD2 = d2 === 'T' ? 'R' : d2;
  
  const lookupKey = `${d1}${normalizedD2}${d3}${d4}`;
  const displayCode = `${d1}${d2}${d3}${d4}`; // Keep T for the user UI

  const codeMap = {
    'DCPS': { animal: 'Great White Shark', group: 'Hunters',   emoji: '🦈' },
    'DCPF': { animal: 'Barracuda',         group: 'Hunters',   emoji: '🐟' },
    'DCNS': { animal: 'Moray Eel',         group: 'Hunters',   emoji: '🐍' },
    'DCNF': { animal: 'Mantis Shrimp',     group: 'Hunters',   emoji: '🦐' },
    'DRPS': { animal: 'Sea Turtle',        group: 'Wanderers', emoji: '🐢' },
    'DRPF': { animal: 'Manta Ray',         group: 'Wanderers', emoji: '🐡' },
    'DRNS': { animal: 'Flying Fish',       group: 'Wanderers', emoji: '🐟' },
    'DRNF': { animal: 'Jellyfish',         group: 'Wanderers', emoji: '🪼' },
    'RCPS': { animal: 'Humpback Whale',    group: 'Guardians', emoji: '🐳' },
    'RCPF': { animal: 'Dolphin',           group: 'Guardians', emoji: '🐬' },
    'RCNS': { animal: 'Octopus',           group: 'Guardians', emoji: '🐙' },
    'RCNF': { animal: 'Seahorse',          group: 'Guardians', emoji: '🐠' },
    'RRPS': { animal: 'Clownfish',         group: 'Builders',  emoji: '🐠' },
    'RRPF': { animal: 'Sea Otter',         group: 'Builders',  emoji: '🦦' },
    'RRNS': { animal: 'Hermit Crab',       group: 'Builders',  emoji: '🦀' },
    'RRNF': { animal: 'Coral Polyp',       group: 'Builders',  emoji: '🪸' },
  };

  const match = codeMap[lookupKey] || { animal: 'Starfish', group: 'Guardians', emoji: '⭐' };

  console.log('[localScore] answers:', answers);
  console.log(`[localScore] D1=${d1} D2=${d2} D3=${d3} D4=${d4} → code=${displayCode} → ${match.animal} (${match.group})`);

  return {
    animal: match.animal,
    group: match.group,
    emoji: match.emoji,
    code: displayCode, // Shows the real code (e.g., RTNS)
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
    marginBottom: '32px',
    filter: 'drop-shadow(0 0 30px rgba(72,202,228,0.5))',
    animation: 'floatSlow 3s ease-in-out infinite',
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
  statBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '11px 24px',
    background: 'linear-gradient(90deg, rgba(0,20,50,0.0), rgba(0,50,90,0.55), rgba(0,20,50,0.0))',
    borderTop: '1px solid rgba(72,202,228,0.12)',
    backdropFilter: 'blur(8px)',
  },
  statBarText: {
    fontSize: '12px', color: 'rgba(144,224,239,0.8)', fontWeight: 500, letterSpacing: '0.2px',
  },
  statBarSource: {
    fontSize: '11px', color: 'rgba(100,160,200,0.4)', letterSpacing: '0.3px',
  },
  sstBadge: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px',
    color: 'rgba(72,202,228,0.75)',
    background: 'rgba(0,100,160,0.18)',
    border: '1px solid rgba(72,202,228,0.2)',
    borderRadius: '20px',
    padding: '5px 12px',
    whiteSpace: 'nowrap',
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
