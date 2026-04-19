import React from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ARGOVIS_URL =
  "https://argovis-api.colorado.edu/selection/profiles" +
  "?startDate=2020-01-01&endDate=2020-01-15" +
  "&polygon=" +
  encodeURIComponent("[[-130,20],[-110,20],[-110,40],[-130,40],[-130,20]]");

export const MAP = {
  lonMin: -128,
  lonMax: -110,
  latMin: 24,
  latMax: 42,
  W: 680,
  H: 480,
};

export const COASTLINE = [
  [-109.9, 22.9],
  [-110.4, 24.8],
  [-111.0, 25.3],
  [-111.5, 26.0],
  [-112.3, 27.0],
  [-113.5, 28.0],
  [-114.2, 28.8],
  [-115.2, 29.8],
  [-115.8, 30.7],
  [-116.3, 31.4],
  [-117.1, 32.5],
  [-117.3, 33.0],
  [-117.8, 33.5],
  [-118.2, 33.8],
  [-118.5, 34.0],
  [-119.0, 34.1],
  [-119.8, 34.4],
  [-120.5, 34.5],
  [-120.6, 34.8],
  [-121.2, 35.3],
  [-121.8, 36.2],
  [-122.0, 36.8],
  [-122.4, 37.5],
  [-122.5, 37.8],
  [-123.0, 38.3],
  [-123.7, 39.0],
  [-124.2, 40.0],
  [-124.4, 40.4],
  [-124.2, 41.0],
  [-124.3, 42.0],
];

export const FALLBACK_FLOATS = [
  {
    lat: 34.2,
    lon: -122.5,
    id: "WMO5905785",
    sst: 17.4,
    profile: [
      { pres: 5,    temp: 17.4 },
      { pres: 25,   temp: 16.1 },
      { pres: 50,   temp: 15.2 },
      { pres: 100,  temp: 13.8 },
      { pres: 200,  temp: 11.2 },
      { pres: 300,  temp: 9.8  },
      { pres: 500,  temp: 7.8  },
      { pres: 750,  temp: 6.1  },
      { pres: 1000, temp: 4.5  },
      { pres: 1500, temp: 3.2  },
      { pres: 2000, temp: 2.8  },
    ],
  },
  { lat: 32.8, lon: -118.5, id: "WMO5905412", sst: 18.8, profile: [] },
  { lat: 36.5, lon: -123.0, id: "WMO5903612", sst: 15.9, profile: [] },
  { lat: 31.1, lon: -119.8, id: "WMO6901234", sst: 18.2, profile: [] },
  { lat: 38.5, lon: -125.5, id: "WMO5906789", sst: 14.1, profile: [] },
  { lat: 29.5, lon: -116.2, id: "WMO5902345", sst: 19.5, profile: [] },
  { lat: 34.5, lon: -121.5, id: "WMO5904567", sst: 17.0, profile: [] },
  { lat: 33.8, lon: -120.3, id: "WMO6900123", sst: 16.5, profile: [] },
  { lat: 26.5, lon: -114.0, id: "WMO5905890", sst: 21.3, profile: [] },
  { lat: 39.8, lon: -126.2, id: "WMO6901567", sst: 13.2, profile: [] },
  { lat: 31.2, lon: -121.8, id: "WMO5903890", sst: 17.8, profile: [] },
  { lat: 35.0, lon: -124.6, id: "WMO6900456", sst: 16.9, profile: [] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toX(lon) {
  return ((lon - MAP.lonMin) / (MAP.lonMax - MAP.lonMin)) * MAP.W;
}
export function toY(lat) {
  return (1 - (lat - MAP.latMin) / (MAP.latMax - MAP.latMin)) * MAP.H;
}

export function sstColor(temp) {
  if (temp == null) return "#48cae4";
  if (temp < 15) return "#0077b6";
  if (temp < 17) return "#00b4d8";
  if (temp < 19) return "#f9c74f";
  return "#ef4444";
}

export function processProfiles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      const lat = p.lat ?? p.latitude;
      const lon = p.lon ?? p.longitude ?? p.geolocation?.coordinates?.[0];
      if (lat == null || lon == null) return null;

      let meas = [];
      if (Array.isArray(p.measurements) && p.measurements.length > 0) {
        meas = p.measurements
          .filter((m) => m.pres != null && m.temp != null)
          .sort((a, b) => a.pres - b.pres);
      } else if (Array.isArray(p.data) && Array.isArray(p.data_info?.[0])) {
        const cols = p.data_info[0];
        const pi = cols.indexOf("pres"),
          ti = cols.indexOf("temp");
        if (pi >= 0 && ti >= 0) {
          meas = p.data
            .map((row) => ({ pres: row[pi], temp: row[ti] }))
            .filter((m) => m.pres != null && m.temp != null)
            .sort((a, b) => a.pres - b.pres);
        }
      }

      const sst = meas.find((m) => m.pres < 20)?.temp ?? meas[0]?.temp ?? null;
      return {
        lat,
        lon,
        sst,
        profile: meas,
        id: p._id || String(lat) + String(lon),
      };
    })
    .filter(Boolean);
}

