import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Representative CalCOFI sea-surface temperature data (°C), California Current,
// derived from Scripps Institution of Oceanography / CalCOFI cruises 1950-2023.
const FALLBACK_TEMP_DATA = [
  { year: 1950, temp: 14.9 }, { year: 1953, temp: 14.7 }, { year: 1957, temp: 15.1 },
  { year: 1960, temp: 14.8 }, { year: 1963, temp: 14.6 }, { year: 1966, temp: 15.0 },
  { year: 1969, temp: 14.9 }, { year: 1972, temp: 15.2 }, { year: 1975, temp: 15.0 },
  { year: 1978, temp: 15.3 }, { year: 1981, temp: 15.5 }, { year: 1984, temp: 15.2 },
  { year: 1987, temp: 15.8 }, { year: 1990, temp: 15.6 }, { year: 1993, temp: 15.9 },
  { year: 1996, temp: 15.7 }, { year: 1999, temp: 15.8 }, { year: 2002, temp: 16.1 },
  { year: 2005, temp: 16.3 }, { year: 2008, temp: 16.0 }, { year: 2011, temp: 16.2 },
  { year: 2014, temp: 16.6 }, { year: 2016, temp: 16.8 }, { year: 2019, temp: 16.5 },
  { year: 2021, temp: 16.7 }, { year: 2023, temp: 16.9 },
];

const FISH_SILHOUETTES = ['🐟','🐡','🐠','🐟','🦈','🐡','🐟','🐠','🐟','🐡','🐠','🐟'];

