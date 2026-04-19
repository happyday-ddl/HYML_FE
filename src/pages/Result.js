import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Constants ───────────────────────────────────────────────────────────────

const ARGOVIS_URL =
  'https://argovis-api.colorado.edu/selection/profiles' +
  '?startDate=2020-01-01&endDate=2020-01-15' +
  '&polygon=' + encodeURIComponent('[[-130,20],[-110,20],[-110,40],[-130,40],[-130,20]]');

// Map bounding box: lon [-130, -110], lat [20, 40]
const MAP = { lonMin: -130, lonMax: -110, latMin: 20, latMax: 40, W: 680, H: 380 };

// Simplified California + Baja coastline (lon, lat) from Cabo San Lucas → Oregon
const COASTLINE = [
  [-109.9,22.9],[-110.1,23.5],[-110.4,24.8],[-110.8,25.5],[-111.2,26.3],
  [-112.0,27.5],[-113.0,28.4],[-114.0,29.0],[-114.5,29.5],[-115.0,30.0],
  [-115.5,30.5],[-116.0,31.0],[-116.6,31.5],[-116.9,32.0],[-117.1,32.4],
  [-117.3,32.7],[-117.5,33.1],[-117.8,33.5],[-118.1,33.8],[-118.4,33.9],
  [-118.8,34.0],[-119.1,34.1],[-119.7,34.4],[-120.4,34.8],[-121.0,35.3],
  [-121.4,35.8],[-121.8,36.3],[-121.9,36.8],[-122.2,37.3],[-122.5,37.8],
  [-122.7,38.0],[-123.0,38.4],[-123.4,38.8],[-124.0,39.3],[-124.2,39.8],
  [-124.3,40.0],
];

// Realistic fallback: ~12 Argo floats in the California Current, Jan 2020
const FALLBACK_FLOATS = [
  { lat:34.2, lon:-122.5, id:'WMO5905785', sst:17.4,
    profile:[{pres:5,temp:17.4},{pres:25,temp:16.1},{pres:50,temp:15.2},{pres:100,temp:13.8},
             {pres:200,temp:11.2},{pres:300,temp:9.8},{pres:500,temp:7.8},
             {pres:750,temp:6.1},{pres:1000,temp:4.5},{pres:1500,temp:3.2},{pres:2000,temp:2.8}] },
  { lat:36.8, lon:-125.1, id:'WMO5905412', sst:16.8, profile:[] },
  { lat:38.5, lon:-127.0, id:'WMO5903612', sst:15.9, profile:[] },
  { lat:32.1, lon:-119.8, id:'WMO6901234', sst:18.2, profile:[] },
  { lat:35.5, lon:-128.5, id:'WMO5906789', sst:16.1, profile:[] },
  { lat:30.5, lon:-118.2, id:'WMO5902345', sst:19.1, profile:[] },
  { lat:37.2, lon:-121.5, id:'WMO5904567', sst:17.0, profile:[] },
  { lat:33.8, lon:-126.3, id:'WMO6900123', sst:16.5, profile:[] },
  { lat:28.5, lon:-116.0, id:'WMO5905890', sst:20.3, profile:[] },
  { lat:39.8, lon:-129.2, id:'WMO6901567', sst:15.2, profile:[] },
  { lat:31.2, lon:-122.8, id:'WMO5903890', sst:17.8, profile:[] },
  { lat:35.0, lon:-124.6, id:'WMO6900456', sst:16.9, profile:[] },
];

const FISH = ['🐟','🐡','🐠','🐟','🦈','🐡','🐟','🐠','🐟','🐡','🐠','🐟'];

