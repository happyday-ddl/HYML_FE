import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserMissions } from '../api';
import { supabase } from '../supabase';
import {
  ARGOVIS_URL,
  FALLBACK_FLOATS,
  processProfiles,
  FloatMap,
  DepthProfile,
} from '../argoShared';

// re-use same GROUP_META keys as Dashboard

const GROUP_META = {
  Hunters:   { emoji: '🦈', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   glow: 'rgba(239,68,68,0.18)' },
  Wanderers: { emoji: '🐢', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)',   glow: 'rgba(6,182,212,0.18)' },
  Guardians: { emoji: '🐬', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  glow: 'rgba(16,185,129,0.18)' },
  Builders:  { emoji: '🦀', color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  glow: 'rgba(249,115,22,0.18)' },
};

const TYPE_META = {
  Recycling:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '♻️' },
  Cleanup:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: '🧹' },
  Research:   { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: '🔬' },
  Education:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '📚' },
  Community:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🤝' },
};

function IconMissions() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

function IconLeaderboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="12" width="6" height="10" rx="1"/>
      <rect x="9" y="7" width="6" height="15" rx="1"/>
      <rect x="16" y="3" width="6" height="19" rx="1"/>
    </svg>
  );
}

function IconAttend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export default function MyPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const _saved = (() => { try { return JSON.parse(localStorage.getItem('hymlSignup') || '{}'); } catch { return {}; } })();
  const group       = location.state?.group       || _saved.group       || 'Guardians';
  const animalEmoji = location.state?.animalEmoji || _saved.animalEmoji || null;
  // Quiz result details from localStorage
  const animalName      = _saved.animal      || null;
  const animalNick      = _saved.nickname    || null;
  const animalDesc      = _saved.description || null;
  const animalPara      = _saved.parallels   || null;
  const animalStrengths = Array.isArray(_saved.strengths) ? _saved.strengths : [];
  const hasResult       = !!(animalName && animalDesc);

  const meta = GROUP_META[group] || GROUP_META.Guardians;

  const [missions, setMissions] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Argo float data
  const argoRef = useRef(null);
  const [argoFloats,  setArgoFloats]  = useState(null);
  const [argoStatus,  setArgoStatus]  = useState('loading'); // 'loading'|'live'|'fallback'
  const [argoVisible, setArgoVisible] = useState(false);
  const [argoSelected, setArgoSelected] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || location.state?.userId || null;
        const data = await getUserMissions(uid);
        const list = data?.data || data?.missions || (Array.isArray(data) ? data : null);
        setMissions(list?.filter(m => m.attended) || []);
      } catch {
        setMissions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch Argo float data
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    (async () => {
      try {
        const res = await fetch(ARGOVIS_URL, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('non-200');
        const raw = await res.json();
        const parsed = processProfiles(raw);
        if (!cancelled && parsed.length > 0) {
          setArgoFloats(parsed);
          setArgoStatus('live');
          return;
        }
        throw new Error('empty');
      } catch {
        clearTimeout(timer);
        if (!cancelled) {
          setArgoFloats(FALLBACK_FLOATS);
          setArgoStatus('fallback');
        }
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, []);

  // Trigger Argo animations on scroll into view
  useEffect(() => {
    const el = argoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setArgoVisible(true); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const displayMissions = missions || [];
  const totalPoints = displayMissions.reduce((sum, m) => sum + (m.points || 0), 0);

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 ${meta.glow}; }
          50%       { box-shadow: 0 0 0 12px transparent; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes argoRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0;   }
        }
        @keyframes argoBlink {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.6; }
        }
      `}</style>

      <div style={styles.bgGlow} />

      {/* ── Sidebar ── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo} onClick={() => navigate('/')}>HYML</div>
        <div style={styles.sidebarGroup}>
          <div style={{ ...styles.groupOrb, background: meta.bg, borderColor: meta.border }}>
            <span style={{ fontSize: '28px' }}>{animalEmoji || meta.emoji}</span>
          </div>
          <div>
            <p style={styles.sidebarGroupName}>{group}</p>
            <p style={styles.sidebarGroupLabel}>Your Group</p>
          </div>
        </div>
        <nav style={styles.sidebarNav}>
          {[
            { label: 'Missions',     icon: <IconMissions />,    path: '/dashboard' },
            { label: 'Leaderboard',  icon: <IconLeaderboard />, path: '/dashboard' },
            { label: 'Attend Event', icon: <IconAttend />,      path: '/dashboard' },
          ].map(item => (
            <button
              key={item.label}
              style={{
                ...styles.navItem,
                background: 'transparent',
                color: 'rgba(200,230,255,0.55)',
                borderLeft: '2px solid transparent',
              }}
              onClick={() => navigate(item.path, { state: { group, animalEmoji } })}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button style={styles.logoutBtn} onClick={() => navigate('/')}>↩ Log Out</button>
      </div>

      {/* ── Main ── */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.mainHeader}>
          <div>
            <h1 style={styles.mainTitle}>My Profile</h1>
            <p style={styles.mainSub}>Your verified missions and personal echo points</p>
          </div>

        </div>

        <div style={styles.twoCol}>
          {/* ── LEFT: Missions ── */}
          <div style={styles.content}>
          {/* ── Profile card ── */}
          <div style={{ ...styles.profileCard, borderColor: meta.border, animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ ...styles.avatarOrb, background: meta.bg, borderColor: meta.border, animation: 'pulseRing 3s ease infinite' }}>
              <span style={styles.avatarEmoji}>{animalEmoji || meta.emoji}</span>
            </div>
            <div style={styles.profileInfo}>
              <div style={{ ...styles.groupTag, background: meta.bg, borderColor: meta.border, color: meta.color }}>
                {meta.emoji} {group}
              </div>
              <p style={styles.profileSub}>Echo Contributor</p>
            </div>
            <div style={{ ...styles.pointsBox, borderColor: meta.border, animation: 'countUp 0.6s 0.2s ease both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={styles.pointsLabel}>Personal Echo Points</p>
              <p style={{ ...styles.pointsValue, color: meta.color }}>{totalPoints.toLocaleString()}</p>
              <p style={styles.pointsMeta}>{displayMissions.length} verified mission{displayMissions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* ── Section header ── */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Completed Missions</h2>
            <span style={{ ...styles.missionCount, background: meta.bg, borderColor: meta.border, color: meta.color }}>
              {displayMissions.length}
            </span>
          </div>

          {/* ── Mission list ── */}
          {loading ? (
            <div style={styles.loadingWrap}>
              <div style={{ ...styles.loadingDot, background: meta.color }} />
              <div style={{ ...styles.loadingDot, background: meta.color, animationDelay: '0.2s' }} />
              <div style={{ ...styles.loadingDot, background: meta.color, animationDelay: '0.4s' }} />
            </div>
          ) : displayMissions.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No verified missions yet.</p>
              <p style={styles.emptySub}>Attend an event and get verified to earn echo points.</p>
            </div>
          ) : (
            <div style={styles.missionList}>
              {displayMissions.map((m, i) => {
                const typeMeta = TYPE_META[m.type] || TYPE_META.Community;
                return (
                  <div
                    key={m.id || i}
                    style={{
                      ...styles.missionCard,
                      animation: `fadeUp 0.45s ${0.1 + i * 0.07}s ease both`,
                      opacity: 0,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div style={{ ...styles.typeIcon, background: typeMeta.bg, color: typeMeta.color }}>
                      <span style={{ fontSize: '18px' }}>{typeMeta.icon}</span>
                    </div>
                    <div style={styles.missionInfo}>
                      <p style={styles.missionTitle}>{m.title}</p>
                      <p style={styles.missionOrg}>{m.location || m.description || ''}</p>
                      <div style={styles.missionMeta}>
                        <span style={{ ...styles.typePill, background: typeMeta.bg, color: typeMeta.color }}>
                          {m.type || 'Community'}
                        </span>
                        <span style={styles.missionDate}>{m.event_date ? new Date(m.event_date).toLocaleDateString('en-US') : ''}</span>
                      </div>
                    </div>
                    <div style={styles.missionRight}>
                      <span style={{ ...styles.pointsBadge, background: meta.bg, color: meta.color, borderColor: meta.border }}>
                        +{m.points}
                      </span>
                      <span style={styles.verifiedTag}>✓ verified</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>{/* end left col */}

          {/* ── RIGHT: Quiz Result ── */}
          <div style={styles.resultPanel}>
            {hasResult ? (
              <>
                {/* Animal hero */}
                <div style={{ ...styles.resultHero, borderColor: meta.border, animation: 'fadeUp 0.5s 0.1s ease both' }}>
                  <div style={{ ...styles.resultOrb, borderColor: meta.border, background: `radial-gradient(circle at 35% 35%, ${meta.bg}, rgba(0,10,30,0.7))` }}>
                    <span style={{ fontSize: '52px', lineHeight: 1 }}>{animalEmoji || meta.emoji}</span>
                  </div>
                  <div style={styles.resultHeroText}>
                    <p style={{ ...styles.resultAnimalName, color: meta.color }}>{animalName}</p>
                    {animalNick && <p style={styles.resultNickname}>"{animalNick}"</p>}
                    <span style={{ ...styles.resultGroupTag, background: meta.bg, borderColor: meta.border, color: meta.color }}>{meta.emoji} {group}</span>
                  </div>
                </div>

                {/* Strengths */}
                {animalStrengths.length > 0 && (
                  <div style={{ ...styles.resultSection, animation: 'fadeUp 0.5s 0.2s ease both' }}>
                    <p style={styles.resultSectionLabel}>Core Strengths</p>
                    <div style={styles.strengthsRow}>
                      {animalStrengths.map(s => (
                        <span key={s} style={{ ...styles.strengthPill, background: meta.bg, borderColor: meta.border, color: meta.color }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {animalDesc && (
                  <div style={{ ...styles.resultSection, animation: 'fadeUp 0.5s 0.3s ease both' }}>
                    <p style={styles.resultSectionLabel}>Your Personality</p>
                    <p style={styles.resultBody}>{animalDesc}</p>
                  </div>
                )}

                {/* Parallels */}
                {animalPara && (
                  <div style={{ ...styles.resultSection, animation: 'fadeUp 0.5s 0.4s ease both', borderBottom: 'none' }}>
                    <p style={styles.resultSectionLabel}>In the Wild</p>
                    <p style={styles.resultBody}>{animalPara}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.resultEmpty}>
                <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>🔬</span>
                <p style={styles.resultEmptyTitle}>No quiz result yet</p>
                <p style={styles.resultEmptySub}>Take the OBTI quiz to see your ocean personality here.</p>
                <button
                  style={{ ...styles.resultQuizBtn, background: meta.bg, borderColor: meta.border, color: meta.color }}
                  onClick={() => navigate('/quiz')}
                >
                  Take the Quiz →
                </button>
              </div>
            )}
          </div>{/* end right col */}
        </div>{/* end twoCol */}

        {/* ── Argo Float Data (full width) ── */}
        <div style={styles.argoSection} ref={argoRef}>
          {/* Header */}
          <div style={styles.argoHeader}>
            <p style={styles.argoEyebrow}>
              {argoStatus === 'loading' && '⏳ Connecting to Argovis…'}
              {argoStatus === 'live'    && '🟢 Live · Argovis API · Colorado / Scripps'}
              {argoStatus === 'fallback'&& '📡 Argo Float Data · January 2020'}
            </p>
            <h2 style={styles.argoTitle}>Argo Floats Are Watching</h2>
            <p style={styles.argoSub}>
              Right now, autonomous robotic floats drift through the California Current —
              diving, measuring, surfacing — transmitting ocean temperature from depths
              you'll never see. This is{' '}
              <span style={{ color: '#48cae4', fontWeight: 700 }}>
                {argoStatus === 'live' ? 'live data' : 'real Argo data'}
              </span>{' '}
              from the region that shapes your ocean type.
            </p>
          </div>

          {/* Map */}
          <div style={styles.argoMapWrap}>
            <p style={styles.argoMapLabel}>California Current · 20°N–40°N · 110°W–130°W</p>
            <FloatMap
              floats={argoFloats || []}
              visible={argoVisible}
              selected={argoSelected}
              onSelect={setArgoSelected}
              groupColor={meta.color}
            />
            <div style={styles.argoLegend}>
              {[['< 15°C','#0077b6'],['15–17°C','#00b4d8'],['17–19°C','#f9c74f'],['> 19°C','#ef4444']].map(([label, col]) => (
                <div key={label} style={styles.argoLegendItem}>
                  <div style={{ ...styles.argoLegendDot, background: col }} />
                  <span style={styles.argoLegendLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {argoFloats && (() => {
            const withSST = argoFloats.filter(f => f.sst != null);
            const avgSST = withSST.length ? (withSST.reduce((s,f) => s+f.sst, 0)/withSST.length).toFixed(1) : '--';
            const minSST = withSST.length ? Math.min(...withSST.map(f=>f.sst)).toFixed(1) : '--';
            const maxSST = withSST.length ? Math.max(...withSST.map(f=>f.sst)).toFixed(1) : '--';
            return (
              <div style={styles.argoStatsRow}>
                {[
                  { val: argoFloats.length, label: 'Argo floats in this region', color: '#48cae4' },
                  { val: `${avgSST}°C`,     label: 'Avg sea surface temperature', color: '#f9c74f' },
                  { val: `${minSST}°–${maxSST}°C`, label: 'Surface temp range across floats', color: '#10b981' },
                  { val: '2000m',           label: 'Max depth each float dives',  color: '#8b5cf6' },
                ].map(({ val, label, color }) => (
                  <div key={label} style={styles.argoStatCard}>
                    <span style={{ ...styles.argoStatNum, color }}>{val}</span>
                    <span style={styles.argoStatLabel}>{label}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Depth Profile */}
          {argoFloats && (() => {
            const profileFloat = argoFloats.reduce(
              (best, f) => (f.profile.length > (best?.profile.length ?? 0) ? f : best), null
            );
            if (!profileFloat || profileFloat.profile.length < 3) return null;
            return (
              <div style={styles.argoProfileWrap}>
                <h3 style={styles.argoProfileTitle}>
                  Temperature vs Depth —{' '}
                  <span style={{ color: '#48cae4', fontFamily: 'monospace' }}>
                    {String(profileFloat.id).slice(0, 12)}
                  </span>
                </h3>
                <p style={styles.argoProfileSub}>
                  Each Argo float sinks to 2000 m, drifts for 10 days, then rises while
                  measuring temperature at every depth.{' '}
                  {argoStatus === 'live' ? 'Live data from this float.' : 'Representative of a real California Current float.'}
                </p>
                <DepthProfile profile={profileFloat.profile} visible={argoVisible} />
              </div>
            );
          })()}

          {/* Attribution */}
          <div style={styles.argoAttr}>
            <p style={styles.argoAttrText}>
              Data from{' '}
              <strong style={{ color: '#90e0ef' }}>Scripps Institution of Oceanography</strong>{' '}
              via the <strong style={{ color: '#90e0ef' }}>Argo Program</strong> · Powered by{' '}
              <span style={{ color: '#48cae4' }}>Argovis</span> (argovis-api.colorado.edu) ·
              EasyOneArgo dataset · Jan 2020 · California Current region
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #061e3a 100%)',
    color: '#e8f4fd',
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: 'flex',
    position: 'relative',
  },
  bgGlow: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0,70,140,0.18) 0%, transparent 60%)',
    pointerEvents: 'none',
  },

  /* Sidebar — identical to Dashboard */
  sidebar: {
    width: '220px',
    flexShrink: 0,
    borderRight: '1px solid rgba(72,202,228,0.08)',
    padding: '28px 0',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    background: 'rgba(2,10,25,0.6)',
    backdropFilter: 'blur(10px)',
    zIndex: 20,
  },
  sidebarLogo: {
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '5px',
    color: '#90e0ef',
    padding: '0 24px 28px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(72,202,228,0.06)',
    marginBottom: '20px',
  },
  sidebarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 20px 20px',
    marginBottom: '8px',
  },
  groupOrb: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sidebarGroupName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#e8f4fd',
    marginBottom: '2px',
  },
  sidebarGroupLabel: {
    fontSize: '11px',
    color: 'rgba(180,220,255,0.4)',
    letterSpacing: '0.5px',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '0 8px',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  logoutBtn: {
    margin: '20px 12px 0',
    padding: '10px 16px',
    background: 'transparent',
    border: '1px solid rgba(72,202,228,0.12)',
    borderRadius: '10px',
    color: 'rgba(180,220,255,0.4)',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
  },

  /* Main area */
  main: {
    flex: 1,
    padding: '40px 48px',
    overflow: 'auto',
    position: 'relative',
    zIndex: 5,
  },
  mainHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '36px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  mainTitle: {
    fontSize: 'clamp(24px, 3vw, 36px)',
    fontWeight: 800,
    color: '#e8f4fd',
    marginBottom: '8px',
  },
  mainSub: {
    fontSize: '14px',
    color: 'rgba(144,200,230,0.55)',
    margin: 0,
  },
  myGroupBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 700,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },

  /* Two-column layout */
  twoCol: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
  },

  /* Right panel — quiz result */
  resultPanel: {
    width: '340px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    background: 'rgba(8,20,50,0.55)',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '20px',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: '0px',
  },
  resultHero: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '22px 20px',
    borderBottom: '1px solid rgba(72,202,228,0.08)',
    background: 'rgba(0,20,50,0.4)',
  },
  resultOrb: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultHeroText: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  resultAnimalName: {
    fontSize: '17px',
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.2,
  },
  resultNickname: {
    fontSize: '12px',
    color: 'rgba(144,200,230,0.55)',
    margin: 0,
    fontStyle: 'italic',
  },
  resultGroupTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '20px',
    border: '1px solid',
    width: 'fit-content',
  },
  resultSection: {
    padding: '18px 20px',
    borderBottom: '1px solid rgba(72,202,228,0.07)',
  },
  resultSectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(144,200,230,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: '0 0 10px',
  },
  resultBody: {
    fontSize: '13px',
    color: 'rgba(200,230,255,0.75)',
    lineHeight: 1.65,
    margin: 0,
  },
  strengthsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  strengthPill: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 11px',
    borderRadius: '20px',
    border: '1px solid',
  },
  resultEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  resultEmptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'rgba(200,230,255,0.7)',
    margin: '0 0 8px',
  },
  resultEmptySub: {
    fontSize: '13px',
    color: 'rgba(144,200,230,0.45)',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  resultQuizBtn: {
    padding: '10px 20px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    background: 'transparent',
  },

  /* ── Argo section ── */
  argoSection: {
    marginTop: '48px',
    background: 'rgba(8,20,50,0.5)',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '24px',
    padding: '36px',
    backdropFilter: 'blur(10px)',
  },
  argoHeader: {
    marginBottom: '28px',
  },
  argoEyebrow: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'rgba(144,200,230,0.5)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },
  argoTitle: {
    fontSize: 'clamp(20px, 2.5vw, 28px)',
    fontWeight: 800,
    color: '#e8f4fd',
    margin: '0 0 10px',
  },
  argoSub: {
    fontSize: '14px',
    color: 'rgba(200,230,255,0.65)',
    lineHeight: 1.65,
    margin: 0,
    maxWidth: '680px',
  },
  argoMapWrap: {
    marginBottom: '28px',
  },
  argoMapLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(144,200,230,0.4)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  argoLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '12px',
  },
  argoLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  argoLegendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  argoLegendLabel: {
    fontSize: '12px',
    color: 'rgba(180,220,255,0.5)',
  },
  argoStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '28px',
  },
  argoStatCard: {
    background: 'rgba(0,20,50,0.5)',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  argoStatNum: {
    fontSize: '24px',
    fontWeight: 800,
    lineHeight: 1,
  },
  argoStatLabel: {
    fontSize: '12px',
    color: 'rgba(144,200,230,0.5)',
    lineHeight: 1.4,
  },
  argoProfileWrap: {
    marginBottom: '28px',
  },
  argoProfileTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#cce8f4',
    margin: '0 0 8px',
  },
  argoProfileSub: {
    fontSize: '13px',
    color: 'rgba(144,200,230,0.5)',
    margin: '0 0 16px',
    lineHeight: 1.5,
  },
  argoAttr: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(72,202,228,0.08)',
  },
  argoAttrText: {
    fontSize: '12px',
    color: 'rgba(144,200,230,0.4)',
    lineHeight: 1.6,
    margin: 0,
  },

  /* Profile card */
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'rgba(8,20,50,0.6)',
    border: '1px solid',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '36px',
    backdropFilter: 'blur(10px)',
    flexWrap: 'wrap',
  },
  avatarOrb: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: '36px', lineHeight: 1 },
  profileInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  groupTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid',
    width: 'fit-content',
  },
  profileSub: {
    fontSize: '13px',
    color: 'rgba(144,224,239,0.5)',
    margin: 0,
  },
  pointsBox: {
    textAlign: 'center',
    background: 'rgba(0,20,50,0.5)',
    border: '1px solid',
    borderRadius: '14px',
    padding: '14px 24px',
    minWidth: '140px',
  },
  pointsLabel: {
    fontSize: '11px',
    color: 'rgba(144,224,239,0.5)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: '0 0 6px',
  },
  pointsValue: {
    fontSize: '32px',
    fontWeight: 800,
    margin: '0 0 4px',
    lineHeight: 1,
  },
  pointsMeta: {
    fontSize: '12px',
    color: 'rgba(144,224,239,0.45)',
    margin: 0,
  },

  /* Section header */
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#90e0ef',
    margin: 0,
  },
  missionCount: {
    fontSize: '12px',
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: '12px',
    border: '1px solid',
  },

  /* Mission list */
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  missionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(8,20,50,0.55)',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '14px',
    padding: '16px 18px',
    backdropFilter: 'blur(8px)',
  },
  typeIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  missionInfo: { flex: 1, minWidth: 0 },
  missionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#cce8f4',
    margin: '0 0 3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  missionOrg: {
    fontSize: '12px',
    color: 'rgba(144,200,230,0.5)',
    margin: '0 0 6px',
  },
  missionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typePill: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '8px',
  },
  missionDate: {
    fontSize: '11px',
    color: 'rgba(144,200,230,0.4)',
  },
  missionRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    flexShrink: 0,
  },
  pointsBadge: {
    fontSize: '14px',
    fontWeight: 800,
    padding: '4px 12px',
    borderRadius: '10px',
    border: '1px solid',
  },
  verifiedTag: {
    fontSize: '11px',
    color: '#34d399',
    fontWeight: 600,
  },

  /* Loading */
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '60px 0',
  },
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'fadeUp 0.6s ease infinite alternate',
  },

  /* Empty state */
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'rgba(144,224,239,0.7)',
    margin: 0,
  },
  emptySub: {
    fontSize: '13px',
    color: 'rgba(144,224,239,0.4)',
    margin: 0,
  },
};
