import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function OceanOrbSVG() {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0a3d6b" />
          <stop offset="100%" stopColor="#020e1f" />
        </radialGradient>
        <radialGradient id="deepGrad" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#0d4f8c" />
          <stop offset="100%" stopColor="#020b18" />
        </radialGradient>
        <clipPath id="orbClip">
          <circle cx="120" cy="120" r="116" />
        </clipPath>
        <style>{`
          @keyframes wave1anim {
            0%,100% { d: path("M0 128 C30 114 60 142 90 128 C120 114 150 142 180 128 C210 114 230 128 240 128 L240 240 L0 240 Z"); }
            50%      { d: path("M0 136 C30 150 60 122 90 136 C120 150 150 122 180 136 C210 150 230 136 240 136 L240 240 L0 240 Z"); }
          }
          @keyframes wave2anim {
            0%,100% { d: path("M0 148 C40 134 80 162 120 148 C160 134 200 162 240 148 L240 240 L0 240 Z"); }
            50%      { d: path("M0 156 C40 170 80 142 120 156 C160 170 200 142 240 156 L240 240 L0 240 Z"); }
          }
          @keyframes wave3anim {
            0%,100% { d: path("M0 168 C50 154 100 182 150 168 C180 158 210 174 240 168 L240 240 L0 240 Z"); }
            50%      { d: path("M0 174 C50 188 100 160 150 174 C180 184 210 168 240 174 L240 240 L0 240 Z"); }
          }
          @keyframes glowPulse {
            0%,100% { opacity: 0.55; }
            50%      { opacity: 0.85; }
          }
          @keyframes fishFloat {
            0%   { transform: translateX(-20px); }
            100% { transform: translateX(260px); }
          }
          @keyframes fishFloat2 {
            0%   { transform: translateX(260px) scaleX(-1); }
            100% { transform: translateX(-20px) scaleX(-1); }
          }
          @keyframes bubbleRise {
            0%   { transform: translateY(0); opacity:0.7; }
            100% { transform: translateY(-80px); opacity:0; }
          }
        `}</style>
      </defs>

      <g clipPath="url(#orbClip)">
        {/* Deep ocean background */}
        <rect width="240" height="240" fill="url(#deepGrad)" />

        {/* Sky above water */}
        <rect width="240" height="128" fill="url(#skyGrad)" />

        {/* Stars */}
        {[[22,18],[55,10],[90,26],[130,8],[165,22],[198,12],[215,35],[40,40]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill="white" opacity={0.4 + (i%3)*0.2} />
        ))}

        {/* Moon glow */}
        <circle cx="178" cy="36" r="18" fill="#c8e6f5" opacity="0.08" />
        <circle cx="178" cy="36" r="12" fill="#d0eaf8" opacity="0.15" />
        <circle cx="178" cy="36" r="7"  fill="#e8f4fd" opacity="0.55" />

        {/* Underwater light rays */}
        {[80,100,120,140,160].map((x,i) => (
          <rect key={i} x={x-4} y="128" width="8" height="112"
            fill="rgba(72,202,228,0.06)"
            transform={`rotate(${(i-2)*5} ${x} 128)`}
            style={{ animation: `glowPulse ${2+i*0.4}s ${i*0.3}s ease-in-out infinite` }}
          />
        ))}

        {/* Wave layer 3 (darkest, back) */}
        <path
          d="M0 168 C50 154 100 182 150 168 C180 158 210 174 240 168 L240 240 L0 240 Z"
          fill="#083a6e" opacity="0.9"
          style={{ animation: 'wave3anim 4.2s ease-in-out infinite' }}
        />

        {/* Wave layer 2 (mid) */}
        <path
          d="M0 148 C40 134 80 162 120 148 C160 134 200 162 240 148 L240 240 L0 240 Z"
          fill="#0a4f8a" opacity="0.92"
          style={{ animation: 'wave2anim 3.6s ease-in-out infinite' }}
        />

        {/* Wave layer 1 (surface, lightest) */}
        <path
          d="M0 128 C30 114 60 142 90 128 C120 114 150 142 180 128 C210 114 230 128 240 128 L240 240 L0 240 Z"
          fill="#1565c0" opacity="0.9"
          style={{ animation: 'wave1anim 3s ease-in-out infinite' }}
        />

        {/* Wave crest shimmer */}
        <path
          d="M0 128 C30 114 60 142 90 128 C120 114 150 142 180 128 C210 114 230 128 240 128"
          stroke="rgba(144,224,239,0.65)" strokeWidth="2" fill="none"
          style={{ animation: 'wave1anim 3s ease-in-out infinite' }}
        />

        {/* Underwater bubbles */}
        {[[65,200],[105,185],[148,196],[185,180]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={2.5 + i} fill="none"
            stroke="rgba(144,224,239,0.4)" strokeWidth="1"
            style={{ animation: `bubbleRise ${2+i*0.6}s ${i*0.8}s ease-in infinite` }}
          />
        ))}

        {/* Small fish silhouettes */}
        <g style={{ animation: 'fishFloat 8s 0s linear infinite' }}>
          <ellipse cx="30" cy="162" rx="9" ry="4" fill="rgba(72,202,228,0.5)" />
          <path d="M21 162 L14 157 L14 167 Z" fill="rgba(72,202,228,0.5)" />
          <circle cx="37" cy="160" r="2" fill="rgba(255,255,255,0.6)" />
        </g>
        <g style={{ animation: 'fishFloat2 11s 2s linear infinite' }}>
          <ellipse cx="190" cy="175" rx="7" ry="3.5" fill="rgba(100,220,200,0.45)" />
          <path d="M197 175 L204 171 L204 179 Z" fill="rgba(100,220,200,0.45)" />
        </g>

        {/* Seabed hint */}
        <ellipse cx="120" cy="240" rx="130" ry="22" fill="#041020" opacity="0.8" />
        {/* Seabed dots / coral hints */}
        {[[50,228],[95,232],[150,230],[195,226]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={3+i} fill={['#1a472a','#2d6a4f','#1a472a','#163a2a'][i]} opacity="0.9" />
        ))}

        {/* Orb inner rim glow */}
        <circle cx="120" cy="120" r="116" stroke="rgba(72,202,228,0.18)" strokeWidth="2" fill="none" />
        <circle cx="120" cy="120" r="110" stroke="rgba(0,180,216,0.08)" strokeWidth="6" fill="none" />
      </g>
    </svg>
  );
}