// ─── FloatMap ─────────────────────────────────────────────────────────────────

export function FloatMap({ floats, visible, selected, onSelect, groupColor }) {
  const { W, H } = MAP;

  const coastPts = COASTLINE.map(
    ([lon, lat]) => `${toX(lon)},${toY(lat)}`,
  ).join(" ");
  const landPoly = [
    ...COASTLINE.map(([lon, lat]) => `${toX(lon)},${toY(lat)}`),
    `${W},${toY(MAP.latMax)}`,
    `${W},${toY(MAP.latMin)}`,
    `${toX(COASTLINE[0][0])},${toY(COASTLINE[0][1])}`,
  ].join(" ");

  const latGridLines = [25, 30, 35, 40];
  const lonGridLines = [-125, -120, -115];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", maxWidth: `${W}px`, height: "auto", display: "block", margin: "0 auto" }}
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

      <rect x="0" y="0" width={W} height={H} fill="url(#oceanDepth)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#oceanShallow)" />

      {latGridLines.map((lat) => (
        <g key={lat}>
          <line x1={0} y1={toY(lat)} x2={W} y2={toY(lat)}
            stroke="rgba(72,202,228,0.08)" strokeWidth="1" strokeDasharray="4 6" />
          <text x="6" y={toY(lat) - 4} fill="rgba(72,202,228,0.3)" fontSize="9" fontFamily="monospace">
            {lat}°N
          </text>
        </g>
      ))}
      {lonGridLines.map((lon) => (
        <g key={lon}>
          <line x1={toX(lon)} y1={0} x2={toX(lon)} y2={H}
            stroke="rgba(72,202,228,0.08)" strokeWidth="1" strokeDasharray="4 6" />
          <text x={toX(lon) + 3} y={H - 6} fill="rgba(72,202,228,0.3)" fontSize="9" fontFamily="monospace">
            {Math.abs(lon)}°W
          </text>
        </g>
      ))}

      <polygon points={landPoly} fill="rgba(30,45,65,0.75)" clipPath="url(#mapClip)" />
      <polyline points={coastPts} fill="none" stroke="rgba(180,210,240,0.35)"
        strokeWidth="1.5" strokeLinejoin="round" clipPath="url(#mapClip)" />

      {[
        { name: "San Francisco", lat: 37.8, lon: -122.5 },
        { name: "Los Angeles",   lat: 34.0, lon: -118.5 },
        { name: "San Diego",     lat: 32.7, lon: -117.2 },
      ].map((city) => (
        <g key={city.name}>
          <circle cx={toX(city.lon)} cy={toY(city.lat)} r="2.5" fill="rgba(200,220,240,0.5)" />
          <text x={toX(city.lon) + 6} y={toY(city.lat) + 4}
            fill="rgba(200,220,240,0.45)" fontSize="9" fontFamily="sans-serif">
            {city.name}
          </text>
        </g>
      ))}

      {floats.map((f, i) => {
        const x = toX(f.lon);
        const y = toY(f.lat);
        if (x < 0 || x > W || y < 0 || y > H) return null;
        const col = sstColor(f.sst);
        const isSelected = i === selected;
        const delay = (i * 0.28) % 2;
        return (
          <g key={f.id || i} style={{ cursor: "pointer" }} onClick={() => onSelect(i)}>
            <circle cx={x} cy={y} r="5" fill="none" stroke={col} strokeWidth="1.5"
              opacity={visible ? 0.8 : 0}
              style={{ transformOrigin: "center", transformBox: "fill-box",
                animation: visible ? `argoRing 2.4s ${delay}s ease-out infinite` : "none" }} />
            <circle cx={x} cy={y} r="5" fill="none" stroke={col} strokeWidth="1"
              opacity={visible ? 0.5 : 0}
              style={{ transformOrigin: "center", transformBox: "fill-box",
                animation: visible ? `argoRing 2.4s ${delay + 1.2}s ease-out infinite` : "none" }} />
            <circle cx={x} cy={y} r={isSelected ? 7 : 4.5} fill={col}
              opacity={visible ? 1 : 0} filter="url(#floatGlow)"
              style={{ transition: "r 0.3s ease, opacity 0.6s ease",
                animation: visible ? `argoBlink 3s ${delay}s ease-in-out infinite` : "none" }} />
            {isSelected && (
              <circle cx={x} cy={y} r="11" fill="none" stroke="#ffffff"
                strokeWidth="1.5" opacity="0.7" filter="url(#softGlow)" />
            )}
            {isSelected && f.sst != null && (
              <g>
                <rect x={x + 10} y={y - 16} width="52" height="18" rx="5" fill="rgba(0,10,30,0.85)" />
                <text x={x + 14} y={y - 3} fill="#fff" fontSize="10" fontWeight="600">
                  {f.sst.toFixed(1)}°C
                </text>
              </g>
            )}
          </g>
        );
      })}

      <rect x="0" y="0" width={W} height={H} fill="none"
        stroke="rgba(72,202,228,0.15)" strokeWidth="1" />
    </svg>
  );
}