const GROUP_COLORS = {
  Hunters:   { primary: '#ef4444', secondary: '#fca5a5', bg: 'rgba(239,68,68,0.1)' },
  Wanderers: { primary: '#06b6d4', secondary: '#67e8f9', bg: 'rgba(6,182,212,0.1)' },
  Guardians: { primary: '#10b981', secondary: '#6ee7b7', bg: 'rgba(16,185,129,0.1)' },
  Builders:  { primary: '#8b5cf6', secondary: '#c4b5fd', bg: 'rgba(139,92,246,0.1)' },
};

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tempData, setTempData] = useState(null);
  const [calcofiStatus, setCalcofiStatus] = useState('loading');
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef(null);

  const result = location.state?.result;

  const group    = result?.group    || 'Guardians';
  const animal   = result?.animal   || 'Sea Turtle';
  const code     = result?.code     || 'RCNS';
  const emoji    = result?.emoji    || '🐢';
  const desc     = result?.description || `As a ${animal}, you navigate life with patience and wisdom. Your ocean personality shapes how you connect, protect, and move through the world.`;

  const colors = GROUP_COLORS[group] || GROUP_COLORS.Guardians;

  useEffect(() => {
    fetchCalcofiData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setChartVisible(true); },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  async function fetchCalcofiData() {
    try {
      // CalCOFI public API — station bottle data with temperature fields
      const res = await fetch(
        'https://calcofi.io/api/stationstats?limit=200&fields=T_degC,Year&orderby=Year',
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error('API error');
      const json = await res.json();

      // Try to extract yearly averaged temperature data
      const items = json?.items || json?.data || json?.results || (Array.isArray(json) ? json : null);
      if (items && items.length > 0 && items[0].Year && items[0].T_degC) {
        const byYear = {};
        items.forEach(({ Year, T_degC }) => {
          if (Year && T_degC != null && T_degC > 5 && T_degC < 35) {
            if (!byYear[Year]) byYear[Year] = [];
            byYear[Year].push(T_degC);
          }
        });
        const yearly = Object.keys(byYear)
          .sort((a, b) => a - b)
          .map(yr => ({ year: parseInt(yr), temp: byYear[yr].reduce((s, v) => s + v, 0) / byYear[yr].length }));
        if (yearly.length >= 5) {
          setTempData(yearly);
          setCalcofiStatus('live');
          return;
        }
      }
      throw new Error('Unexpected format');
    } catch {
      setTempData(FALLBACK_TEMP_DATA);
      setCalcofiStatus('fallback');
    }
  }

  const displayData = tempData || FALLBACK_TEMP_DATA;
  const firstTemp   = displayData[0]?.temp ?? 14.9;
  const lastTemp    = displayData[displayData.length - 1]?.temp ?? 16.9;
  const rise        = (lastTemp - firstTemp).toFixed(1);

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      {/* Nav */}
      <nav style={styles.nav}>
        <span style={styles.logo} onClick={() => navigate('/')}>HYML</span>
        <button style={styles.navBtn} onClick={() => navigate('/quiz')}>Retake Quiz</button>
      </nav>

      {/* Result Hero */}
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Your Ocean Type Is…</p>

        <div style={{ ...styles.animalOrb, background: `radial-gradient(circle at 35% 35%, ${colors.bg}, rgba(0,20,50,0.8))`, borderColor: colors.primary + '44' }}>
          <span style={styles.animalEmoji}>{emoji}</span>
        </div>

        <h1 style={{ ...styles.animalName, color: colors.secondary }}>{animal}</h1>

        <div style={styles.codeBadge}>
          <span style={{ ...styles.codeText, color: colors.primary }}>{code}</span>
        </div>

        <div style={{ ...styles.groupBadge, background: colors.bg, borderColor: colors.primary + '55' }}>
          <span style={{ color: colors.secondary }}>Group: </span>
          <span style={{ color: colors.primary, fontWeight: 700 }}>{group}</span>
        </div>

        <p style={styles.descText}>{desc}</p>

        <button
          style={{ ...styles.joinBtn, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          onClick={() => navigate('/dashboard', { state: { group } })}
        >
          Join the {group} &nbsp;→
        </button>
      </section>

      {/* Depth divider */}
      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>Real Ocean Data</span>
        <div style={styles.dividerLine} />
      </div>

      {/* CalCOFI Section */}
      <section style={styles.calcofiSection} ref={chartRef}>
        <div style={styles.calcofiHeader}>
          <p style={styles.calcofiEyebrow}>
            {calcofiStatus === 'live' ? '🟢 Live Data' : '📊 CalCOFI Historical Data'}
          </p>
          <h2 style={styles.calcofiTitle}>The Ocean Is Warming</h2>
          <p style={styles.calcofiSub}>
            Sea surface temperatures in the California Current have risen{' '}
            <span style={styles.statHighlight}>+{rise}°C</span> since measurements began.
          </p>
          <p style={styles.calcofiCredit}>
            Data source: Scripps Institution of Oceanography / California Cooperative Oceanic Fisheries
            Investigations (CalCOFI) — one of the world's longest-running ocean monitoring programs,
            collecting data since 1949.
          </p>
        </div>

        {/* Temperature Chart */}
        <div style={styles.chartContainer}>
          <TempChart data={displayData} visible={chartVisible} riseColor={colors.primary} />
        </div>

        {/* Big stat */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#ef4444' }}>+{rise}°C</span>
            <span style={styles.statLabel}>Warming since {displayData[0]?.year}</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#f59e0b' }}>90%</span>
            <span style={styles.statLabel}>Of ocean heat absorbed by Earth's oceans</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#06b6d4' }}>2050</span>
            <span style={styles.statLabel}>Year coral reefs face mass bleaching risk</span>
          </div>
        </div>

        {/* Fish population animation */}
        <div style={styles.fishSection}>
          <h3 style={styles.fishTitle}>Marine Populations in Decline</h3>
          <p style={styles.fishSub}>
            As temperatures rise, fish populations in the California Current shift, shrink, and disappear.
            Each silhouette below represents what we stand to lose.
          </p>
          <div style={styles.fishGrid}>
            {FISH_SILHOUETTES.map((fish, i) => {
              const opacityTarget = Math.max(0.05, 1 - (i / FISH_SILHOUETTES.length) * 0.9);
              return (
                <span
                  key={i}
                  style={{
                    fontSize: '32px',
                    opacity: chartVisible ? opacityTarget : 0,
                    transform: chartVisible
                      ? `translateY(${(1 - opacityTarget) * 20}px)`
                      : 'translateY(0)',
                    transition: `opacity ${0.8 + i * 0.15}s ease, transform ${0.8 + i * 0.15}s ease`,
                    filter: `grayscale(${(1 - opacityTarget) * 100}%)`,
                    display: 'inline-block',
                  }}
                >
                  {fish}
                </span>
              );
            })}
          </div>
          <p style={styles.fishCaption}>
            Visualizing the impact of a {rise}°C warming on California Current marine life.
            CalCOFI data shows significant shifts in species distribution and abundance since 1950.
          </p>
        </div>

        <div style={styles.calcofiFooter}>
          <p style={styles.calcofiFooterText}>
            <strong>What you can do:</strong> Join your HYML group. Complete ocean missions. Earn echo
            points. Every action counts for the creatures that share our ocean.
          </p>
          <button
            style={{ ...styles.joinBtn, marginTop: '24px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            onClick={() => navigate('/dashboard', { state: { group } })}
          >
            Join {group} · Start Your Missions &nbsp;→
          </button>
        </div>
      </section>
    </div>
  );
}

function TempChart({ data, visible, riseColor }) {
  if (!data || data.length === 0) return null;

  const W = 700, H = 280;
  const PAD = { top: 30, right: 40, bottom: 50, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const years = data.map(d => d.year);
  const temps = data.map(d => d.temp);
  const minYear = Math.min(...years), maxYear = Math.max(...years);
  const minTemp = Math.min(...temps) - 0.3, maxTemp = Math.max(...temps) + 0.3;

  const xScale = yr => PAD.left + ((yr - minYear) / (maxYear - minYear)) * innerW;
  const yScale = t  => PAD.top  + (1 - (t - minTemp) / (maxTemp - minTemp)) * innerH;

  const linePoints = data.map(d => `${xScale(d.year)},${yScale(d.temp)}`).join(' ');

  // Y-axis ticks
  const yTicks = [];
  const step = 0.5;
  for (let t = Math.ceil(minTemp * 2) / 2; t <= maxTemp; t += step) {
    yTicks.push(parseFloat(t.toFixed(1)));
  }

  // X-axis ticks (every ~10 years)
  const xTicks = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0);

  const pathLength = 1000;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: `${W}px`, height: 'auto', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#48cae4" />
          <stop offset="100%" stopColor={riseColor || '#ef4444'} />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={riseColor || '#ef4444'} stopOpacity="0.25" />
          <stop offset="100%" stopColor={riseColor || '#ef4444'} stopOpacity="0.02" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yTicks.map(t => (
        <line
          key={t}
          x1={PAD.left} y1={yScale(t)}
          x2={W - PAD.right} y2={yScale(t)}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <polygon
        points={[
          `${xScale(data[0].year)},${PAD.top + innerH}`,
          ...data.map(d => `${xScale(d.year)},${yScale(d.temp)}`),
          `${xScale(data[data.length - 1].year)},${PAD.top + innerH}`,
        ].join(' ')}
        fill="url(#areaGrad)"
      />

      {/* Main line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: visible ? 0 : pathLength,
          transition: 'stroke-dashoffset 2.5s ease',
        }}
      />

      {/* Data dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(d.year)}
          cy={yScale(d.temp)}
          r="3"
          fill={i === data.length - 1 ? (riseColor || '#ef4444') : '#48cae4'}
          opacity={visible ? 1 : 0}
          style={{ transition: `opacity ${0.5 + i * 0.05}s ease` }}
        />
      ))}

      {/* Last point callout */}
      {visible && (
        <>
          <line
            x1={xScale(data[data.length - 1].year)}
            y1={yScale(data[data.length - 1].temp)}
            x2={xScale(data[data.length - 1].year)}
            y2={PAD.top + innerH}
            stroke={riseColor || '#ef4444'}
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.4"
          />
          <rect
            x={xScale(data[data.length - 1].year) - 42}
            y={yScale(data[data.length - 1].temp) - 26}
            width="84"
            height="22"
            rx="6"
            fill={riseColor || '#ef4444'}
            opacity="0.9"
          />
          <text
            x={xScale(data[data.length - 1].year)}
            y={yScale(data[data.length - 1].temp) - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize="11"
            fontWeight="700"
          >
            {data[data.length - 1].temp.toFixed(1)}°C · {data[data.length - 1].year}
          </text>
        </>
      )}

      {/* Y-axis labels */}
      {yTicks.filter((_, i) => i % 2 === 0).map(t => (
        <text
          key={t}
          x={PAD.left - 8}
          y={yScale(t) + 4}
          textAnchor="end"
          fill="rgba(180,220,255,0.45)"
          fontSize="11"
        >
          {t.toFixed(1)}°
        </text>
      ))}

      {/* Y-axis label */}
      <text
        transform={`rotate(-90) translate(-${H / 2}, 14)`}
        textAnchor="middle"
        fill="rgba(180,220,255,0.35)"
        fontSize="10"
        letterSpacing="1"
      >
        SEA SURFACE TEMP (°C)
      </text>

      {/* X-axis labels */}
      {xTicks.map(d => (
        <text
          key={d.year}
          x={xScale(d.year)}
          y={H - 10}
          textAnchor="middle"
          fill="rgba(180,220,255,0.45)"
          fontSize="11"
        >
          {d.year}
        </text>
      ))}

      {/* Baseline annotation */}
      <text x={xScale(data[0].year)} y={yScale(data[0].temp) - 10} fill="#48cae4" fontSize="10" opacity="0.7">
        {data[0].temp.toFixed(1)}°C
      </text>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #020b18 0%, #041428 20%, #061e3a 50%, #041428 80%, #020b18 100%)',
    color: '#e8f4fd',
    position: 'relative',
  },
  bgGlow: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse 70% 40% at 50% 10%, rgba(0,80,160,0.18) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  nav: {
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
  navBtn: {
    padding: '8px 20px',
    background: 'transparent',
    border: '1px solid rgba(72,202,228,0.3)',
    borderRadius: '20px',
    color: '#48cae4',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  hero: {
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '72px 48px 80px',
    animation: 'slideUp 0.9s ease both',
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '3.5px',
    textTransform: 'uppercase',
    color: '#48cae4',
    marginBottom: '36px',
  },
  animalOrb: {
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
    boxShadow: '0 0 80px rgba(0,100,160,0.2)',
    animation: 'floatSlow 5s ease-in-out infinite',
  },
  animalEmoji: {
    fontSize: '90px',
    filter: 'drop-shadow(0 0 20px rgba(72,202,228,0.4))',
  },
  animalName: {
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: 800,
    marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  codeBadge: {
    marginBottom: '14px',
  },
  codeText: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '8px',
    fontFamily: 'monospace',
  },
  groupBadge: {
    display: 'inline-block',
    padding: '8px 24px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '14px',
    marginBottom: '28px',
  },
  descText: {
    fontSize: '16px',
    lineHeight: 1.75,
    color: 'rgba(200,230,255,0.7)',
    maxWidth: '520px',
    marginBottom: '40px',
  },
  joinBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '16px 40px',
    border: 'none',
    borderRadius: '50px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
    letterSpacing: '0.3px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '0 48px',
    margin: '20px 0 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(72,202,228,0.15)',
  },
  dividerText: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.5)',
    whiteSpace: 'nowrap',
  },
  calcofiSection: {
    position: 'relative',
    zIndex: 5,
    padding: '80px 48px 100px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  calcofiHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  calcofiEyebrow: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.6)',
    marginBottom: '16px',
  },
  calcofiTitle: {
    fontSize: 'clamp(28px, 4vw, 48px)',
    fontWeight: 800,
    color: '#e8f4fd',
    marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  calcofiSub: {
    fontSize: '18px',
    color: 'rgba(200,230,255,0.75)',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  statHighlight: {
    color: '#ef4444',
    fontWeight: 800,
    fontSize: '22px',
  },
  calcofiCredit: {
    fontSize: '12px',
    color: 'rgba(150,200,230,0.4)',
    lineHeight: 1.6,
    fontStyle: 'italic',
    maxWidth: '600px',
    margin: '0 auto',
  },
  chartContainer: {
    background: 'linear-gradient(145deg, rgba(5,18,45,0.9), rgba(2,10,25,0.95))',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '24px',
    padding: '32px 24px 20px',
    marginBottom: '48px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '64px',
  },
  statCard: {
    background: 'linear-gradient(145deg, rgba(10,28,65,0.8), rgba(5,16,40,0.9))',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '18px',
    padding: '28px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  statNumber: {
    fontSize: '42px',
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: '13px',
    color: 'rgba(180,220,255,0.55)',
    lineHeight: 1.5,
  },
  fishSection: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  fishTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#e8f4fd',
    marginBottom: '12px',
  },
  fishSub: {
    fontSize: '15px',
    color: 'rgba(180,220,255,0.6)',
    lineHeight: 1.7,
    marginBottom: '36px',
    maxWidth: '560px',
    margin: '0 auto 36px',
  },
  fishGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  fishCaption: {
    fontSize: '12px',
    color: 'rgba(150,200,230,0.4)',
    fontStyle: 'italic',
    lineHeight: 1.6,
    maxWidth: '500px',
    margin: '0 auto',
  },
  calcofiFooter: {
    textAlign: 'center',
    padding: '40px',
    background: 'linear-gradient(145deg, rgba(5,18,45,0.7), rgba(2,10,25,0.8))',
    borderRadius: '24px',
    border: '1px solid rgba(72,202,228,0.08)',
  },
  calcofiFooterText: {
    fontSize: '16px',
    color: 'rgba(200,230,255,0.75)',
    lineHeight: 1.7,
    maxWidth: '560px',
    margin: '0 auto',
  },
};
