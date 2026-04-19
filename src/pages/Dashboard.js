import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLeaderboard, getEvents, attendEvent } from '../api';

const GROUP_META = {
  Hunters:   { emoji: '🦈', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  Wanderers: { emoji: '🐬', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)' },
  Guardians: { emoji: '🐢', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  Builders:  { emoji: '🐙', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
};

const FALLBACK_LEADERBOARD = [
  { group: 'Guardians', points: 4280, members: 1247, rank: 1 },
  { group: 'Builders',  points: 3950, members: 1089, rank: 2 },
  { group: 'Wanderers', points: 3670, members:  986, rank: 3 },
  { group: 'Hunters',   points: 3210, members:  874, rank: 4 },
];

const FALLBACK_EVENTS = [
  {
    id: 1,
    title: 'Recycling in UC San Diego',
    organizer: 'San Diego Student Council',
    date: '26/04/20',
    daysLeft: 2,
    type: 'Recycling',
    points: 50,
  },
  {
    id: 2,
    title: 'Volunteer in La Jolla Coast',
    organizer: 'San Diego Student Council',
    date: '26/04/21',
    daysLeft: 3,
    type: 'Cleanup',
    points: 80,
  },
  {
    id: 3,
    title: 'Beach Survey — Mission Bay',
    organizer: 'Scripps Institution of Oceanography',
    date: '26/04/23',
    daysLeft: 5,
    type: 'Research',
    points: 120,
  },
  {
    id: 4,
    title: 'Coral Watch Training',
    organizer: 'CalCOFI Education Team',
    date: '26/04/28',
    daysLeft: 10,
    type: 'Education',
    points: 60,
  },
];

// ─── Ocean Animation Panel ────────────────────────────────────────────────────

const OCEAN_INDICATORS = [
  { key: 'Temperature (°C)',      label: 'Temperature',      unit: '°C'  },
  { key: 'Salinity (PSU)',        label: 'Salinity',         unit: ' PSU'},
  { key: 'Dissolved Oxygen (µM)', label: 'Dissolved O₂',     unit: ' µM' },
  { key: 'Fluorescence (V)',      label: 'Fluorescence',     unit: ' V'  },
  { key: 'Beam Attenuation',      label: 'Beam Attenuation', unit: ''    },
];



// ─── SVG Ocean Scene Components ──────────────────────────────────────────────

// Trash SVGs
function PlasticBagSVG({ size = 32 }) {
  return (
    <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 36 46" fill="none">
      <path d="M14 8 Q11 2 18 2 Q25 2 22 8" stroke="#cce5ff" strokeWidth="1.5" fill="none" />
      <path d="M8 10 Q6 30 8 42 Q13 46 18 46 Q23 46 28 42 Q30 30 28 10 Z" fill="rgba(200,230,255,0.55)" stroke="#90c8f8" strokeWidth="1.2" />
      <path d="M11 18 Q18 22 25 18" stroke="#90c8f8" strokeWidth="1" fill="none" opacity="0.7" />
      <path d="M10 26 Q18 30 26 26" stroke="#90c8f8" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  );
}

function PlasticBottleSVG({ size = 28 }) {
  return (
    <svg width={size} height={Math.round(size * 2.2)} viewBox="0 0 28 62" fill="none">
      <rect x="9" y="1" width="10" height="7" rx="2" fill="#a8d8a8" stroke="#6dbf6d" strokeWidth="1" />
      <path d="M7 8 Q5 14 5 20 L5 52 Q5 58 14 58 Q23 58 23 52 L23 20 Q23 14 21 8 Z" fill="rgba(168,216,168,0.5)" stroke="#6dbf6d" strokeWidth="1.2" />
      <ellipse cx="14" cy="30" rx="7" ry="3" fill="rgba(255,255,255,0.2)" />
      <path d="M7 20 Q14 23 23 20" stroke="#6dbf6d" strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M7 42 Q14 45 23 42" stroke="#6dbf6d" strokeWidth="0.8" fill="none" opacity="0.6" />
    </svg>
  );
}

function CanSVG({ size = 26 }) {
  return (
    <svg width={size} height={Math.round(size * 1.5)} viewBox="0 0 28 42" fill="none">
      <ellipse cx="14" cy="5" rx="10" ry="4" fill="#e0e0e0" />
      <rect x="4" y="5" width="20" height="32" fill="#d32f2f" />
      <rect x="4" y="5" width="20" height="3" fill="#b71c1c" />
      <rect x="4" y="34" width="20" height="3" fill="#b71c1c" />
      <ellipse cx="14" cy="37" rx="10" ry="4" fill="#e0e0e0" />
      <rect x="8" y="12" width="12" height="12" rx="2" fill="rgba(255,255,255,0.15)" />
      <line x1="14" y1="13" x2="14" y2="23" stroke="white" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function OilDrumSVG({ size = 30 }) {
  return (
    <svg width={size} height={Math.round(size * 1.4)} viewBox="0 0 32 44" fill="none">
      <ellipse cx="16" cy="5" rx="12" ry="4.5" fill="#4a4a1a" />
      <rect x="4" y="5" width="24" height="34" fill="#6b6b1f" />
      <rect x="4" y="5" width="24" height="4" fill="#555510" />
      <rect x="4" y="35" width="24" height="4" fill="#555510" />
      <ellipse cx="16" cy="39" rx="12" ry="4.5" fill="#4a4a1a" />
      <rect x="4" y="16" width="24" height="3" fill="#555510" opacity="0.8" />
      <rect x="4" y="25" width="24" height="3" fill="#555510" opacity="0.8" />
      <circle cx="22" cy="9" r="3" fill="#333310" />
    </svg>
  );
}

function FishingNetSVG({ size = 38 }) {
  return (
    <svg width={size} height={Math.round(size * 0.85)} viewBox="0 0 44 38" fill="none">
      <path d="M2 2 Q22 10 42 2 Q38 20 42 36 Q22 28 2 36 Q6 18 2 2 Z" fill="rgba(200,200,100,0.25)" stroke="#c8b400" strokeWidth="1.2" />
      {[0,1,2].map(r => (
        <path key={r} d={`M2 ${12+r*8} Q22 ${18+r*4} 42 ${12+r*8}`} stroke="#c8b400" strokeWidth="0.8" fill="none" opacity="0.7" />
      ))}
      {[0,1,2,3].map(c => (
        <path key={c} d={`M${10+c*8} 2 Q${10+c*6} 20 ${10+c*8} 36`} stroke="#c8b400" strokeWidth="0.8" fill="none" opacity="0.7" />
      ))}
    </svg>
  );
}

function StrawSVG({ size = 24 }) {
  return (
    <svg width={Math.round(size * 0.35)} height={size} viewBox="0 0 10 36" fill="none">
      <rect x="2" y="0" width="6" height="36" rx="3" fill="#ff8a65" />
      <rect x="2" y="0" width="3" height="36" rx="3" fill="#ffb74d" opacity="0.5" />
    </svg>
  );
}

const TRASH_ITEMS = [PlasticBagSVG, PlasticBottleSVG, CanSVG, OilDrumSVG, FishingNetSVG, StrawSVG];

// Seaweed SVG
function SeaweedSVG({ height = 52, color = '#2d6a4f' }) {
  const h = height;
  const w = Math.round(h * 0.55);
  const mid = w / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path
        d={`M${mid} ${h} C${mid - 8} ${h * 0.8} ${mid + 10} ${h * 0.65} ${mid} ${h * 0.5} C${mid - 10} ${h * 0.35} ${mid + 8} ${h * 0.2} ${mid} 0`}
        stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
      <path
        d={`M${mid} ${h * 0.72} C${mid + 10} ${h * 0.6} ${mid + 16} ${h * 0.5} ${mid + 8} ${h * 0.4}`}
        stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
      <path
        d={`M${mid} ${h * 0.42} C${mid - 10} ${h * 0.3} ${mid - 16} ${h * 0.22} ${mid - 8} ${h * 0.12}`}
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

// Rock SVG
function RockSVG({ w = 28, h = 18, dark = '#3a3535', light = '#5c5454' }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <ellipse cx={w / 2} cy={h * 0.65} rx={w / 2} ry={h * 0.55} fill={dark} />
      <ellipse cx={w * 0.38} cy={h * 0.42} rx={w * 0.22} ry={h * 0.22} fill={light} opacity="0.55" />
    </svg>
  );
}

// ─── SVG Ocean Creature Components ───────────────────────────────────────────

function FishSVG({ size = 44, color = '#48cae4', belly = '#caf0f8' }) {
  return (
    <svg width={size} height={Math.round(size * 0.65)} viewBox="0 0 70 46" fill="none">
      <path d="M10 23 L0 9 L0 37 Z" fill={color} />
      <ellipse cx="35" cy="23" rx="26" ry="15" fill={color} />
      <ellipse cx="35" cy="28" rx="15" ry="7" fill={belly} opacity="0.45" />
      <path d="M27 9 Q34 3 46 9" stroke={color} strokeWidth="3" strokeLinecap="round" fill={color} opacity="0.75" />
      <circle cx="52" cy="18" r="5" fill="white" />
      <circle cx="53" cy="18" r="2.5" fill="#0d1b2a" />
      <circle cx="54" cy="17" r="1" fill="white" />
      <path d="M43 12 Q45 23 43 34" stroke={belly} strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}

function JellyfishSVG({ size = 44 }) {
  return (
    <svg width={size} height={Math.round(size * 1.5)} viewBox="0 0 50 75" fill="none">
      <path d="M5 26 Q5 3 25 3 Q45 3 45 26 Z" fill="#c77dff" opacity="0.88" />
      <path d="M10 24 Q10 8 25 7 Q16 8 16 24 Z" fill="white" opacity="0.22" />
      <ellipse cx="25" cy="21" rx="12" ry="8" fill="#e0aaff" opacity="0.35" />
      {[9, 16, 23, 30, 37].map((x, i) => (
        <path key={i} d={`M${x} 26 C${x - 5} ${40 + i} ${x + 3} ${50 + i} ${x - 1} ${62 + i}`} stroke="#e0aaff" strokeWidth="1.5" fill="none" opacity="0.75" />
      ))}
      <circle cx="20" cy="18" r="2" fill="white" opacity="0.6" />
      <circle cx="30" cy="16" r="1.5" fill="white" opacity="0.5" />
    </svg>
  );
}

function CrabSVG({ size = 44 }) {
  return (
    <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 64 48" fill="none">
      <ellipse cx="32" cy="30" rx="19" ry="13" fill="#e63946" />
      <ellipse cx="30" cy="26" rx="11" ry="7" fill="#ff6b6b" opacity="0.5" />
      <path d="M13 22 Q5 16 2 10 Q7 6 12 13 Q13 9 18 13 Q14 17 13 22 Z" fill="#e63946" />
      <path d="M51 22 Q59 16 62 10 Q57 6 52 13 Q51 9 46 13 Q50 17 51 22 Z" fill="#e63946" />
      <line x1="16" y1="27" x2="7" y2="19" stroke="#c1121f" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="32" x2="5" y2="28" stroke="#c1121f" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="27" x2="57" y2="19" stroke="#c1121f" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="32" x2="59" y2="28" stroke="#c1121f" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="25" cy="22" r="4" fill="white" />
      <circle cx="39" cy="22" r="4" fill="white" />
      <circle cx="26" cy="22" r="2" fill="#0d1b2a" />
      <circle cx="40" cy="22" r="2" fill="#0d1b2a" />
      <circle cx="27" cy="21" r="0.8" fill="white" />
      <circle cx="41" cy="21" r="0.8" fill="white" />
    </svg>
  );
}

function TurtleSVG({ size = 58 }) {
  return (
    <svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 84 58" fill="none">
      <path d="M29 14 Q18 4 10 10 Q18 18 26 20 Z" fill="#52b788" />
      <path d="M55 14 Q66 4 74 10 Q66 18 58 20 Z" fill="#52b788" />
      <path d="M29 44 Q18 54 12 48 Q20 40 28 38 Z" fill="#52b788" />
      <path d="M55 44 Q66 54 72 48 Q64 40 56 38 Z" fill="#52b788" />
      <ellipse cx="42" cy="30" rx="25" ry="19" fill="#2d6a4f" />
      <ellipse cx="42" cy="30" rx="15" ry="11" fill="#40916c" />
      <path d="M31 21 L42 17 L53 21 L53 39 L42 43 L31 39 Z" fill="#52b788" opacity="0.4" />
      <ellipse cx="64" cy="26" rx="10" ry="8" fill="#52b788" />
      <circle cx="69" cy="23" r="3" fill="white" />
      <circle cx="70" cy="23" r="1.5" fill="#0d1b2a" />
      <circle cx="71" cy="22" r="0.7" fill="white" />
    </svg>
  );
}

function SeahorseSVG({ size = 38 }) {
  return (
    <svg width={size} height={Math.round(size * 2.1)} viewBox="0 0 42 88" fill="none">
      <ellipse cx="22" cy="16" rx="12" ry="14" fill="#f77f00" />
      <path d="M30 10 Q42 13 40 18 Q30 18 30 10 Z" fill="#f77f00" />
      <path d="M16 5 Q13 0 17 4" stroke="#d62828" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M20 3 Q20 0 22 4" stroke="#d62828" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M25 4 Q27 0 27 5" stroke="#d62828" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="13" r="4.5" fill="white" />
      <circle cx="27" cy="13" r="2.2" fill="#0d1b2a" />
      <circle cx="28" cy="12" r="0.9" fill="white" />
      <path d="M22 22 Q32 30 30 50 Q28 65 20 75 Q16 68 18 54 Q14 40 22 22 Z" fill="#f77f00" />
      <path d="M13 30 Q4 34 6 44 Q14 40 16 30 Z" fill="#f77f00" opacity="0.75" />
      {[0, 1, 2, 3, 4].map(i => (
        <path key={i} d={`M16 ${36 + i * 7} Q24 ${34 + i * 7} 30 ${38 + i * 7}`} stroke="#d62828" strokeWidth="1.2" fill="none" opacity="0.5" />
      ))}
      <path d="M20 75 Q12 80 14 85 Q22 83 24 75 Z" fill="#f77f00" />
    </svg>
  );
}

function CoralSVG({ color = '#ff6b6b', size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="17" y="32" width="6" height="8" rx="2" fill={color} opacity="0.7" />
      <rect x="18" y="8" width="4" height="26" rx="2" fill={color} />
      <rect x="8" y="16" width="4" height="18" rx="2" fill={color} transform="rotate(-18 10 24)" />
      <rect x="28" y="16" width="4" height="18" rx="2" fill={color} transform="rotate(18 30 24)" />
      <circle cx="20" cy="8" r="4" fill={color} />
      <circle cx="9" cy="12" r="3.5" fill={color} />
      <circle cx="31" cy="12" r="3.5" fill={color} />
      <circle cx="20" cy="7" r="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

// Creatures unlocked per level:
// L0-2: nothing alive
// L3: 1 fish
// L4: +2 fish +1 jellyfish
// L5: +1 fish +1 jellyfish  (crab appears on seabed)
// L6: +turtle +1 fish +1 jellyfish
// L7: +seahorse +1 fish
function getCreatures(level) {
  const list = [];
  if (level >= 3) list.push({ type: 'fish',      swimIdx: 0, top: 22, size: 44, color: '#48cae4', belly: '#caf0f8', dur: 11,  delay: 0   });
  if (level >= 4) list.push({ type: 'fish',      swimIdx: 1, top: 12, size: 36, color: '#f4a261', belly: '#ffe0b2', dur: 14,  delay: 1.5 });
  if (level >= 4) list.push({ type: 'fish',      swimIdx: 2, top: 42, size: 32, color: '#06d6a0', belly: '#b7e4c7', dur:  9,  delay: 3.5 });
  if (level >= 4) list.push({ type: 'jellyfish', id: 0, left: '18%', top: '10%', size: 38, dur: 5,   delay: 0   });
  if (level >= 5) list.push({ type: 'fish',      swimIdx: 3, top: 32, size: 48, color: '#9b5de5', belly: '#e0aaff', dur: 12,  delay: 2   });
  if (level >= 5) list.push({ type: 'jellyfish', id: 1, left: '65%', top:  '8%', size: 32, dur: 6.5, delay: 2.5 });
  if (level >= 6) list.push({ type: 'turtle',    swimIdx: 4, top: 18, size: 58, dur: 20,  delay: 0   });
  if (level >= 6) list.push({ type: 'fish',      swimIdx: 5, top: 50, size: 28, color: '#ef233c', belly: '#fca5a5', dur:  8,  delay: 4   });
  if (level >= 6) list.push({ type: 'jellyfish', id: 2, left: '82%', top: '20%', size: 36, dur: 7,   delay: 1   });
  if (level >= 7) list.push({ type: 'seahorse',  left: '38%', top: '16%', size: 36 });
  if (level >= 7) list.push({ type: 'fish',      swimIdx: 6, top:  8, size: 40, color: '#4361ee', belly: '#a8dadc', dur: 13,  delay: 6   });
  return list;
}

// ─────────────────────────────────────────────────────────────────────────────

function OceanPanel({ board, myGroup }) {
  const [selectedGroup, setSelectedGroup] = useState(myGroup);

  const entry = board.find(e => e.group === selectedGroup) || board[0];
  const groupPoints = entry?.points || 0;
  const level = Math.floor(groupPoints / 1000);
  const [oceanData, setOceanData] = useState(null);
  useEffect(() => {
      const year = Math.max(2003, Math.min(2021, 2021 - Math.floor(groupPoints / 100)));
      fetch(`https://hymlbe-production.up.railway.app/api/ocean-health?year=${year}`)
          .then(r => r.json())
          .then(setOceanData)
          .catch(console.error);
}, [groupPoints]);
  // Creatures unlocked per level (see getCreatures)
  const creatures = getCreatures(level);
  // Trash: 6 at level 0, remove one per level → 0 at level 6
  const trashCount = Math.max(0, 6 - level);
  // Water color: interpolate from murky brown to clear blue
  const waterColors = [
    ['#2d1b00', '#4a2d0a'], // level 0 — very murky
    ['#1a2a10', '#2a4015'], // level 1
    ['#0a2a20', '#104030'], // level 2
    ['#062535', '#0a3848'], // level 3
    ['#041c35', '#073050'], // level 4
    ['#021430', '#053060'], // level 5+
  ];
  const ci = Math.min(level, waterColors.length - 1);
  const [topColor, botColor] = waterColors[ci];
  const selMeta = GROUP_META[selectedGroup] || GROUP_META.Guardians;

  return (
    <div style={oceanStyles.wrapper}>
      {/* ── Left: Ocean Scene (90%) ────────────────────── */}
      <div style={oceanStyles.sceneCol}>

        {/* Group selector tabs */}
        <div style={oceanStyles.groupTabBar}>
          {board.map(e => {
            const meta = GROUP_META[e.group] || GROUP_META.Guardians;
            const isSelected = e.group === selectedGroup;
            const isMe = e.group === myGroup;
            return (
              <button
                key={e.group}
                onClick={() => setSelectedGroup(e.group)}
                style={{
                  ...oceanStyles.groupTabBtn,
                  background: isSelected ? meta.bg : 'rgba(10,28,65,0.4)',
                  borderColor: isSelected ? meta.color : 'rgba(72,202,228,0.1)',
                  color: isSelected ? meta.color : 'rgba(180,220,255,0.45)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{meta.emoji}</span>
                <span style={{ fontWeight: isSelected ? 700 : 500 }}>{e.group}</span>
                {isMe && <span style={{ ...oceanStyles.myTag, background: meta.bg, color: meta.color }}>me</span>}
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{(e.points || 0).toLocaleString()} pts</span>
              </button>
            );
          })}
        </div>

        <div style={{ ...oceanStyles.ocean, background: `linear-gradient(180deg, ${topColor} 0%, ${botColor} 100%)`, borderColor: selMeta.border }}>
          {/* Animated CSS keyframes injected inline */}
          <style>{`
            ${[
              [0, -22, 14, -8,  20, -12, 0],
              [0,  18, -20, 25, -14,  10, 0],
              [0, -28,  8, -18,  16, -20, 0],
              [0,  12, -18,  8,  -22,  14, 0],
              [0, -8,   22, -26,  10, -16, 0],
              [0,  24, -12,  18,  -8,  20, 0],
              [0, -18,  16, -12,  24, -10, 0],
              [0,  8,  -24,  14, -18,  22, 0],
            ].map((ys, i) => `
              @keyframes swimFish${i} {
                0%   { transform: translate(-80px,  ${ys[0]}px) scaleX(1); }
                16%  { transform: translate(160px,  ${ys[1]}px) scaleX(1); }
                32%  { transform: translate(420px,  ${ys[2]}px) scaleX(1); }
                48%  { transform: translate(750px,  ${ys[3]}px) scaleX(1); }
                50%  { transform: translate(800px,  ${ys[3]}px) scaleX(-1); }
                66%  { transform: translate(540px,  ${ys[4]}px) scaleX(-1); }
                82%  { transform: translate(240px,  ${ys[5]}px) scaleX(-1); }
                100% { transform: translate(-80px,  ${ys[0]}px) scaleX(1); }
              }
            `).join('')}
            @keyframes bubble {
              0%   { transform: translateY(0) scale(1); opacity: 0.7; }
              100% { transform: translateY(-180px) scale(1.4); opacity: 0; }
            }
            @keyframes trashFloat {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50%       { transform: translateY(-8px) rotate(8deg); }
            }
            @keyframes coralSway {
              0%, 100% { transform: rotate(-4deg); transform-origin: bottom center; }
              50%       { transform: rotate(4deg);  transform-origin: bottom center; }
            }
            @keyframes seaweedSway {
              0%, 100% { transform: skewX(-6deg); }
              50%       { transform: skewX(6deg); }
            }
            @keyframes pulse {
              0%   { opacity: 0.45; }
              100% { opacity: 0.1; }
            }
            @keyframes jellybob {
              0%, 100% { transform: translateY(0px) scale(1); }
              50%       { transform: translateY(-16px) scale(1.04); }
            }
            @keyframes seahoverSway {
              0%, 100% { transform: rotate(-7deg) translateY(0); }
              50%       { transform: rotate(7deg) translateY(-10px); }
            }
            @keyframes crabWalk {
              0%, 100% { transform: translateX(0); }
              30%       { transform: translateX(10px); }
              70%       { transform: translateX(-10px); }
            }
          `}</style>

          {/* Sunrays (only visible at higher levels) */}
          {level >= 3 && (
            <div style={oceanStyles.sunrays}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ ...oceanStyles.ray, left: `${15 + i * 18}%`, animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
          )}

          {/* Seabed */}
          <div style={oceanStyles.seabed}>
            {/* Coral SVG (appears at level >= 2) */}
            {level >= 2 && (
              <>
                <div style={{ ...oceanStyles.coral, left: '8%',  animationDelay: '0s'   }}><CoralSVG color="#ff6b6b" size={30} /></div>
                <div style={{ ...oceanStyles.coral, left: '20%', animationDelay: '0.5s' }}><CoralSVG color="#ff9f43" size={26} /></div>
              </>
            )}
            {level >= 4 && (
              <>
                <div style={{ ...oceanStyles.coral, left: '55%', animationDelay: '0.3s' }}><CoralSVG color="#ff6b6b" size={32} /></div>
                <div style={{ ...oceanStyles.coral, left: '75%', animationDelay: '0.8s' }}><CoralSVG color="#ff9f43" size={28} /></div>
              </>
            )}
            {/* Crab on seabed at level 5+ */}
            {level >= 5 && (
              <div style={{ position: 'absolute', bottom: '14px', left: '44%', zIndex: 4, animation: 'crabWalk 3.5s ease-in-out infinite', pointerEvents: 'none' }}>
                <CrabSVG size={34} />
              </div>
            )}

            {/* Seaweed (appears at level >= 1) */}
            {level >= 1 && [10, 28, 52, 72, 88].map((pos, i) => {
              const colors = ['#2d6a4f','#40916c','#1b4332','#52b788','#2d6a4f'];
              return (
                <div key={i} style={{ ...oceanStyles.seaweed, left: `${pos}%`, animationDelay: `${i * 0.35}s` }}>
                  <SeaweedSVG height={38 + i * 10} color={colors[i % colors.length]} />
                </div>
              );
            })}

            {/* Rocks */}
            {[['4%',26,16],['33%',34,20],['58%',22,14],['78%',42,24],['92%',20,12]].map(([l,w,h], i) => (
              <div key={i} style={{ position:'absolute', bottom:0, left:l, zIndex:1 }}>
                <RockSVG w={w} h={h} dark={i%2===0?'#3a3535':'#2e2828'} light={i%2===0?'#5c5454':'#4a4040'} />
              </div>
            ))}
          </div>

          {/* Trash (floats, disappears one by one as points rise) */}
          {[...Array(trashCount)].map((_, i) => {
            const TrashComp = TRASH_ITEMS[i % TRASH_ITEMS.length];
            return (
              <div key={i} style={{
                ...oceanStyles.trash,
                left: `${8 + i * 15}%`,
                top:  `${18 + (i % 3) * 22}%`,
                animationDelay: `${i * 0.7}s`,
              }}>
                <TrashComp size={28} />
              </div>
            );
          })}

          {/* Bubbles */}
          {level >= 1 && [...Array(6)].map((_, i) => (
            <div key={i} style={{
              ...oceanStyles.bubble,
              left:            `${10 + i * 15}%`,
              bottom:          `${8 + (i % 3) * 6}%`,
              width:           `${4 + (i % 3) * 3}px`,
              height:          `${4 + (i % 3) * 3}px`,
              animationDelay:  `${i * 0.9}s`,
              animationDuration:`${2.5 + i * 0.4}s`,
            }} />
          ))}

          {/* Swimming fish */}
          {creatures.filter(c => c.type === 'fish').map((c, i) => (
            <div key={`fish-${i}`} style={{
              position:      'absolute',
              top:           `${c.top}%`,
              left:          0,
              animation:     `swimFish${c.swimIdx} ${c.dur}s ${c.delay}s ease-in-out infinite backwards`,
              zIndex:        5,
              pointerEvents: 'none',
            }}>
              <FishSVG size={c.size} color={c.color} belly={c.belly} />
            </div>
          ))}

          {/* Sea turtles */}
          {creatures.filter(c => c.type === 'turtle').map((c, i) => (
            <div key={`turtle-${i}`} style={{
              position:      'absolute',
              top:           `${c.top}%`,
              left:          0,
              animation:     `swimFish${c.swimIdx} ${c.dur}s ${c.delay}s ease-in-out infinite backwards`,
              zIndex:        5,
              pointerEvents: 'none',
            }}>
              <TurtleSVG size={c.size} />
            </div>
          ))}

          {/* Jellyfish — float in place */}
          {creatures.filter(c => c.type === 'jellyfish').map((c, i) => (
            <div key={`jelly-${i}`} style={{
              position:      'absolute',
              left:          c.left,
              top:           c.top,
              animation:     `jellybob ${c.dur}s ${c.delay}s ease-in-out infinite`,
              zIndex:        5,
              pointerEvents: 'none',
            }}>
              <JellyfishSVG size={c.size} />
            </div>
          ))}

          {/* Seahorse — hover & sway */}
          {creatures.filter(c => c.type === 'seahorse').map((c, i) => (
            <div key={`horse-${i}`} style={{
              position:      'absolute',
              left:          c.left,
              top:           c.top,
              animation:     `seahoverSway 3s ease-in-out infinite`,
              zIndex:        5,
              pointerEvents: 'none',
            }}>
              <SeahorseSVG size={c.size} />
            </div>
          ))}
        </div>

        {/* Points progress label */}
        <div style={oceanStyles.progressBar}>
          <div style={oceanStyles.progressLabel}>
            Total Echo Points: <strong style={{ color: selMeta.color }}>{groupPoints.toLocaleString()}</strong>
            &nbsp;·&nbsp; Level <strong style={{ color: '#90e0ef' }}>{level}</strong>
            &nbsp;·&nbsp; Next milestone: <strong style={{ color: '#f59e0b' }}>{((level + 1) * 1000).toLocaleString()} pts</strong>
          </div>
          <div style={oceanStyles.milestoneTrack}>
            <div style={{ ...oceanStyles.milestoneFill, width: `${((groupPoints % 1000) / 1000) * 100}%`, background: `linear-gradient(90deg, ${selMeta.color}, ${selMeta.border})` }} />
          </div>
        </div>
      </div>

      {/* ── Right: Indicators (~10%) ───────────────────── */}
      <div style={oceanStyles.indicatorCol}>
        <p style={oceanStyles.indTitle}>Ocean Metrics</p>
       {OCEAN_INDICATORS.map(ind => {
  const metric = oceanData?.metrics?.[ind.key];
  const val    = metric?.raw_value;
  const color  = metric?.color  ?? '#888';
  const label  = metric?.label  ?? '—';
  const arrow  = metric?.arrow  ?? '';
  const pct    = metric?.pct_change ?? 0;

  return (
    <div key={ind.key} style={oceanStyles.indCard}>
      <div style={oceanStyles.indHeader}>
        <span style={oceanStyles.indLabel}>{ind.label}</span>
        <span style={{ ...oceanStyles.indValue, color }}>
          {val != null ? val.toFixed(2) : '—'}{ind.unit}
        </span>
      </div>
      <div style={{ fontSize: '10px', fontWeight: 700, color, background: color + '22', borderRadius: '6px', padding: '2px 6px', display: 'flex', justifyContent: 'space-between' }}>
        <span>● {label}</span>
        <span style={{ color: metric?.arrow_color, opacity: 0.85 }}>
          {arrow} {pct !== 0 ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : 'baseline'}
        </span>
      </div>
    </div>
  );
})}

// ─────────────────────────────────────────────────────────────────────────────

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

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const myGroup = location.state?.group || (() => {
    try { return JSON.parse(localStorage.getItem('hymlSignup') || '{}').group || 'Guardians'; } catch { return 'Guardians'; }
  })();
  const myAnimalEmoji = location.state?.animalEmoji || (() => {
    try { return JSON.parse(localStorage.getItem('hymlSignup') || '{}').animalEmoji || null; } catch { return null; }
  })();

  const [leaderboard, setLeaderboard] = useState(null);
  const [events, setEvents]           = useState(null);
  const [attendCode, setAttendCode]   = useState('');
  const [attendResult, setAttendResult] = useState(null);
  const [attendLoading, setAttendLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState('missions');
  const [expandedMissionId, setExpandedMissionId] = useState(null);
  const [lbSubTab, setLbSubTab]       = useState('ranking');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const lb = await getLeaderboard();
      setLeaderboard(lb?.data || lb?.leaderboard || (Array.isArray(lb) ? lb : null) || FALLBACK_LEADERBOARD);
    } catch {
      setLeaderboard(FALLBACK_LEADERBOARD);
    }
    try {
      const ev = await getEvents();
      setEvents(ev?.data || ev?.events || (Array.isArray(ev) ? ev : null) || FALLBACK_EVENTS);
    } catch {
      setEvents(FALLBACK_EVENTS);
    }
  }

  async function handleAttend(e) {
    e.preventDefault();
    if (!attendCode.trim()) return;
    setAttendLoading(true);
    setAttendResult(null);
    try {
      const res = await attendEvent(attendCode.trim());
      setAttendResult({ ok: true, message: res?.message || 'Attendance confirmed! Echo points added.' });
    } catch {
      setAttendResult({ ok: false, message: 'Code not found. Check the event code and try again.' });
    } finally {
      setAttendLoading(false);
      setAttendCode('');
    }
  }

  const myMeta  = GROUP_META[myGroup] || GROUP_META.Guardians;
  const board   = leaderboard || FALLBACK_LEADERBOARD;
  const evList  = events     || FALLBACK_EVENTS;
  const maxPts  = Math.max(...board.map(g => g.points || 0));

  function getMissionDetails(ev) {
    return {
      description:
        ev.description ||
        `${ev.type || 'Community'} mission hosted by ${ev.organizer}. Join this activity to support ocean health and earn echo points for ${myGroup}.`,
      location: ev.location || 'San Diego Coast Hub',
      time: ev.time || '10:00 AM - 12:00 PM',
      requirement: ev.requirement || 'Bring a phone for check-in and wear comfortable clothes.',
    };
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo} onClick={() => navigate('/')}>HYML</div>
        <div style={styles.sidebarGroup}>
          <div
            style={{ ...styles.groupOrb, background: myMeta.bg, borderColor: myMeta.border, cursor: 'pointer' }}
            title="My Profile"
            onClick={() => navigate('/mypage', { state: { group: myGroup, animalEmoji: myAnimalEmoji } })}
          >
            <span style={{ fontSize: '28px' }}>{myAnimalEmoji || myMeta.emoji}</span>
          </div>
          <div>
            <p style={styles.sidebarGroupName}>{myGroup}</p>
            <p style={styles.sidebarGroupLabel}>Your Group</p>
          </div>
        </div>
        <nav style={styles.sidebarNav}>
          {[
            { id: 'missions',     icon: <IconMissions />,    label: 'Missions' },
            { id: 'leaderboard',  icon: <IconLeaderboard />, label: 'Leaderboard' },
            { id: 'attend',       icon: <IconAttend />,      label: 'Attend Event' },
          ].map(item => (
            <button
              key={item.id}
              style={{
                ...styles.navItem,
                background: activeTab === item.id ? 'rgba(72,202,228,0.12)' : 'transparent',
                color: activeTab === item.id ? '#90e0ef' : 'rgba(200,230,255,0.55)',
                borderLeft: activeTab === item.id ? '2px solid #48cae4' : '2px solid transparent',
              }}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button style={styles.logoutBtn} onClick={() => navigate('/')}>↩ Log Out</button>
      </div>

      {/* Main content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.mainHeader}>
          <div>
            <h1 style={styles.mainTitle}>
              {activeTab === 'missions' && "Today's Missions"}
              {activeTab === 'leaderboard' && 'Group Leaderboard'}
              {activeTab === 'attend' && 'Attend an Event'}
            </h1>
            <p style={styles.mainSub}>
              {activeTab === 'missions' && 'Complete missions to earn echo points for your group'}
              {activeTab === 'leaderboard' && 'Groups ranked by echo points this season'}
              {activeTab === 'attend' && 'Enter your event code to log attendance and earn points'}
            </p>
          </div>
          <div
            style={{ ...styles.myGroupBadge, background: myMeta.bg, borderColor: myMeta.border, color: myMeta.color, cursor: 'pointer' }}
            title="Go to My Profile"
            onClick={() => navigate('/mypage', { state: { group: myGroup, animalEmoji: myAnimalEmoji } })}
          >
            {myAnimalEmoji || myMeta.emoji} {myGroup}
          </div>
        </div>

        {/* MISSIONS TAB */}
        {activeTab === 'missions' && (
          <div style={styles.content}>
            <div style={styles.eventsList}>
              {evList.map((ev, i) => {
                const missionId = ev.id || i;
                const isExpanded = expandedMissionId === missionId;
                const details = getMissionDetails(ev);

                return (
                  <div
                    key={missionId}
                    style={{
                      ...styles.eventCard,
                      ...(isExpanded ? styles.eventCardExpanded : null),
                      animation: `slideUp 0.5s ${i * 0.08}s ease both`,
                    }}
                    onClick={() =>
                      setExpandedMissionId(isExpanded ? null : missionId)
                    }
                  >
                    <div style={styles.eventTopRow}>
                      <div style={styles.eventLeft}>
                        <div style={styles.eventDot} />
                        <div>
                          <p style={styles.eventTitle}>{ev.title}</p>
                          <p style={styles.eventOrg}>{ev.organizer}</p>
                        </div>
                      </div>
                      <div style={styles.eventRight}>
                        <div style={styles.eventDateWrap}>
                          <span style={styles.eventDate}>{ev.date}</span>
                          <span style={styles.eventDays}>D-{ev.daysLeft}</span>
                        </div>
                        <div style={styles.eventPts}>+{ev.points} pts</div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={styles.eventDetails}>
                        <p style={styles.eventDescription}>{details.description}</p>
                        <div style={styles.eventMetaRow}>
                          <span style={styles.eventMetaPill}>{ev.type || 'Mission'}</span>
                          <span style={styles.eventMetaPill}>{details.location}</span>
                          <span style={styles.eventMetaPill}>{details.time}</span>
                        </div>
                        <p style={styles.eventRequirement}>
                          What to bring: {details.requirement}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick attend from missions tab */}
            <div style={styles.quickAttend}>
              <p style={styles.quickAttendLabel}>Already at an event?</p>
              <button style={styles.quickAttendBtn} onClick={() => setActiveTab('attend')}>
                Enter Attendance Code →
              </button>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div style={styles.content}>
            {/* Sub-tabs */}
            <div style={styles.subTabBar}>
              <button
                style={{ ...styles.subTabBtn, ...(lbSubTab === 'ranking' ? styles.subTabActive : {}) }}
                onClick={() => setLbSubTab('ranking')}
              >
                🏆 Ranking
              </button>
              <button
                style={{ ...styles.subTabBtn, ...(lbSubTab === 'ocean' ? styles.subTabActive : {}) }}
                onClick={() => setLbSubTab('ocean')}
              >
                🌊 Ocean Health
              </button>
            </div>

            {/* RANKING sub-tab */}
            {lbSubTab === 'ranking' && (
              <div style={styles.leaderList}>
                {board.map((entry, i) => {
                  const meta = GROUP_META[entry.group] || GROUP_META.Guardians;
                  const isMe = entry.group === myGroup;
                  const pct  = ((entry.points || 0) / maxPts) * 100;
                  return (
                    <div
                      key={entry.group}
                      style={{
                        ...styles.leaderCard,
                        border: isMe ? `1px solid ${meta.border}` : '1px solid rgba(72,202,228,0.08)',
                        background: isMe
                          ? `linear-gradient(145deg, ${meta.bg}, rgba(5,18,45,0.9))`
                          : 'linear-gradient(145deg, rgba(10,28,65,0.6), rgba(5,16,40,0.8))',
                        animation: `slideUp 0.5s ${i * 0.1}s ease both`,
                      }}
                    >
                      <div style={styles.rankNum}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </div>
                      <span style={{ fontSize: '32px' }}>{meta.emoji}</span>
                      <div style={styles.leaderInfo}>
                        <div style={styles.leaderTop}>
                          <span style={{ ...styles.leaderName, color: isMe ? meta.color : '#e8f4fd' }}>
                            {entry.group}
                            {isMe && <span style={{ ...styles.youBadge, background: meta.bg, color: meta.color }}> You</span>}
                          </span>
                          <span style={styles.leaderPts}>{(entry.points || 0).toLocaleString()} pts</span>
                        </div>
                        <div style={styles.barTrack}>
                          <div
                            style={{
                              ...styles.barFill,
                              width: `${pct}%`,
                              background: isMe
                                ? `linear-gradient(90deg, ${meta.color}, ${meta.border})`
                                : 'linear-gradient(90deg, #0096c7, #48cae4)',
                            }}
                          />
                        </div>
                        <p style={styles.memberCount}>{(entry.members || 0).toLocaleString()} members</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* OCEAN ANIMATION sub-tab */}
            {lbSubTab === 'ocean' && (
              <OceanPanel board={board} myGroup={myGroup} />
            )}
          </div>
        )}

        {/* ATTEND TAB */}
        {activeTab === 'attend' && (
          <div style={styles.content}>
            <div style={styles.attendCard}>
              <div style={styles.attendIcon}>📍</div>
              <h2 style={styles.attendTitle}>Confirm Your Attendance</h2>
              <p style={styles.attendSub}>
                Get your event code from the organizer at the event.
                Enter it below to log your attendance and earn echo points.
              </p>
              <form onSubmit={handleAttend} style={styles.attendForm}>
                <input
                  type="text"
                  value={attendCode}
                  onChange={e => setAttendCode(e.target.value.toUpperCase())}
                  placeholder="Enter event code (e.g.OCN2024)"
                  style={styles.codeInput}
                  maxLength={12}
                />
                <button
                  type="submit"
                  style={{
                    ...styles.attendSubmit,
                    opacity: attendLoading ? 0.7 : 1,
                  }}
                  disabled={attendLoading}
                >
                  {attendLoading ? 'Checking…' : 'Submit Code'}
                </button>
              </form>
              {attendResult && (
                <div
                  style={{
                    ...styles.attendResult,
                    background: attendResult.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    borderColor: attendResult.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
                    color: attendResult.ok ? '#6ee7b7' : '#fca5a5',
                  }}
                >
                  {attendResult.ok ? '✓ ' : '✗ '}{attendResult.message}
                </div>
              )}
            </div>

            {/* Upcoming events list */}
            <div style={styles.upcomingSection}>
              <h3 style={styles.upcomingTitle}>Upcoming Events</h3>
              {evList.map((ev, i) => (
                <div key={ev.id || i} style={styles.upcomingItem}>
                  <div>
                    <p style={styles.upcomingName}>{ev.title}</p>
                    <p style={styles.upcomingOrg}>{ev.organizer} · {ev.date}</p>
                  </div>
                  <span style={styles.upcomingPts}>+{ev.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #061e3a 100%)',
    color: '#e8f4fd',
    display: 'flex',
    position: 'relative',
  },
  bgGlow: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse 60% 40% at 70% 20%, rgba(0,70,140,0.15) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  sidebar: {
    width: '220px',
    flexShrink: 0,
    borderRight: '1px solid rgba(72,202,228,0.08)',
    padding: '28px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
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
    marginBottom: '40px',
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
    color: 'rgba(180,220,255,0.5)',
  },
  myGroupBadge: {
    padding: '8px 20px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
  },
  content: {
    animation: 'fadeIn 0.4s ease',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
  },
  eventCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 24px',
    background: 'linear-gradient(145deg, rgba(10,28,65,0.7), rgba(5,16,40,0.85))',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '16px',
    gap: '16px',
    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  eventCardExpanded: {
    borderColor: 'rgba(72,202,228,0.28)',
    boxShadow: '0 14px 34px rgba(0, 20, 60, 0.22)',
    transform: 'translateY(-1px)',
  },
  eventTopRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  eventLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  eventDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#48cae4',
    flexShrink: 0,
  },
  eventTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e8f4fd',
    marginBottom: '4px',
  },
  eventOrg: {
    fontSize: '12px',
    color: 'rgba(180,220,255,0.45)',
  },
  eventRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    flexShrink: 0,
  },
  eventDateWrap: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  eventDate: {
    fontSize: '12px',
    color: 'rgba(180,220,255,0.5)',
  },
  eventDays: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#48cae4',
    background: 'rgba(72,202,228,0.1)',
    padding: '2px 8px',
    borderRadius: '8px',
  },
  eventPts: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#10b981',
  },
  eventDetails: {
    width: '100%',
    paddingTop: '4px',
    borderTop: '1px solid rgba(72,202,228,0.08)',
  },
  eventDescription: {
    fontSize: '13px',
    color: 'rgba(190,225,255,0.72)',
    lineHeight: 1.7,
    marginBottom: '14px',
  },
  eventMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '12px',
  },
  eventMetaPill: {
    padding: '6px 10px',
    borderRadius: '999px',
    background: 'rgba(72,202,228,0.08)',
    border: '1px solid rgba(72,202,228,0.14)',
    color: '#90e0ef',
    fontSize: '12px',
    fontWeight: 600,
  },
  eventRequirement: {
    fontSize: '12px',
    color: 'rgba(180,220,255,0.52)',
    lineHeight: 1.6,
  },
  quickAttend: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    background: 'rgba(72,202,228,0.05)',
    border: '1px dashed rgba(72,202,228,0.2)',
    borderRadius: '14px',
  },
  quickAttendLabel: {
    fontSize: '14px',
    color: 'rgba(180,220,255,0.6)',
    flex: 1,
  },
  quickAttendBtn: {
    padding: '9px 20px',
    background: 'rgba(0,150,200,0.2)',
    border: '1px solid rgba(72,202,228,0.3)',
    borderRadius: '20px',
    color: '#48cae4',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  leaderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  leaderCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '24px 28px',
    borderRadius: '18px',
  },
  rankNum: {
    fontSize: '22px',
    width: '32px',
    textAlign: 'center',
    flexShrink: 0,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  leaderName: {
    fontSize: '18px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  youBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '8px',
    letterSpacing: '0.5px',
  },
  leaderPts: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#90e0ef',
    fontVariantNumeric: 'tabular-nums',
  },
  barTrack: {
    height: '6px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 1.2s ease',
  },
  memberCount: {
    fontSize: '12px',
    color: 'rgba(180,220,255,0.4)',
  },
  attendCard: {
    background: 'linear-gradient(145deg, rgba(10,28,65,0.8), rgba(5,16,40,0.9))',
    border: '1px solid rgba(72,202,228,0.12)',
    borderRadius: '24px',
    padding: '52px 48px',
    textAlign: 'center',
    maxWidth: '520px',
    margin: '0 auto 48px',
  },
  attendIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  attendTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#e8f4fd',
    marginBottom: '12px',
  },
  attendSub: {
    fontSize: '14px',
    color: 'rgba(180,220,255,0.6)',
    lineHeight: 1.7,
    marginBottom: '36px',
  },
  attendForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  codeInput: {
    padding: '16px 20px',
    background: 'rgba(5,18,45,0.8)',
    border: '1.5px solid rgba(72,202,228,0.2)',
    borderRadius: '12px',
    color: '#e8f4fd',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '3px',
    textAlign: 'center',
    outline: 'none',
    fontFamily: 'monospace',
  },
  attendSubmit: {
    padding: '15px',
    background: 'linear-gradient(135deg, #0096c7, #00b4d8)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  attendResult: {
    marginTop: '20px',
    padding: '14px 20px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 500,
  },
  upcomingSection: {
    maxWidth: '520px',
    margin: '0 auto',
  },
  upcomingTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'rgba(180,220,255,0.6)',
    marginBottom: '16px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    lineHeight: 1.4,
  },
  upcomingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(72,202,228,0.07)',
  },
  upcomingName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e8f4fd',
    marginBottom: '3px',
  },
  upcomingOrg: {
    fontSize: '12px',
    color: 'rgba(180,220,255,0.4)',
  },
  upcomingPts: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#10b981',
    flexShrink: 0,
  },
  // Sub-tab bar
  subTabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    borderBottom: '1px solid rgba(72,202,228,0.1)',
    paddingBottom: '12px',
  },
  subTabBtn: {
    padding: '8px 22px',
    borderRadius: '20px',
    border: '1px solid rgba(72,202,228,0.15)',
    background: 'transparent',
    color: 'rgba(180,220,255,0.5)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  subTabActive: {
    background: 'rgba(72,202,228,0.12)',
    color: '#90e0ef',
    borderColor: 'rgba(72,202,228,0.35)',
  },
};

// ─── Ocean Panel Styles ───────────────────────────────────────────────────────
const oceanStyles = {
  wrapper: {
    display: 'flex',
    gap: '16px',
    height: '570px',
    animation: 'fadeIn 0.4s ease',
  },
  sceneCol: {
    flex: '0 0 83%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  groupTabBar: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  groupTabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    padding: '9px 12px',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  myTag: {
    fontSize: '9px',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '6px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  ocean: {
    flex: 1,
    borderRadius: '18px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(72,202,228,0.15)',
    transition: 'background 2s ease',
  },
  sunrays: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '60%',
    pointerEvents: 'none',
  },
  ray: {
    position: 'absolute',
    top: 0,
    width: '40px',
    height: '100%',
    background: 'linear-gradient(180deg, rgba(255,240,180,0.12) 0%, transparent 100%)',
    transform: 'skewX(-15deg)',
    animation: 'pulse 3s ease-in-out infinite alternate',
  },
  seabed: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '80px',
    background: 'linear-gradient(180deg, transparent 0%, rgba(20,10,0,0.6) 100%)',
    display: 'flex',
    alignItems: 'flex-end',
  },
  coral: {
    position: 'absolute',
    bottom: '10px',
    fontSize: '28px',
    animation: 'coralSway 3s ease-in-out infinite',
    zIndex: 3,
  },
  seaweed: {
    position: 'absolute',
    bottom: '14px',
    animation: 'seaweedSway 2.5s ease-in-out infinite',
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-end',
    transformOrigin: 'bottom center',
  },
  rock: {
    position: 'absolute',
    bottom: 0,
    background: 'linear-gradient(180deg, #3a3030, #1a1515)',
    borderRadius: '50% 50% 0 0',
    zIndex: 1,
  },
  trash: {
    position: 'absolute',
    animation: 'trashFloat 3s ease-in-out infinite',
    zIndex: 4,
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
  },
  bubble: {
    position: 'absolute',
    background: 'rgba(144,224,239,0.35)',
    borderRadius: '50%',
    border: '1px solid rgba(144,224,239,0.5)',
    animation: 'bubble 3s ease-in infinite',
    zIndex: 3,
  },
  progressBar: {
    padding: '10px 16px',
    background: 'rgba(10,28,65,0.5)',
    borderRadius: '12px',
    border: '1px solid rgba(72,202,228,0.1)',
  },
  progressLabel: {
    fontSize: '13px',
    color: 'rgba(180,220,255,0.7)',
    marginBottom: '8px',
  },
  milestoneTrack: {
    height: '5px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  milestoneFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #0096c7, #48cae4)',
    borderRadius: '3px',
    transition: 'width 1s ease',
  },
  indicatorCol: {
    flex: '0 0 15%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  indTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(144,224,239,0.8)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  indCard: {
    padding: '10px 12px',
    background: 'rgba(10,28,65,0.6)',
    border: '1px solid rgba(72,202,228,0.1)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  indHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indLabel: {
    fontSize: '11px',
    color: 'rgba(180,220,255,0.6)',
    fontWeight: 600,
  },
  indValue: {
    fontSize: '12px',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  indTrack: {
    height: '5px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  },
  indGoodZone: {
    position: 'absolute',
    top: 0, bottom: 0,
    background: 'rgba(16,185,129,0.2)',
    borderRadius: '3px',
  },
  indFill: {
    height: '100%',
    borderRadius: '3px',
    position: 'relative',
    transition: 'width 1.2s ease',
    zIndex: 1,
  },
  indDot: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.3px',
  },
};