// ─── DepthProfile ──────────────────────────────────────────────────────────────

export function DepthProfile({ profile, visible }) {
  if (!profile || profile.length < 2) return null;

  const W = 560, H = 260;
  const PAD = { top: 24, right: 40, bottom: 44, left: 60 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const maxPres = Math.min(Math.max(...profile.map((p) => p.pres)), 2000);
  const minTemp = Math.min(...profile.map((p) => p.temp)) - 0.5;
  const maxTemp = Math.max(...profile.map((p) => p.temp)) + 0.5;

  const xS = (t) => PAD.left + ((t - minTemp) / (maxTemp - minTemp)) * iW;
  const yS = (prs) => PAD.top + (prs / maxPres) * iH;

  const points = profile
    .filter((m) => m.pres <= maxPres)
    .map((m) => `${xS(m.temp)},${yS(m.pres)}`)
    .join(" ");

  const yTicks = [0, 200, 500, 1000, 1500, 2000].filter((p) => p <= maxPres);
  const xTicks = [];
  for (let t = Math.ceil(minTemp); t <= Math.floor(maxTemp); t += 2) xTicks.push(t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: `${W}px`, height: "auto" }}>
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

      <rect x={PAD.left} y={PAD.top} width={iW} height={iH} fill="rgba(2,10,25,0.6)" />

      {[
        { y0: 0,    y1: 200,  color: "rgba(72,202,228,0.04)",  label: "Epipelagic"  },
        { y0: 200,  y1: 1000, color: "rgba(0,100,180,0.04)",   label: "Mesopelagic" },
        { y0: 1000, y1: 2000, color: "rgba(0,20,60,0.08)",     label: "Bathypelagic"},
      ]
        .filter((b) => b.y0 < maxPres)
        .map((b) => (
          <g key={b.label}>
            <rect x={PAD.left} y={yS(b.y0)} width={iW}
              height={yS(Math.min(b.y1, maxPres)) - yS(b.y0)} fill={b.color} />
            <text x={PAD.left + iW - 4} y={yS(b.y0) + 12}
              textAnchor="end" fill="rgba(100,160,200,0.25)" fontSize="8" fontStyle="italic">
              {b.label}
            </text>
          </g>
        ))}

      {yTicks.map((p) => (
        <line key={p} x1={PAD.left} y1={yS(p)} x2={PAD.left + iW} y2={yS(p)}
          stroke="rgba(72,202,228,0.07)" strokeWidth="1" strokeDasharray="3 5" />
      ))}

      <polygon
        points={[
          `${PAD.left},${PAD.top}`,
          ...profile.filter((m) => m.pres <= maxPres).map((m) => `${xS(m.temp)},${yS(m.pres)}`),
          `${PAD.left},${yS(Math.min(maxPres, profile[profile.length - 1].pres))}`,
        ].join(" ")}
        fill="url(#profileGrad)"
      />

      <polyline points={points} fill="none" stroke="url(#profileLine)"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#lineGlow)"
        style={{ strokeDasharray: 1200, strokeDashoffset: visible ? 0 : 1200, transition: "stroke-dashoffset 2s ease" }} />

      {profile.filter((m) => m.pres <= maxPres).map((m, i) => (
        <circle key={i} cx={xS(m.temp)} cy={yS(m.pres)} r="2.5"
          fill={sstColor(m.temp)} opacity={visible ? 0.9 : 0}
          style={{ transition: `opacity ${0.4 + i * 0.06}s ease` }} />
      ))}

      {yTicks.map((p) => (
        <text key={p} x={PAD.left - 8} y={yS(p) + 4}
          textAnchor="end" fill="rgba(150,200,240,0.5)" fontSize="10">
          {p === 0 ? "surface" : `${p}m`}
        </text>
      ))}

      <text transform={`rotate(-90) translate(-${PAD.top + iH / 2}, 14)`}
        textAnchor="middle" fill="rgba(150,200,240,0.35)" fontSize="9" letterSpacing="1">
        DEPTH (m)
      </text>

      {xTicks.map((t) => (
        <text key={t} x={xS(t)} y={H - 10} textAnchor="middle"
          fill="rgba(150,200,240,0.5)" fontSize="10">
          {t}°C
        </text>
      ))}

      <text x={PAD.left + iW / 2} y={H - 2} textAnchor="middle"
        fill="rgba(150,200,240,0.35)" fontSize="9" letterSpacing="1">
        TEMPERATURE (°C)
      </text>

      {visible && profile[0] && (
        <g>
          <line x1={xS(profile[0].temp)} y1={PAD.top}
            x2={xS(profile[0].temp)} y2={yS(Math.min(150, maxPres))}
            stroke="#f9c74f" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <rect x={xS(profile[0].temp) - 28} y={PAD.top - 18} width="56" height="17"
            rx="5" fill="rgba(249,199,79,0.9)" />
          <text x={xS(profile[0].temp)} y={PAD.top - 5}
            textAnchor="middle" fill="#000" fontSize="10" fontWeight="700">
            SST {profile[0].temp.toFixed(1)}°C
          </text>
        </g>
      )}
    </svg>
  );
}