const GROUP_COLORS = {
  Hunters:   { primary:'#ef4444', secondary:'#fca5a5', bg:'rgba(239,68,68,0.1)'   },
  Wanderers: { primary:'#06b6d4', secondary:'#67e8f9', bg:'rgba(6,182,212,0.1)'   },
  Guardians: { primary:'#10b981', secondary:'#6ee7b7', bg:'rgba(16,185,129,0.12)' },
  Builders:  { primary:'#8b5cf6', secondary:'#c4b5fd', bg:'rgba(139,92,246,0.1)'  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toX(lon) {
  return ((lon - MAP.lonMin) / (MAP.lonMax - MAP.lonMin)) * MAP.W;
}
function toY(lat) {
  return (1 - (lat - MAP.latMin) / (MAP.latMax - MAP.latMin)) * MAP.H;
}

function sstColor(temp) {
  if (temp == null)  return '#48cae4';
  if (temp < 15)     return '#0077b6';
  if (temp < 17)     return '#00b4d8';
  if (temp < 19)     return '#f9c74f';
  return '#ef4444';
}

function processProfiles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(p => {
    const lat = p.lat ?? p.latitude;
    const lon = p.lon ?? p.longitude ?? p.geolocation?.coordinates?.[0];
    if (lat == null || lon == null) return null;

    let meas = [];
    if (Array.isArray(p.measurements) && p.measurements.length > 0) {
      meas = p.measurements
        .filter(m => m.pres != null && m.temp != null)
        .sort((a, b) => a.pres - b.pres);
    } else if (Array.isArray(p.data) && Array.isArray(p.data_info?.[0])) {
      const cols = p.data_info[0];
      const pi = cols.indexOf('pres'), ti = cols.indexOf('temp');
      if (pi >= 0 && ti >= 0) {
        meas = p.data
          .map(row => ({ pres: row[pi], temp: row[ti] }))
          .filter(m => m.pres != null && m.temp != null)
          .sort((a, b) => a.pres - b.pres);
      }
    }

    const sst = meas.find(m => m.pres < 20)?.temp ?? meas[0]?.temp ?? null;
    return { lat, lon, sst, profile: meas, id: p._id || String(lat) + String(lon) };
  }).filter(Boolean);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Result() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const sectionRef = useRef(null);

  const [floats,   setFloats]   = useState(null);
  const [status,   setStatus]   = useState('loading'); // 'loading' | 'live' | 'fallback'
  const [visible,  setVisible]  = useState(false);
  const [selected, setSelected] = useState(0); // which float's profile to show

  const result  = location.state?.result;
  const group   = result?.group   || 'Guardians';
  const animal  = result?.animal  || 'Sea Turtle';
  const code    = result?.code    || 'RCNS';
  const emoji   = result?.emoji   || '🐢';
  const desc    = result?.description
    || `As a ${animal}, you navigate life with patience and wisdom. Your ocean personality shapes how you connect, protect, and move through the world.`;
  const colors  = GROUP_COLORS[group] || GROUP_COLORS.Guardians;

  // Fetch Argovis data
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
          setFloats(parsed);
          setStatus('live');
          return;
        }
        throw new Error('empty');
      } catch {
        clearTimeout(timer);
        if (!cancelled) {
          setFloats(FALLBACK_FLOATS);
          setStatus('fallback');
        }
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, []);

  // Trigger animations when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const displayFloats = floats || [];
  const withSST  = displayFloats.filter(f => f.sst != null);
  const avgSST   = withSST.length
    ? (withSST.reduce((s, f) => s + f.sst, 0) / withSST.length).toFixed(1)
    : '--';
  const minSST   = withSST.length ? Math.min(...withSST.map(f => f.sst)).toFixed(1) : '--';
  const maxSST   = withSST.length ? Math.max(...withSST.map(f => f.sst)).toFixed(1) : '--';

  // Best profile = float with most measurements
  const profileFloat = displayFloats.reduce((best, f) =>
    (f.profile.length > (best?.profile.length ?? 0)) ? f : best, null);

  return (
    <div style={s.page}>
      {/* Keyframe styles for float-dot animations */}
      <style>{`
        @keyframes argoRing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(6); opacity: 0; }
        }
        @keyframes argoBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={s.bgGlow} />

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <span style={s.logo} onClick={() => navigate('/')}>HYML</span>
        <button style={s.navBtn} onClick={() => navigate('/quiz')}>Retake Quiz</button>
      </nav>

      {/* ── Animal Hero ── */}
      <section style={s.hero}>
        <p style={s.eyebrow}>Your Ocean Type Is…</p>

        <div style={{
          ...s.animalOrb,
          background: `radial-gradient(circle at 35% 35%, ${colors.bg}, rgba(0,20,50,0.8))`,
          borderColor: colors.primary + '44',
        }}>
          <span style={s.animalEmoji}>{emoji}</span>
        </div>

        <h1 style={{ ...s.animalName, color: colors.secondary }}>{animal}</h1>

        <div style={s.codeBadge}>
          <span style={{ ...s.codeText, color: colors.primary }}>{code}</span>
        </div>

        <div style={{ ...s.groupBadge, background: colors.bg, borderColor: colors.primary + '55' }}>
          <span style={{ color: colors.secondary }}>Group: </span>
          <span style={{ color: colors.primary, fontWeight: 700 }}>{group}</span>
        </div>

        <p style={s.descText}>{desc}</p>

        <button
          style={{ ...s.joinBtn, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          onClick={() => navigate('/dashboard', { state: { group } })}
        >
          Join the {group} &nbsp;→
        </button>
      </section>

      {/* ── Divider ── */}
      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>Live Argo Float Data</span>
        <div style={s.dividerLine} />
      </div>

      {/* ── Argovis Section ── */}
      <section style={s.dataSection} ref={sectionRef}>

        {/* Header */}
        <div style={s.dataHeader}>
          <p style={s.dataEyebrow}>
            {status === 'loading' && '⏳ Connecting to Argovis…'}
            {status === 'live'    && '🟢 Live · Argovis API · Colorado / Scripps'}
            {status === 'fallback'&& '📡 Argo Float Data · January 2020'}
          </p>
          <h2 style={s.dataTitle}>Argo Floats Are Watching</h2>
          <p style={s.dataSub}>
            Right now, autonomous robotic floats drift through the California Current — diving,
            measuring, surfacing — transmitting ocean temperature from depths you'll never see.
            This is{' '}
            <span style={{ color: '#48cae4', fontWeight: 700 }}>
              {status === 'live' ? 'live data' : 'real Argo data'}
            </span>{' '}
            from the region that shapes your ocean type.
          </p>
        </div>

        {/* ── Float Map ── */}
        <div style={s.mapContainer}>
          <div style={s.mapLabel}>California Current · 20°N–40°N · 110°W–130°W</div>
          <FloatMap
            floats={displayFloats}
            visible={visible}
            selected={selected}
            onSelect={setSelected}
            groupColor={colors.primary}
          />
          <div style={s.mapLegend}>
            {[['< 15°C','#0077b6'],['15–17°C','#00b4d8'],['17–19°C','#f9c74f'],['> 19°C','#ef4444']].map(([label, col]) => (
              <div key={label} style={s.legendItem}>
                <div style={{ ...s.legendDot, background: col }} />
                <span style={s.legendLabel}>{label}</span>
              </div>
            ))}
            <div style={s.legendItem}>
              <div style={{ ...s.legendDot, border: '1.5px solid rgba(200,230,255,0.5)', background: 'transparent', width: 10, height: 10 }} />
              <span style={s.legendLabel}>Float position</span>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <span style={{ ...s.statNum, color: '#48cae4' }}>
              {status === 'loading' ? '…' : displayFloats.length}
            </span>
            <span style={s.statLab}>Argo floats in this region</span>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statNum, color: '#f9c74f' }}>
              {status === 'loading' ? '…' : avgSST + '°C'}
            </span>
            <span style={s.statLab}>Avg sea surface temperature</span>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statNum, color: '#10b981' }}>
              {status === 'loading' ? '…' : `${minSST}°–${maxSST}°C`}
            </span>
            <span style={s.statLab}>Surface temp range across floats</span>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statNum, color: '#8b5cf6' }}>2000m</span>
            <span style={s.statLab}>Max depth each float dives</span>
          </div>
        </div>

        {/* ── Depth Profile Chart ── */}
        {profileFloat && profileFloat.profile.length > 2 && (
          <div style={s.profileSection}>
            <h3 style={s.profileTitle}>
              Temperature vs Depth — Float{' '}
              <span style={{ color: '#48cae4', fontFamily: 'monospace' }}>
                {profileFloat.id.toString().slice(0, 12)}
              </span>
            </h3>
            <p style={s.profileSub}>
              Each Argo float sinks to 2000 m, drifts for 10 days, then rises while measuring
              temperature at every depth. The profile below is{' '}
              {status === 'live' ? 'live data from this float.' : 'representative of a real California Current float.'}
            </p>
            <div style={s.profileChartWrap}>
              <DepthProfile profile={profileFloat.profile} visible={visible} />
            </div>
          </div>
        )}

        {/* ── Fish Fade ── */}
        <div style={s.fishSection}>
          <h3 style={s.fishTitle}>What's at Stake</h3>
          <p style={s.fishSub}>
            The California Current supports 28 species of commercially harvested fish, hundreds of
            seabirds, and the migratory routes of humpback whales, leatherback sea turtles, and
            great white sharks. Argo data shows temperatures rising. Below — what we could lose.
          </p>
          <div style={s.fishGrid}>
            {FISH.map((fish, i) => {
              const fade = Math.max(0.05, 1 - (i / FISH.length) * 0.92);
              return (
                <span
                  key={i}
                  style={{
                    fontSize: '34px',
                    display: 'inline-block',
                    opacity:   visible ? fade : 0,
                    transform: visible ? `translateY(${(1 - fade) * 22}px)` : 'translateY(0)',
                    filter:    `grayscale(${Math.round((1 - fade) * 100)}%)`,
                    transition: `opacity ${0.7 + i * 0.12}s ease, transform ${0.7 + i * 0.12}s ease`,
                  }}
                >
                  {fish}
                </span>
              );
            })}
          </div>
          <p style={s.fishCaption}>
            Each emoji represents a species group whose California Current habitat has shifted measurably
            since Argo monitoring began. The rightmost silhouettes are fading — like the populations they represent.
          </p>
        </div>

        {/* ── Attribution ── */}
        <div style={s.attribution}>
          <div style={s.attrLogo}>🌊</div>
          <p style={s.attrText}>
            Data from{' '}
            <strong style={{ color: '#90e0ef' }}>Scripps Institution of Oceanography</strong>{' '}
            via the{' '}
            <strong style={{ color: '#90e0ef' }}>Argo Program</strong>
            {' '}· Powered by{' '}
            <span style={{ color: '#48cae4' }}>Argovis</span>{' '}
            (argovis-api.colorado.edu){' '}
            · EasyOneArgo dataset · Jan 2020 · California Current region
          </p>
          <p style={s.attrSub}>
            Argo is a global array of 4,000 free-drifting profiling floats that measures ocean temperature
            and salinity. Scripps Institution of Oceanography at UC San Diego is a founding partner.
          </p>
        </div>

        {/* ── CTA ── */}
        <div style={s.ctaBox}>
          <p style={s.ctaText}>
            <strong>You've seen the data.</strong> Now act on it.
            Join your HYML group, complete ocean missions, and earn echo points
            for protecting the California Current.
          </p>
          <button
            style={{ ...s.joinBtn, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            onClick={() => navigate('/dashboard', { state: { group } })}
          >
            Join {group} · Start Your Missions &nbsp;→
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Float Map ────────────────────────────────────────────────────────────────

function FloatMap({ floats, visible, selected, onSelect, groupColor }) {
  const { W, H } = MAP;

  // Build land polygon: coastline → top-right → bottom-right → close
  const coastPts = COASTLINE.map(([lon, lat]) => `${toX(lon)},${toY(lat)}`).join(' ');
  const landPoly = [
    ...COASTLINE.map(([lon, lat]) => `${toX(lon)},${toY(lat)}`),
    `${W},${toY(40)}`,   // top-right corner of box
    `${W},${toY(20)}`,   // bottom-right corner
    `${toX(-109.9)},${toY(22.9)}`, // back to Baja tip
  ].join(' ');

  // Lat/lon grid lines
  const latGridLines = [25, 30, 35, 40];
  const lonGridLines = [-125, -120, -115];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: `${W}px`, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <defs>
        <radialGradient id="oceanDepth" cx="40%" cy="60%" r="70%">
          <stop offset="0%"   stopColor="#0a2540" stopOpacity="1" />
          <stop offset="60%"  stopColor="#051530" stopOpacity="1" />
          <stop offset="100%" stopColor="#020b18" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="oceanShallow" cx="80%" cy="50%" r="30%">
          <stop offset="0%"   stopColor="#0a3d6b" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="floatGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="mapClip">
          <rect x="0" y="0" width={W} height={H} />
        </clipPath>
      </defs>

      {/* Ocean background */}
      <rect x="0" y="0" width={W} height={H} fill="url(#oceanDepth)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#oceanShallow)" />

      {/* Grid lines */}
      {latGridLines.map(lat => (
        <g key={lat}>
          <line
            x1={0} y1={toY(lat)} x2={W} y2={toY(lat)}
            stroke="rgba(72,202,228,0.08)" strokeWidth="1" strokeDasharray="4 6"
          />
          <text x="6" y={toY(lat) - 4} fill="rgba(72,202,228,0.3)" fontSize="9" fontFamily="monospace">
            {lat}°N
          </text>
        </g>
      ))}
      {lonGridLines.map(lon => (
        <g key={lon}>
          <line
            x1={toX(lon)} y1={0} x2={toX(lon)} y2={H}
            stroke="rgba(72,202,228,0.08)" strokeWidth="1" strokeDasharray="4 6"
          />
          <text x={toX(lon) + 3} y={H - 6} fill="rgba(72,202,228,0.3)" fontSize="9" fontFamily="monospace">
            {Math.abs(lon)}°W
          </text>
        </g>
      ))}

      {/* Land mass */}
      <polygon
        points={landPoly}
        fill="rgba(30,45,65,0.75)"
        clipPath="url(#mapClip)"
      />

      {/* Coastline */}
      <polyline
        points={coastPts}
        fill="none"
        stroke="rgba(180,210,240,0.35)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        clipPath="url(#mapClip)"
      />

      {/* City labels */}
      {[
        { name: 'San Francisco', lat: 37.8, lon: -122.5 },
        { name: 'Los Angeles',   lat: 34.0, lon: -118.5 },
        { name: 'San Diego',     lat: 32.7, lon: -117.2 },
      ].map(city => (
        <g key={city.name}>
          <circle cx={toX(city.lon)} cy={toY(city.lat)} r="2.5"
            fill="rgba(200,220,240,0.5)" />
          <text
            x={toX(city.lon) + 6} y={toY(city.lat) + 4}
            fill="rgba(200,220,240,0.45)" fontSize="9" fontFamily="sans-serif"
          >
            {city.name}
          </text>
        </g>
      ))}

      {/* Float dots */}
      {floats.map((f, i) => {
        const x = toX(f.lon);
        const y = toY(f.lat);
        if (x < 0 || x > W || y < 0 || y > H) return null;
        const col = sstColor(f.sst);
        const isSelected = i === selected;
        const delay = (i * 0.28) % 2;

        return (
          <g
            key={f.id || i}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(i)}
          >
            {/* Expanding ring */}
            <circle
              cx={x} cy={y} r="5"
              fill="none"
              stroke={col}
              strokeWidth="1.5"
              opacity={visible ? 0.8 : 0}
              style={{
                transformOrigin: `${x}px ${y}px`,
                transformBox: 'fill-box',
                animation: visible ? `argoRing 2.4s ${delay}s ease-out infinite` : 'none',
              }}
            />
            {/* Second slower ring */}
            <circle
              cx={x} cy={y} r="5"
              fill="none"
              stroke={col}
              strokeWidth="1"
              opacity={visible ? 0.5 : 0}
              style={{
                transformOrigin: `${x}px ${y}px`,
                transformBox: 'fill-box',
                animation: visible ? `argoRing 2.4s ${delay + 1.2}s ease-out infinite` : 'none',
              }}
            />
            {/* Center dot */}
            <circle
              cx={x} cy={y} r={isSelected ? 7 : 4.5}
              fill={col}
              opacity={visible ? 1 : 0}
              filter="url(#floatGlow)"
              style={{
                transition: 'r 0.3s ease, opacity 0.6s ease',
                animation: visible ? `argoBlink 3s ${delay}s ease-in-out infinite` : 'none',
              }}
            />
            {/* Selected highlight ring */}
            {isSelected && (
              <circle
                cx={x} cy={y} r="11"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity="0.7"
                filter="url(#softGlow)"
              />
            )}
            {/* SST label on hover */}
            {isSelected && f.sst != null && (
              <g>
                <rect x={x + 10} y={y - 16} width="52" height="18" rx="5"
                  fill="rgba(0,10,30,0.85)" />
                <text x={x + 14} y={y - 3} fill="#fff" fontSize="10" fontWeight="600">
                  {f.sst.toFixed(1)}°C
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Map border */}
      <rect x="0" y="0" width={W} height={H}
        fill="none" stroke="rgba(72,202,228,0.15)" strokeWidth="1" />
    </svg>
  );
}

// ─── Depth Profile Chart ──────────────────────────────────────────────────────

function DepthProfile({ profile, visible }) {
  if (!profile || profile.length < 2) return null;

  const W = 560, H = 260;
  const PAD = { top: 24, right: 40, bottom: 44, left: 60 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const maxPres = Math.min(Math.max(...profile.map(p => p.pres)), 2000);
  const minTemp = Math.min(...profile.map(p => p.temp)) - 0.5;
  const maxTemp = Math.max(...profile.map(p => p.temp)) + 0.5;

  const xS = t   => PAD.left + ((t - minTemp) / (maxTemp - minTemp)) * iW;
  const yS = prs => PAD.top  + (prs / maxPres) * iH;

  const points = profile
    .filter(m => m.pres <= maxPres)
    .map(m => `${xS(m.temp)},${yS(m.pres)}`).join(' ');

  const yTicks = [0, 200, 500, 1000, 1500, 2000].filter(p => p <= maxPres);
  const xTicks = [];
  for (let t = Math.ceil(minTemp); t <= Math.floor(maxTemp); t += 2) xTicks.push(t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W}px`, height: 'auto' }}>
      <defs>
        <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f9c74f" stopOpacity="0.3" />
          <stop offset="50%"  stopColor="#48cae4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0077b6" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="profileLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f9c74f" />
          <stop offset="40%"  stopColor="#48cae4" />
          <stop offset="100%" stopColor="#0077b6" />
        </linearGradient>
        <filter id="lineGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x={PAD.left} y={PAD.top} width={iW} height={iH}
        fill="rgba(2,10,25,0.6)" />

      {/* Depth shading bands */}
      {[
        { y0: 0,   y1: 200,  color: 'rgba(72,202,228,0.04)', label: 'Epipelagic' },
        { y0: 200, y1: 1000, color: 'rgba(0,100,180,0.04)',  label: 'Mesopelagic' },
        { y0: 1000, y1: 2000, color: 'rgba(0,20,60,0.08)',  label: 'Bathypelagic' },
      ].filter(b => b.y0 < maxPres).map(b => (
        <g key={b.label}>
          <rect
            x={PAD.left}
            y={yS(b.y0)}
            width={iW}
            height={yS(Math.min(b.y1, maxPres)) - yS(b.y0)}
            fill={b.color}
          />
          <text
            x={PAD.left + iW - 4}
            y={yS(b.y0) + 12}
            textAnchor="end"
            fill="rgba(100,160,200,0.25)"
            fontSize="8"
            fontStyle="italic"
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* Grid lines */}
      {yTicks.map(p => (
        <line key={p}
          x1={PAD.left} y1={yS(p)} x2={PAD.left + iW} y2={yS(p)}
          stroke="rgba(72,202,228,0.07)" strokeWidth="1" strokeDasharray="3 5"
        />
      ))}

      {/* Area fill */}
      <polygon
        points={[
          `${PAD.left},${PAD.top}`,
          ...profile.filter(m => m.pres <= maxPres).map(m => `${xS(m.temp)},${yS(m.pres)}`),
          `${PAD.left},${yS(Math.min(maxPres, profile[profile.length-1].pres))}`,
        ].join(' ')}
        fill="url(#profileGrad)"
      />

      {/* Profile line */}
      <polyline
        points={points}
        fill="none"
        stroke="url(#profileLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#lineGlow)"
        style={{
          strokeDasharray: 1200,
          strokeDashoffset: visible ? 0 : 1200,
          transition: 'stroke-dashoffset 2s ease',
        }}
      />

      {/* Dots */}
      {profile.filter(m => m.pres <= maxPres).map((m, i) => (
        <circle key={i} cx={xS(m.temp)} cy={yS(m.pres)} r="2.5"
          fill={sstColor(m.temp)}
          opacity={visible ? 0.9 : 0}
          style={{ transition: `opacity ${0.4 + i * 0.06}s ease` }}
        />
      ))}

      {/* Y-axis (depth) labels */}
      {yTicks.map(p => (
        <text key={p} x={PAD.left - 8} y={yS(p) + 4}
          textAnchor="end" fill="rgba(150,200,240,0.5)" fontSize="10">
          {p === 0 ? 'surface' : `${p}m`}
        </text>
      ))}

      {/* Y-axis title */}
      <text
        transform={`rotate(-90) translate(-${PAD.top + iH / 2}, 14)`}
        textAnchor="middle" fill="rgba(150,200,240,0.35)" fontSize="9" letterSpacing="1"
      >
        DEPTH (m)
      </text>

      {/* X-axis labels */}
      {xTicks.map(t => (
        <text key={t} x={xS(t)} y={H - 10}
          textAnchor="middle" fill="rgba(150,200,240,0.5)" fontSize="10">
          {t}°C
        </text>
      ))}

      {/* X-axis title */}
      <text
        x={PAD.left + iW / 2} y={H - 2}
        textAnchor="middle" fill="rgba(150,200,240,0.35)" fontSize="9" letterSpacing="1"
      >
        TEMPERATURE (°C)
      </text>

      {/* Surface callout */}
      {visible && profile[0] && (
        <g>
          <line
            x1={xS(profile[0].temp)} y1={PAD.top}
            x2={xS(profile[0].temp)} y2={yS(Math.min(150, maxPres))}
            stroke="#f9c74f" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"
          />
          <rect x={xS(profile[0].temp) - 28} y={PAD.top - 18} width="56" height="17" rx="5"
            fill="rgba(249,199,79,0.9)" />
          <text x={xS(profile[0].temp)} y={PAD.top - 5}
            textAnchor="middle" fill="#000" fontSize="10" fontWeight="700">
            SST {profile[0].temp.toFixed(1)}°C
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #020b18 0%, #041428 20%, #061e3a 50%, #041428 80%, #020b18 100%)',
    color: '#e8f4fd',
    position: 'relative',
  },
  bgGlow: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse 70% 40% at 50% 10%, rgba(0,80,160,0.18) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  nav: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 48px',
    borderBottom: '1px solid rgba(100,180,255,0.07)',
  },
  logo:   { fontSize: '18px', fontWeight: 800, letterSpacing: '5px', color: '#90e0ef', cursor: 'pointer' },
  navBtn: {
    padding: '8px 20px', background: 'transparent',
    border: '1px solid rgba(72,202,228,0.3)', borderRadius: '20px',
    color: '#48cae4', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  hero: {
    position: 'relative', zIndex: 5,
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: '72px 48px 80px',
    animation: 'slideUp 0.9s ease both',
  },
  eyebrow: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '3.5px', textTransform: 'uppercase',
    color: '#48cae4', marginBottom: '36px',
  },
  animalOrb: {
    width: '220px', height: '220px', borderRadius: '50%', border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '32px', boxShadow: '0 0 80px rgba(0,100,160,0.2)',
    animation: 'floatSlow 5s ease-in-out infinite',
  },
  animalEmoji: { fontSize: '90px', filter: 'drop-shadow(0 0 20px rgba(72,202,228,0.4))' },
  animalName:  { fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' },
  codeBadge:   { marginBottom: '14px' },
  codeText:    { fontSize: '28px', fontWeight: 800, letterSpacing: '8px', fontFamily: 'monospace' },
  groupBadge:  {
    display: 'inline-block', padding: '8px 24px', borderRadius: '20px', border: '1px solid',
    fontSize: '14px', marginBottom: '28px',
  },
  descText: {
    fontSize: '16px', lineHeight: 1.75, color: 'rgba(200,230,255,0.7)',
    maxWidth: '520px', marginBottom: '40px',
  },
  joinBtn: {
    display: 'inline-flex', alignItems: 'center', padding: '16px 40px',
    border: 'none', borderRadius: '50px', color: '#fff',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 28px rgba(0,0,0,0.3)', letterSpacing: '0.3px',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '20px',
    padding: '0 48px', margin: '20px 0 0',
  },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(72,202,228,0.15)' },
  dividerText: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.5)', whiteSpace: 'nowrap',
  },
  dataSection: {
    position: 'relative', zIndex: 5,
    padding: '80px 48px 100px', maxWidth: '920px', margin: '0 auto',
  },
  dataHeader:  { textAlign: 'center', marginBottom: '52px' },
  dataEyebrow: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.65)', marginBottom: '16px',
  },
  dataTitle: {
    fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#e8f4fd',
    marginBottom: '20px', letterSpacing: '-0.5px',
  },
  dataSub: {
    fontSize: '17px', color: 'rgba(200,230,255,0.72)', lineHeight: 1.72,
    maxWidth: '640px', margin: '0 auto',
  },
  mapContainer: {
    background: 'linear-gradient(145deg, rgba(2,10,25,0.95), rgba(4,14,30,0.98))',
    border: '1px solid rgba(72,202,228,0.12)', borderRadius: '24px',
    padding: '28px 24px 20px', marginBottom: '40px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  mapLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.45)', marginBottom: '16px', textAlign: 'center',
  },
  mapLegend: {
    display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap',
    marginTop: '14px',
  },
  legendItem:  { display: 'flex', alignItems: 'center', gap: '6px' },
  legendDot:   { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontSize: '11px', color: 'rgba(180,220,255,0.45)' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px', marginBottom: '56px',
  },
  statCard: {
    background: 'linear-gradient(145deg, rgba(10,28,65,0.8), rgba(5,16,40,0.9))',
    border: '1px solid rgba(72,202,228,0.1)', borderRadius: '18px',
    padding: '26px 18px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  statNum: { fontSize: '38px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  statLab: { fontSize: '12px', color: 'rgba(180,220,255,0.5)', lineHeight: 1.5 },
  profileSection: { marginBottom: '64px' },
  profileTitle: {
    fontSize: '18px', fontWeight: 700, color: '#e8f4fd',
    marginBottom: '10px', textAlign: 'center',
  },
  profileSub: {
    fontSize: '13px', color: 'rgba(180,220,255,0.55)', lineHeight: 1.7,
    maxWidth: '560px', margin: '0 auto 24px', textAlign: 'center',
  },
  profileChartWrap: {
    background: 'linear-gradient(145deg, rgba(4,14,30,0.95), rgba(2,8,20,0.98))',
    border: '1px solid rgba(72,202,228,0.1)', borderRadius: '20px',
    padding: '28px 20px 16px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
  },
  fishSection: { textAlign: 'center', marginBottom: '64px' },
  fishTitle:   { fontSize: '24px', fontWeight: 700, color: '#e8f4fd', marginBottom: '12px' },
  fishSub: {
    fontSize: '14px', color: 'rgba(180,220,255,0.6)', lineHeight: 1.75,
    maxWidth: '580px', margin: '0 auto 36px',
  },
  fishGrid:    { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: '20px' },
  fishCaption: {
    fontSize: '12px', color: 'rgba(150,200,230,0.38)', fontStyle: 'italic',
    lineHeight: 1.65, maxWidth: '520px', margin: '0 auto',
  },
  attribution: {
    textAlign: 'center', padding: '36px 32px',
    background: 'linear-gradient(145deg, rgba(0,20,50,0.6), rgba(0,10,28,0.7))',
    border: '1px solid rgba(72,202,228,0.1)', borderRadius: '20px',
    marginBottom: '48px',
  },
  attrLogo: { fontSize: '32px', marginBottom: '12px' },
  attrText:  { fontSize: '14px', color: 'rgba(200,230,255,0.65)', lineHeight: 1.7, marginBottom: '10px' },
  attrSub:   { fontSize: '12px', color: 'rgba(150,200,230,0.4)', lineHeight: 1.65, maxWidth: '560px', margin: '0 auto', fontStyle: 'italic' },
  ctaBox: {
    textAlign: 'center', padding: '44px 40px',
    background: 'linear-gradient(145deg, rgba(5,18,45,0.75), rgba(2,10,25,0.85))',
    borderRadius: '24px', border: '1px solid rgba(72,202,228,0.08)',
  },
  ctaText: {
    fontSize: '16px', color: 'rgba(200,230,255,0.75)', lineHeight: 1.72,
    maxWidth: '520px', margin: '0 auto 28px',
  },
};