// ─── About Icon SVGs ─────────────────────────────────────────────────────────

function DiscoverIconSVG() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <radialGradient id="magGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
      </defs>
      {/* Lens */}
      <circle cx="15" cy="15" r="10" fill="rgba(56,189,248,0.12)" stroke="url(#magGrad)" strokeWidth="2.2" />
      {/* Lens shine */}
      <path d="M10 10 Q13 8 17 10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Ocean wave inside lens */}
      <clipPath id="lensClip"><circle cx="15" cy="15" r="9" /></clipPath>
      <g clipPath="url(#lensClip)">
        <path d="M6 17 C9 14 12 18 15 15 C18 12 21 16 24 17 L24 24 L6 24 Z" fill="rgba(3,105,161,0.55)" />
        <path d="M6 15 C9 12 12 16 15 13 C18 10 21 14 24 15" stroke="#38bdf8" strokeWidth="1" fill="none" />
      </g>
      {/* Handle */}
      <path d="M23 23 L31 31" stroke="url(#magGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="31" cy="31" r="2" fill="#0369a1" />
    </svg>
  );
}

function GroupIconSVG() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      {/* Three creature silhouettes in a circle */}
      {/* Shark */}
      <ellipse cx="18" cy="12" rx="8" ry="4.5" fill="rgba(71,85,105,0.9)" />
      <path d="M14 10 C15 6 17 7 18 9" fill="#475569" />
      {/* Turtle */}
      <ellipse cx="10" cy="22" rx="5.5" ry="4" fill="rgba(34,197,94,0.85)" />
      <ellipse cx="10" cy="22" rx="3" ry="2.2" fill="rgba(74,222,128,0.4)" />
      <ellipse cx="13.5" cy="21" rx="3" ry="2" fill="#22c55e" />
      {/* Dolphin */}
      <ellipse cx="26" cy="22" rx="5.5" ry="3.5" fill="rgba(56,189,248,0.85)" />
      <path d="M22 21 C21 17 23 17 24 19" fill="#0ea5e9" />
      <ellipse cx="29" cy="21" rx="2.5" ry="1.5" fill="#38bdf8" />
      {/* Connecting arc / orbit */}
      <circle cx="18" cy="18" r="14" stroke="rgba(72,202,228,0.25)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      {/* Echo point star */}
      <circle cx="18" cy="18" r="3.5" fill="rgba(251,191,36,0.85)" />
      <path d="M18 15 L18.7 17.3 L21 17.3 L19.2 18.7 L19.9 21 L18 19.6 L16.1 21 L16.8 18.7 L15 17.3 L17.3 17.3 Z" fill="#fbbf24" />
    </svg>
  );
}

function DataIconSVG() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      {/* Bars */}
      <rect x="5"  y="18" width="6" height="13" rx="1.5" fill="url(#barGrad1)" />
      <rect x="15" y="10" width="6" height="21" rx="1.5" fill="url(#barGrad2)" />
      <rect x="25" y="14" width="6" height="17" rx="1.5" fill="url(#barGrad3)" />
      {/* Axis */}
      <line x1="3" y1="31" x2="33" y2="31" stroke="rgba(144,224,239,0.3)" strokeWidth="1.2" />
      {/* Trend line */}
      <path d="M8 25 L18 14 L28 18" stroke="rgba(251,191,36,0.75)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="2 2" />
      {/* Dots on trend */}
      {[[8,25],[18,14],[28,18]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#fbbf24" opacity="0.85" />
      ))}
      {/* Wave at top — ocean data hint */}
      <path d="M3 7 C6 4 9 8 12 5 C15 2 18 6 21 3" stroke="rgba(56,189,248,0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const GROUPS = [
  { name: 'Hunters',   emoji: '🦈', desc: 'Bold, driven, decisive. You cut through the current.' },
  { name: 'Wanderers', emoji: '🐢', desc: 'Free-spirited, curious, always exploring new depths.' },
  { name: 'Guardians', emoji: '🐬', desc: 'Wise, steady, protecting what matters most.' },
  { name: 'Builders',  emoji: '🦀', desc: 'Creative, strategic, weaving intricate solutions.' },
];

const BUBBLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 7.5) % 84}%`,
  size: `${7 + (i * 3) % 14}px`,
  delay: `${(i * 0.7) % 7}s`,
  duration: `${6 + (i * 1.1) % 7}s`,
  bottom: `${5 + (i * 6) % 25}%`,
}));

export default function Main() {
  const navigate   = useNavigate();
  const [visible,  setVisible]  = useState(false);
  const [user,     setUser]     = useState(null);
  const [modal,    setModal]    = useState(false);
  const [tab,      setTab]      = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [authErr,  setAuthErr]  = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const obtiRef    = useRef(null);
  const footerRef  = useRef(null);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Restore existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openModal(initialTab = 'signin') {
    setTab(initialTab);
    setEmail('');
    setPassword('');
    setAuthErr('');
    setModal(true);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthErr('');
    try {
      let error;
      if (tab === 'signin') {
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      } else {
        ({ error } = await supabase.auth.signUp({ email, password }));
      }
      if (error) {
        setAuthErr(tab === 'signin' ? 'Incorrect email or password.' : 'Sign up failed. Please try again.');
      } else {
        setModal(false);
        let savedGroup = 'Guardians';
        let savedAnimalEmoji = null;
        try {
          const saved = JSON.parse(localStorage.getItem('hymlSignup') || '{}');
          if (saved.group) savedGroup = saved.group;
          if (saved.animalEmoji) savedAnimalEmoji = saved.animalEmoji;
        } catch {}
        navigate('/dashboard', { state: { group: savedGroup, animalEmoji: savedAnimalEmoji } });
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function goToDashboard() {
    let savedGroup = 'Guardians';
    let savedAnimalEmoji = null;
    try {
      const saved = JSON.parse(localStorage.getItem('hymlSignup') || '{}');
      if (saved.group) savedGroup = saved.group;
      if (saved.animalEmoji) savedAnimalEmoji = saved.animalEmoji;
    } catch {}
    navigate('/dashboard', { state: { group: savedGroup, animalEmoji: savedAnimalEmoji } });
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.bubblesWrap}>
        {BUBBLE_DATA.map(b => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: b.left,
              bottom: b.bottom,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              border: '1px solid rgba(100,200,255,0.28)',
              background: 'radial-gradient(circle at 30% 30%, rgba(150,220,255,0.12), transparent)',
              animation: `bubble ${b.duration} ${b.delay} linear infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Nav ── */}
      <nav style={styles.nav}>
        <span style={styles.logo}>HYML</span>
        <div style={styles.navLinks}>
          <span style={styles.navLink} onClick={() => scrollTo(obtiRef)}>OBTI</span>

          {user ? (
            <>
              <span style={{ ...styles.navLink, color: '#90e0ef', cursor: 'default' }}>
                {displayName}
              </span>
              <span style={styles.navLink} onClick={goToDashboard}>Dashboard</span>
              <span style={styles.navLink} onClick={handleSignOut}>Log Out</span>
            </>
          ) : (
            <span style={styles.navLink} onClick={() => openModal('signin')}>Log In</span>
          )}

          <span style={styles.navLink} onClick={() => scrollTo(footerRef)}>Contact</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          ...styles.hero,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1s ease, transform 1s ease',
        }}
      >
        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Ocean-Based Type Indicator</p>
          <h1 style={styles.heroTitle}>
            What kind of<br />
            <span style={styles.accent}>ocean creature</span><br />
            are you?
          </h1>
          <p style={styles.heroSub}>
            Dive deep. Discover your ocean personality.<br />
            Join your group and protect what matters.
          </p>
          {user ? (
            <div style={styles.ctaBtnGroup}>
              <button style={styles.ctaBtn} onClick={() => navigate('/quiz')}>
                Take the Quiz &nbsp;→
              </button>
              <button style={styles.ctaBtnSecondary} onClick={goToDashboard}>
                Go to Dashboard &nbsp;→
              </button>
            </div>
          ) : (
            <button style={styles.ctaBtn} onClick={() => navigate('/quiz')}>
              Take the Quiz &nbsp;→
            </button>
          )}
          <p style={styles.ctaNote}>16 questions · 2 minutes · Free</p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.animalOrb}>
            <OceanOrbSVG />
          </div>
        </div>
      </section>

      {/* ── Depth separator ── */}
      <div style={styles.depthRow}>
        <span style={styles.depthTag}>200m</span>
        <div style={styles.depthLine} />
      </div>

      {/* ── OBTI / Groups section ── */}
      <section ref={obtiRef} style={styles.groupsSection}>
        <h2 style={styles.sectionTitle}>Discover Your Ocean Type — OBTI</h2>
        <p style={styles.sectionSub}>Four groups. One ocean. Which current do you ride?</p>
        <div style={styles.groupGrid}>
          {GROUPS.map((g, i) => (
            <div
              key={g.name}
              style={{
                ...styles.groupCard,
                animation: `slideUp 0.7s ${0.1 + i * 0.12}s ease both`,
              }}
            >
              <div style={styles.groupEmoji}>{g.emoji}</div>
              <h3 style={styles.groupName}>{g.name}</h3>
              <p style={styles.groupDesc}>{g.desc}</p>
            </div>
          ))}
        </div>
        <button style={styles.outlineBtn} onClick={() => navigate('/quiz')}>
          Test your own OBTI &nbsp;→
        </button>
      </section>

      {/* ── About ── */}
      <section style={styles.aboutSection}>
        <p style={styles.aboutLabel}>About</p>

        {[
          {
            Icon: DiscoverIconSVG,
            title: 'Discover your own OBTI',
            body: "The Ocean-Based Type Indicator maps your personality to one of 16 ocean animals through a scientifically-inspired questionnaire. Understand how you think, connect, and act.",
            flip: false,
          },
          {
            Icon: GroupIconSVG,
            title: 'Join the group and earn echo points',
            body: "Connect with people who share your ocean type. Complete real-world environmental missions, earn echo points, and climb the leaderboard while protecting our oceans.",
            flip: true,
          },
          {
            Icon: DataIconSVG,
            title: 'Real data from Scripps Institution of Oceanography',
            body: "HYML partners with CalCOFI — one of the world's longest-running ocean monitoring programs — to show you what's at stake for marine life, right now.",
            flip: false,
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              ...styles.aboutRow,
              flexDirection: item.flip ? 'row-reverse' : 'row',
            }}
          >
            <div style={styles.aboutIcon}><item.Icon /></div>
            <div style={styles.aboutText}>
              <h3 style={styles.aboutTitle}>{item.title}</h3>
              <p style={styles.aboutBody}>{item.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer ref={footerRef} style={styles.footer}>
        <p style={styles.footerMain}>
          HYML · How You Marine Life · Built for the Scripps Institution of Oceanography Challenge
        </p>
        <p style={styles.footerSub}>Data powered by CalCOFI · California Current Ecosystem</p>
        <p style={styles.footerContact}>
          Questions?&nbsp;
          <a
            href="mailto:hello@hyml.ocean"
            style={{ color: '#48cae4', textDecoration: 'none' }}
          >
            hello@hyml.ocean
          </a>
        </p>
      </footer>

      {/* ── Auth Modal ── */}
      {modal && (
        <div style={styles.modalOverlay} onClick={() => setModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>

            {tab === 'signup' ? (
              /* ── Quiz prompt (Sign Up) ── */
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '180px', height: '180px', borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, rgba(0,150,200,0.22), rgba(0,30,80,0.65))',
                    border: '1px solid rgba(72,202,228,0.22)',
                    boxShadow: '0 0 60px rgba(0,150,200,0.18), inset 0 0 40px rgba(0,100,160,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
                      <OceanOrbSVG />
                    </div>
                  </div>
                </div>
                <h3 style={{ ...styles.modalTitle, textAlign: 'center', marginBottom: '12px' }}>
                  Haven't taken the quiz yet?
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(180,220,255,0.6)', textAlign: 'center', lineHeight: 1.7, marginBottom: '32px' }}>
                  Discover your ocean personality first.<br />
                  Your result will place you in the right group —<br />
                  then you can create your account!
                </p>
                <button
                  style={{ ...styles.authBtn, width: 'fit-content', padding: '14px 32px', display: 'block', margin: '0 auto 16px' }}
                  onClick={() => { setModal(false); navigate('/quiz'); }}
                >
                  Take the Quiz →
                </button>
                <p style={styles.modalSwitch}>
                  Already have an account?{' '}
                  <span
                    style={{ color: '#48cae4', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setTab('signin'); setAuthErr(''); }}
                  >
                    Log in
                  </span>
                </p>
              </>
            ) : (
              /* ── Log In form ── */
              <>
                <h3 style={styles.modalTitle}>Welcome</h3>

                <form onSubmit={handleAuth} style={styles.modalForm}>
                  <label style={styles.inputLabel}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={styles.input}
                  />

                  <label style={styles.inputLabel}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={styles.input}
                  />

                  {authErr && <p style={styles.authError}>{authErr}</p>}

                  <button
                    type="submit"
                    disabled={authBusy}
                    style={{ ...styles.authBtn, opacity: authBusy ? 0.6 : 1 }}
                  >
                    {authBusy ? 'Please wait…' : 'Log In'}
                  </button>
                </form>

                <p style={styles.modalSwitch}>
                  Don't have an account?{' '}
                  <span
                    style={{ color: '#48cae4', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setTab('signup'); setAuthErr(''); }}
                  >
                    Sign up
                  </span>
                </p>
              </>
            )}

            <button style={styles.modalClose} onClick={() => setModal(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #020b18 0%, #041428 18%, #061e3a 40%, #082450 58%, #061e3a 78%, #041428 100%)',
    position: 'relative',
    overflow: 'hidden',
    color: '#e8f4fd',
  },
  bgGlow1: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,90,160,0.22) 0%, transparent 60%)',
    pointerEvents: 'none', zIndex: 0,
  },
  bgGlow2: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse 60% 40% at 80% 70%, rgba(0,60,120,0.12) 0%, transparent 60%)',
    pointerEvents: 'none', zIndex: 0,
  },
  bubblesWrap: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 },
  nav: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 48px',
    borderBottom: '1px solid rgba(100,180,255,0.07)',
  },
  logo: { fontSize: '20px', fontWeight: 800, letterSpacing: '5px', color: '#90e0ef' },
  navLinks: { display: 'flex', gap: '36px', alignItems: 'center' },
  navLink: {
    color: 'rgba(200,230,255,0.65)', fontSize: '13px', fontWeight: 500,
    letterSpacing: '1px', cursor: 'pointer',
    transition: 'color 0.2s',
  },
  hero: {
    position: 'relative', zIndex: 5,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '80px 48px 90px', minHeight: '82vh', gap: '40px',
  },
  heroContent: { flex: 1, maxWidth: '560px' },
  eyebrow: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '3.5px', textTransform: 'uppercase',
    color: '#48cae4', marginBottom: '20px',
  },
  heroTitle: {
    fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 800, lineHeight: 1.1,
    color: '#e8f4fd', marginBottom: '28px', letterSpacing: '-1px',
  },
  accent: {
    background: 'linear-gradient(90deg, #48cae4, #00b4d8, #0096c7)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  heroSub: {
    fontSize: '17px', lineHeight: 1.75, color: 'rgba(200,230,255,0.72)', marginBottom: '44px',
  },
  ctaBtn: {
    display: 'block', padding: '17px 42px',
    background: 'linear-gradient(135deg, #0096c7, #00b4d8)',
    color: '#fff', border: 'none', borderRadius: '50px',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
    boxShadow: '0 8px 30px rgba(0,150,200,0.38)',
    animation: 'pulse 3s ease-in-out infinite', marginBottom: '14px',
  },
  ctaBtnGroup: {
    display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '0px',
  },
  ctaBtnSecondary: {
    display: 'block', padding: '15px 42px',
    background: 'transparent',
    color: '#48cae4', border: '1.5px solid rgba(72,202,228,0.45)', borderRadius: '50px',
    fontSize: '15px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
    transition: 'border-color 0.2s, background 0.2s',
    marginBottom: '14px',
  },
  ctaNote: { fontSize: '12px', color: 'rgba(180,210,240,0.45)', letterSpacing: '0.5px', marginTop: '12px' },
  heroRight: {
    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
    animation: 'floatSlow 6s ease-in-out infinite',
  },
  animalOrb: {
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(0,150,200,0.22), rgba(0,30,80,0.65))',
    border: '1px solid rgba(72,202,228,0.22)',
    boxShadow: '0 0 80px rgba(0,150,200,0.18), inset 0 0 60px rgba(0,100,160,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  orbEmoji: { fontSize: '110px', filter: 'drop-shadow(0 0 28px rgba(72,202,228,0.45))' },
  depthRow: {
    position: 'relative', zIndex: 5,
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '0 48px', marginBottom: '80px',
  },
  depthTag: { fontSize: '10px', color: 'rgba(100,180,220,0.35)', letterSpacing: '2px', whiteSpace: 'nowrap' },
  depthLine: { flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(72,202,228,0.25), transparent)' },
  groupsSection: {
    position: 'relative', zIndex: 5, padding: '0 48px 90px',
    textAlign: 'center', scrollMarginTop: '80px',
  },
  sectionTitle: {
    fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 700, color: '#e8f4fd', marginBottom: '12px',
  },
  sectionSub: { fontSize: '15px', color: 'rgba(180,220,255,0.55)', marginBottom: '52px' },
  groupGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '22px', maxWidth: '920px', margin: '0 auto 44px',
  },
  groupCard: {
    background: 'linear-gradient(145deg, rgba(10,30,70,0.75), rgba(5,18,45,0.9))',
    border: '1px solid rgba(72,202,228,0.13)', borderRadius: '20px',
    padding: '34px 22px', textAlign: 'center',
    transition: 'transform 0.22s, border-color 0.22s',
  },
  groupEmoji: { fontSize: '50px', marginBottom: '14px', filter: 'drop-shadow(0 0 10px rgba(72,202,228,0.28))' },
  groupName: { fontSize: '17px', fontWeight: 700, color: '#90e0ef', marginBottom: '10px', letterSpacing: '1px' },
  groupDesc: { fontSize: '13px', color: 'rgba(180,220,255,0.6)', lineHeight: 1.65 },
  outlineBtn: {
    display: 'inline-flex', alignItems: 'center', padding: '13px 34px',
    background: 'transparent', color: '#48cae4',
    border: '1.5px solid rgba(72,202,228,0.45)', borderRadius: '50px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px',
  },
  aboutSection: {
    position: 'relative', zIndex: 5, padding: '60px 48px 90px',
    maxWidth: '780px', margin: '0 auto',
  },
  aboutLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase',
    color: 'rgba(100,180,220,0.45)', marginBottom: '52px',
  },
  aboutRow: {
    display: 'flex', alignItems: 'flex-start', gap: '28px', marginBottom: '56px',
    animation: 'fadeIn 1s ease both',
  },
  aboutIcon: {
    fontSize: '36px', flexShrink: 0, width: '60px', height: '60px',
    background: 'rgba(10,28,65,0.8)', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(72,202,228,0.12)',
  },
  aboutText: { flex: 1 },
  aboutTitle: { fontSize: '19px', fontWeight: 700, color: '#e8f4fd', marginBottom: '10px' },
  aboutBody: { fontSize: '14px', color: 'rgba(180,220,255,0.62)', lineHeight: 1.72 },
  footer: {
    position: 'relative', zIndex: 5, textAlign: 'center',
    padding: '38px 48px', borderTop: '1px solid rgba(72,202,228,0.07)',
    scrollMarginTop: '80px',
  },
  footerMain: { fontSize: '12px', color: 'rgba(150,200,230,0.38)', marginBottom: '6px', letterSpacing: '0.5px' },
  footerSub:  { fontSize: '11px', color: 'rgba(100,160,200,0.28)', letterSpacing: '0.5px', marginBottom: '10px' },
  footerContact: { fontSize: '12px', color: 'rgba(150,200,230,0.45)' },

  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(2,8,20,0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  modalCard: {
    position: 'relative',
    background: 'linear-gradient(145deg, #0a1e4a, #050f28)',
    border: '1px solid rgba(72,202,228,0.2)',
    borderRadius: '24px',
    padding: '44px 48px 36px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
  },
  modalTabs: {
    display: 'flex', gap: '4px',
    background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
    padding: '4px', marginBottom: '28px',
  },
  modalTab: {
    flex: 1, padding: '9px 0',
    background: 'transparent', border: 'none',
    borderRadius: '9px', color: 'rgba(200,230,255,0.45)',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalTabActive: {
    background: 'rgba(72,202,228,0.15)',
    color: '#90e0ef',
  },
  modalTitle: {
    fontSize: '22px', fontWeight: 800, color: '#e8f4fd', marginBottom: '32px',
  },
  modalSub: {
    fontSize: '13px', color: 'rgba(180,220,255,0.55)', lineHeight: 1.6, marginBottom: '28px',
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { fontSize: '12px', fontWeight: 600, color: 'rgba(150,200,240,0.6)', letterSpacing: '0.5px' },
  input: {
    padding: '12px 16px', marginBottom: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(72,202,228,0.2)', borderRadius: '10px',
    color: '#e8f4fd', fontSize: '15px', outline: 'none',
    transition: 'border-color 0.2s',
  },
  authError: {
    fontSize: '13px', color: '#f87171', marginBottom: '8px', lineHeight: 1.5,
  },
  authBtn: {
    marginTop: '4px', padding: '14px',
    background: 'linear-gradient(135deg, #0096c7, #00b4d8)',
    border: 'none', borderRadius: '12px',
    color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  modalSwitch: {
    textAlign: 'center', marginTop: '20px',
    fontSize: '13px', color: 'rgba(180,220,255,0.45)',
  },
  modalClose: {
    position: 'absolute', top: '16px', right: '18px',
    background: 'none', border: 'none',
    color: 'rgba(200,230,255,0.35)', fontSize: '18px', cursor: 'pointer',
    lineHeight: 1,
  },
};
