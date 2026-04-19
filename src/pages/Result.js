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

// ─── Personality data for all 16 animals ─────────────────────────────────────

const ANIMAL_DATA = {
  'Great White Shark': {
    nickname: "The Apex Architect",
    strengths: ["Decisive", "Analytical", "Disciplined", "Strategic"],
    description: "You are the ocean's most efficient predator — not through aggression, but through precision and relentless focus. Logic is your first language; structure is your competitive edge. You plan before you act, and when you move, you rarely miss. Your depth of mind gives you access to insights others never surface.",
    parallels: "Great white sharks conserve energy between hunts, striking only when conditions are perfect. Like them, you don't waste effort — you accumulate it until the moment demands everything. Think chess grandmasters, elite engineers, and scientists who solve what others abandon.",
    interactions: {
      Hunters:   "Immediate mutual respect — you share the same drive for results and efficiency. Competition between you is productive rather than destructive.",
      Wanderers: "They bring spontaneity that sharpens your rigid edges. You give them the structure they secretly crave. Friction here is generative.",
      Builders:  "You admire their ingenuity; they respect your decisiveness. Together you execute complex work from vision to completion without flinching.",
      Guardians: "Their patience complements your urgency. They remind you that the mission matters beyond the metrics — an important recalibration.",
    },
  },
  'Hammerhead Shark': {
    nickname: "The Tactical Nomad",
    strengths: ["Observant", "Decisive", "Adaptable", "Tenacious"],
    description: "You possess the hunter's instinct but refuse to be contained. Like the hammerhead's wide-set eyes, you see angles others miss — then act on them with conviction. You're driven by outcomes, but you find your own path to them. Spontaneous strategy is your most dangerous superpower.",
    parallels: "Hammerhead sharks use their uniquely shaped heads to sense electromagnetic fields other sharks cannot detect. You pick up signals in any environment that others overlook, turning raw observation into decisive, well-timed action.",
    interactions: {
      Hunters:   "Fellow outcome-focused predators who respect your lateral thinking. You bring a fresh angle to group strategy that keeps everyone unpredictable.",
      Wanderers: "A natural kinship — both free-roaming, both results-minded. You push each other toward bolder leaps than either would take alone.",
      Builders:  "They appreciate your ability to improvise around constraints. You may clash on planning style, but deep mutual respect is underneath.",
      Guardians: "Their steadiness grounds your nomadic energy. You protect their causes; they protect your blind spots.",
    },
  },
  'Orca': {
    nickname: "The Strategic Protector",
    strengths: ["Empathetic", "Strategic", "Loyal", "Leadership"],
    description: "You combine the hunter's mind with the guardian's heart — a rare and powerful pairing. Orcas don't just hunt; they teach, coordinate, and remember across generations. You are driven by logic but guided by the bonds you build. Structure keeps your world safe; the people within it are the reason you maintain it.",
    parallels: "Orca pods are matriarchal societies with decades of shared cultural memory. You're the person who remembers everyone's strengths, who held the team together during the hard quarter, who never lets strategy become cold.",
    interactions: {
      Hunters:   "You speak their language but bring the emotional intelligence they often lack. They follow your lead when trust is established.",
      Wanderers: "Your structure can feel restrictive to them, but your genuine care disarms resistance. Give them ownership within your frame.",
      Builders:  "Deep mutual respect — you value their craft, they value your vision. An ideal co-leadership pairing.",
      Guardians: "Your strongest alliance. Both loyal, patient, and mission-driven — together you are nearly unstoppable.",
    },
  },
  'Manta Ray': {
    nickname: "The Deep Empath",
    strengths: ["Perceptive", "Empathetic", "Reflective", "Adaptable"],
    description: "You glide through depth and current with effortless grace, processing the world through feeling and pattern. You prefer to move with life rather than against it. Solitude restores you; genuine connection fulfills you. People are drawn to your calm and your uncanny ability to understand them without judgment.",
    parallels: "Manta rays filter thousands of gallons of water, retaining only what nourishes them. You do the same with experience — filtering out noise, keeping meaning. Often described as the kind of person others call at 2am.",
    interactions: {
      Hunters:   "Your depth gives them something to think about. They're drawn to your stillness and helped to slow down long enough to see what they've been swimming past.",
      Wanderers: "A kindred soul. Both of you sense more than you say. Conversations together go places others never reach.",
      Builders:  "Your emotional insight helps them build things that actually matter to people — not just things that technically work.",
      Guardians: "Beautifully aligned. You both care without condition and think in long arcs. A quiet but powerful pairing.",
    },
  },
  'Barracuda': {
    nickname: "The Visionary Hunter",
    strengths: ["Intuitive", "Bold", "Focused", "Structured"],
    description: "You see the future others can't yet perceive, and you hunt it with a plan. Your gut-level pattern recognition is your compass, but execution is structured and deliberate. Others may call you intense — you call it clarity. You want to be three moves ahead, with the discipline to capitalize when the moment arrives.",
    parallels: "The barracuda targets prey from distance, then closes with astonishing speed — foresight and explosive execution combined. Think founders who sensed a market shift before the data confirmed it, then were ready when it arrived.",
    interactions: {
      Hunters:   "Competitive respect — you each hunt differently. Find common ground in outcomes rather than debating method.",
      Wanderers: "They love your vision but resist your structure. Give them creative latitude within your strategic frame and watch what happens.",
      Builders:  "Your vision gives them a target; their craft turns your instincts into reality. A high-output pairing.",
      Guardians: "They ground your intensity with wisdom. Listen to them — they see risks that your speed creates before you do.",
    },
  },
  'Swordfish': {
    nickname: "The Bold Pioneer",
    strengths: ["Courageous", "Visionary", "Independent", "Intense"],
    description: "You were made to move through uncharted water. Swordfish dive to crushing depths without a plan, trusting their power to carry them through — and you operate the same way: vision-led, pressure-tested, radically free. Structure feels like a cage. You innovate best when no one has defined where the finish line is.",
    parallels: "Swordfish are among the fastest fish alive, capable of 97km/h bursts into the deep. You bring that same explosive energy to ideas and decisions. Artistic directors, explorers, and innovators who disrupt entire fields by refusing to accept the existing map.",
    interactions: {
      Hunters:   "Fellow intensity, different approach. They plan; you improvise. Together you're formidable when you respect the difference rather than competing over it.",
      Wanderers: "Your most natural alliance — both value freedom and exploration. Partnerships here feel alive in a way others rarely do.",
      Builders:  "They can channel your boldness into tangible breakthroughs. Don't dismiss their process — it's what turns your vision into reality.",
      Guardians: "You challenge their comfort zones. They protect you from the consequences of your own velocity. Balance each other out.",
    },
  },
  'Dolphin': {
    nickname: "The Insightful Connector",
    strengths: ["Empathetic", "Curious", "Organized", "Collaborative"],
    description: "You are the rarest combination: genuinely deep and genuinely playful. Dolphins dive into dark waters and leap into sunlight with equal ease. You move between inner reflection and outer connection without losing either. You understand people at the level of their actual needs — not what they say, but what they mean — and you bring enough structure to turn that care into action.",
    parallels: "Dolphins are one of the few species that help others outside their own kind — rescuing swimmers, befriending whales. You're the person who checks in on everyone, who remembers the details, who makes the connections that move the whole network forward.",
    interactions: {
      Hunters:   "You soften their edges without dulling their effectiveness. They quietly learn from watching how you make people feel valued.",
      Wanderers: "Your kindred spirits. You bring slightly more structure; they bring slightly more spontaneity. The overlap is rich and productive.",
      Builders:  "You provide the human insight that makes their creations land emotionally. A necessary and deeply valued partnership.",
      Guardians: "Deep mutual affinity. Both of you care at scale. The combination is quiet, consistent, and a genuine force for change.",
    },
  },
  'Sea Horse': {
    nickname: "The Gentle Dreamer",
    strengths: ["Imaginative", "Empathetic", "Patient", "Authentic"],
    description: "You drift with intention. Sea horses don't swim fast — they anchor with their tails and observe. You understand that stillness is not weakness; it is wisdom. You dream in images, feel in layers, and move through the world with an authenticity that draws people in without effort. You are the calm center in someone else's storm.",
    parallels: "Sea horses are among the most patient hunters in the ocean, waiting perfectly still for prey to drift within range. Like them, you know that what matters most comes to you when you're truly present — not when you chase it.",
    interactions: {
      Hunters:   "They admire your calm, even when they don't understand it. You show them a kind of strength that doesn't announce itself.",
      Wanderers: "Fellow dreamers who validate your inner world without requiring explanation. These relationships feel easy and deeply meaningful.",
      Builders:  "They help you manifest what you imagine. You help them stay connected to the why behind what they build.",
      Guardians: "A natural home. Your gentleness and their stability create something rare: a space where people can just be.",
    },
  },
  'Blue Whale': {
    nickname: "The Steadfast Commander",
    strengths: ["Decisive", "Principled", "Reliable", "Grounded"],
    description: "You are the largest force in any room — not through volume, but through presence and consistency. Blue whales don't fight for position; they simply exist at a scale that reshapes the ocean around them. You set direction with facts, operate with structure, and your reliability is your reputation. People follow you because you have never let them down.",
    parallels: "The blue whale's heartbeat is so low-frequency it can be heard two miles away. You operate at a frequency others feel before they understand it — steady, deep, undeniable. The person organizations and communities quietly build around.",
    interactions: {
      Hunters:   "You share decisiveness. They move faster; you move farther. Mutual respect is immediate and enduring.",
      Wanderers: "Your groundedness is exactly what they need when they've drifted too far. You bring them back without making them feel diminished.",
      Builders:  "Your structured thinking gives their creativity direction. An effective executive-creative partnership with high output.",
      Guardians: "Deep kinship — both of you think in the long term and care about what endures beyond any single project.",
    },
  },
  'Mantis Shrimp': {
    nickname: "The Adaptive Innovator",
    strengths: ["Creative", "Perceptive", "Resourceful", "Decisive"],
    description: "You see sixteen color channels where others see three. The mantis shrimp is the ocean's most underestimated genius — overlooked until it strikes with the force of a bullet. You combine social fluency with an explosive creative mind, solving problems others haven't learned to see yet, and doing it faster than anyone expects.",
    parallels: "The mantis shrimp's punch generates cavitation bubbles hitting with 1500 Newtons of force. You hit problems that hard — sudden, thorough, and with elegant precision. Engineers and designers who combine aesthetic intelligence with analytical firepower.",
    interactions: {
      Hunters:   "They respect your decisiveness; you respect their focus. Combine for high-precision execution that neither could achieve alone.",
      Wanderers: "You both love novelty but approach it differently. Wanderers inspire your next unexpected breakthrough.",
      Builders:  "Your natural tribe. Creative, technical, ambitious — together you build things that shouldn't exist yet, but do.",
      Guardians: "Their patience grounds your reactive energy. You benefit most from listening to them before you strike.",
    },
  },
  'Sea Turtle': {
    nickname: "The Ancient Guardian",
    strengths: ["Patient", "Wise", "Dependable", "Empathetic"],
    description: "You carry thousands of years of ocean memory in your bones. Sea turtles have outlasted mass extinctions by knowing exactly what matters and ignoring everything else. You are steady where others panic, consistent where others drift. You protect quietly — not through force, but through unwavering presence. People don't always notice your support until it's gone.",
    parallels: "Sea turtles navigate back to the exact beach where they were born — across decades and thousands of miles of open ocean. You have the same homing instinct: your values are your coordinates, and you never truly lose your way.",
    interactions: {
      Hunters:   "Your wisdom complements their speed. They make things happen quickly; you make sure those things actually last.",
      Wanderers: "You offer them a safe harbor they didn't know they needed. They bring you joy that you sometimes forget to seek.",
      Builders:  "You understand the long arc; they build within it. Together you create work with lasting rather than fleeting impact.",
      Guardians: "A deeply aligned union. You both know that the most important work is done quietly, over time, without announcement.",
    },
  },
  'Manatee': {
    nickname: "The Peaceful Wanderer",
    strengths: ["Compassionate", "Open-Minded", "Gentle", "Intuitive"],
    description: "You move through life without agenda — curious, warm, and deeply at peace with yourself. Manatees evolved without natural predators because they chose harmony over conflict. You bring that same quality: you don't fight the current, you become it. People feel immediately safe around you, and you offer connection without conditions attached.",
    parallels: "Manatees communicate through sounds barely audible to humans — subtle, constant, meaningful below the noise. You communicate most effectively the same way: the check-in text, the remembered detail, the quiet presence that turns out to matter more than anyone said.",
    interactions: {
      Hunters:   "You disarm their intensity in ways that genuinely surprise them. They need you more than they would ever admit.",
      Wanderers: "Together you drift beautifully through experience. Some of your best memories and stories will come from this combination.",
      Builders:  "Your warmth makes their creative spaces feel genuinely human. They value your presence more than they express.",
      Guardians: "Your most natural home. The quiet care you give and receive here sustains everything else you do.",
    },
  },
  'Octopus': {
    nickname: "The Creative Mastermind",
    strengths: ["Strategic", "Creative", "Adaptable", "Independent"],
    description: "You are the ocean's most intelligent shapeshifter. Octopuses have three hearts, blue blood, and a neural cluster in every arm — and so do you, in a sense. You solve problems from multiple directions simultaneously, camouflage your true strategy until the perfect moment, and create solutions so lateral that no one else saw the angle. Your mind is your greatest instrument.",
    parallels: "Octopuses are one of the only invertebrates that use tools — collecting shells, using coconut halves as portable armor. You build solutions from whatever is available, turning constraints into creative advantages. Polymaths and system designers who disrupt by recombining.",
    interactions: {
      Hunters:   "You respect their decisiveness; they respect your cleverness. Combine your approaches for execution that operates at a different level entirely.",
      Wanderers: "You share curiosity but differ in focus. They bring color; you bring structure to it. A rich and productive creative partnership.",
      Builders:  "Your natural home. You think alike, build alike, and challenge each other in exactly the ways that matter.",
      Guardians: "They provide the emotional stability that lets your mind roam freely. Don't underestimate how much this relationship enables.",
    },
  },
  'Clownfish': {
    nickname: "The Spirited Innovator",
    strengths: ["Enthusiastic", "Resilient", "Creative", "Collaborative"],
    description: "You thrive in symbiosis — like the clownfish and the anemone, you create mutual benefit everywhere you go. You bring energy, ideas, and a willingness to try things that haven't been tried. Structure can feel limiting, but you're not chaotic — you're adaptive. People feel more creative around you because you make experimentation feel safe rather than reckless.",
    parallels: "Clownfish are immune to their anemone's venom through a unique biological adaptation — turning what kills others into their home. You have that same talent for thriving in environments that challenge others, and for finding safety in exactly what looks most dangerous.",
    interactions: {
      Hunters:   "Your enthusiasm complements their direction. They provide the goal; you spontaneously find ten ways to get there.",
      Wanderers: "Fellow free spirits who validate your approach. Creative partnerships here generate energy and output in equal measure.",
      Builders:  "You inspire them to take risks they wouldn't otherwise take. They give your ideas roots. This combination actually ships things.",
      Guardians: "Their steadiness gives you a foundation. You energize spaces they tend to keep too carefully stable.",
    },
  },
  'Starfish': {
    nickname: "The Quiet Anchor",
    strengths: ["Dependable", "Organized", "Empathetic", "Patient"],
    description: "You are quietly essential. Starfish reshape entire ecosystems without moving far — by existing steadily in place, they regulate what grows, what survives, what thrives around them. You operate the same way: structured, caring, and irreplaceable. You don't seek credit, but everything around you is better because you're in it.",
    parallels: "Starfish can regenerate from a single arm. You recover, regroup, and return — resilient without drama, consistent without disappearing. The person who holds the team together through transitions, who never misses a deadline, who everyone quietly depends on.",
    interactions: {
      Hunters:   "You provide stability they use as a launch pad. They push you toward bolder action; you keep them from losing sight of what matters.",
      Wanderers: "You offer structure they secretly need. They bring novelty into your careful world — receive it rather than managing it.",
      Builders:  "Tremendous mutual respect. You execute; they innovate. Together you actually complete the things others only start.",
      Guardians: "The deepest natural alliance. You both care without condition and build without requiring credit.",
    },
  },
  'Jellyfish': {
    nickname: "The Free Spirit",
    strengths: ["Intuitive", "Adaptive", "Open-Hearted", "Peaceful"],
    description: "You move with the current and find meaning in every direction. Jellyfish have no brain, no heart — only sensation, only now. You live in the present with a grace that others find both mysterious and magnetic. You don't impose, you don't compete — you flow. Your openness creates space for others to be exactly who they are.",
    parallels: "Jellyfish are among the oldest animals on Earth — more than 500 million years of survival. Their simplicity is not a flaw; it is precisely why they outlasted almost everything else. You endure by refusing to be brittle, by bending where others break.",
    interactions: {
      Hunters:   "You puzzle them — and they need exactly that. You show them a way of being that their approach simply cannot access.",
      Wanderers: "Your most natural kin. Together you drift into experiences that feel less like plans and more like coming home.",
      Builders:  "They help you give form to your feelings. Let them — it doesn't diminish your freedom, it gives it somewhere to land.",
      Guardians: "They cherish your openness. You help them feel the warmth that lives beneath their careful structures.",
    },
  },
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
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState(() => {
    try {
      const saved = localStorage.getItem('hymlSignup');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '',
          email: parsed.email || '',
          password: '',
        };
      }
    } catch {}

    return { name: '', email: '', password: '' };
  });
  const [signupError, setSignupError] = useState('');

  const result  = location.state?.result;
  const group   = result?.group   || 'Guardians';
  const animal  = result?.animal  || 'Sea Turtle';
  const code    = result?.code    || 'RCNS';
  const emoji   = result?.emoji   || '🐢';
  const desc    = result?.description
    || `As a ${animal}, you navigate life with patience and wisdom. Your ocean personality shapes how you connect, protect, and move through the world.`;
  const colors  = GROUP_COLORS[group] || GROUP_COLORS.Guardians;
  const scores  = location.state?.scores || [2, 2, 2, 2];

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

  function openSignup() {
    setSignupError('');
    setShowSignup(true);
  }

  function closeSignup() {
    setSignupError('');
    setShowSignup(false);
  }

  function handleSignupChange(e) {
    const { name, value } = e.target;
    setSignupForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSignupSubmit(e) {
    e.preventDefault();

    const trimmedName = signupForm.name.trim();
    const trimmedEmail = signupForm.email.trim();
    const trimmedPassword = signupForm.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setSignupError('Please fill in your name, email, and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setSignupError('Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    try {
      localStorage.setItem(
        'hymlSignup',
        JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          group,
          animal,
          code,
          joinedAt: new Date().toISOString(),
        })
      );
    } catch {}

    setShowSignup(false);
    navigate('/dashboard', {
      state: { group, userName: trimmedName, email: trimmedEmail },
    });
  }

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
          onClick={openSignup}
        >
          Join the {group} &nbsp;→
        </button>
      </section>

      {/* ── Personality divider ── */}
      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>Your Personality Profile</span>
        <div style={s.dividerLine} />
      </div>

      {/* ── Personality Section ── */}
      <PersonalitySection animal={animal} scores={scores} colors={colors} code={code} />

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
            onClick={openSignup}
          >
            Join {group} · Start Your Missions &nbsp;→
          </button>
        </div>
      </section>

      {showSignup && (
        <div style={s.signupOverlay} onClick={closeSignup}>
          <div style={s.signupModal} onClick={e => e.stopPropagation()}>
            <div style={s.signupHeader}>
              <p style={s.signupEyebrow}>Sign Up</p>
              <button type="button" style={s.signupClose} onClick={closeSignup}>
                X
              </button>
            </div>
            <h2 style={{ ...s.signupTitle, color: colors.secondary }}>
              Join the {group}
            </h2>
            <p style={s.signupSub}>
              Create your HYML account to save your ocean type and start missions for the {group}.
            </p>
            <form style={s.signupForm} onSubmit={handleSignupSubmit}>
              <input
                name="name"
                type="text"
                placeholder="Your name"
                value={signupForm.name}
                onChange={handleSignupChange}
                style={s.signupInput}
              />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={signupForm.email}
                onChange={handleSignupChange}
                style={s.signupInput}
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={handleSignupChange}
                style={s.signupInput}
              />
              {signupError && <div style={s.signupError}>{signupError}</div>}
              <button
                type="submit"
                style={{
                  ...s.signupSubmit,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                Create Account & Join {group}
              </button>
            </form>
          </div>
        </div>
      )}
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

// ─── Personality Section ─────────────────────────────────────────────────────

function PersonalitySection({ animal, scores, colors, code }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  const data = ANIMAL_DATA[animal];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setAnimated(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!data) return null;

  const dims = [
    { a: 'Deep',       b: 'Reef',      score: scores[0] },
    { a: 'Current',    b: 'Tide',      score: scores[1] },
    { a: 'Predator',   b: 'Nurturer',  score: scores[2] },
    { a: 'Structured', b: 'Flowing',   score: scores[3] },
  ];

  return (
    <section ref={ref} style={ps.section}>
      {/* Header */}
      <p style={ps.eyebrow}>Personality Profile</p>
      <h2 style={{ ...ps.nickname, color: colors.secondary }}>{data.nickname}</h2>
      <span style={{ ...ps.animalTag, color: colors.primary }}>{code} · {animal}</span>

      {/* Dimension bars */}
      <div style={ps.barsCard}>
        <p style={ps.barsEyebrow}>Dimension Analysis</p>
        {dims.map((d, i) => {
          const pct = Math.round((d.score / 4) * 100);
          const dominantA = d.score > 2;
          const neutral   = d.score === 2;
          const leftColor  = dominantA ? colors.secondary : neutral ? 'rgba(200,230,255,0.5)' : 'rgba(200,230,255,0.28)';
          const rightColor = (!dominantA && !neutral) ? colors.secondary : neutral ? 'rgba(200,230,255,0.5)' : 'rgba(200,230,255,0.28)';
          return (
            <div key={i} style={ps.barRow}>
              <span style={{ ...ps.barLabelLeft, color: leftColor }}>{d.a}</span>
              <div style={ps.barTrack}>
                <div style={{
                  ...ps.barFill,
                  width: animated ? `${pct}%` : '0%',
                  background: `linear-gradient(90deg, ${colors.primary}cc, ${colors.secondary})`,
                  transition: `width ${0.8 + i * 0.15}s ${i * 0.1}s ease`,
                }} />
              </div>
              <span style={{ ...ps.barLabelRight, color: rightColor }}>{d.b}</span>
              <span style={{ ...ps.barPct, color: colors.primary }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Strengths */}
      <div style={ps.strengthsRow}>
        <p style={ps.sectionLabel}>Core Strengths</p>
        <div style={ps.badges}>
          {data.strengths.map(str => (
            <span key={str} style={{
              ...ps.badge,
              background: colors.bg,
              borderColor: colors.primary + '55',
              color: colors.secondary,
            }}>
              {str}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={ps.descCard}>
        <p style={ps.descBody}>{data.description}</p>
      </div>

      {/* In the wild */}
      <div style={ps.parallelsBlock}>
        <p style={ps.sectionLabel}>In the Wild</p>
        <p style={ps.parallelsBody}>{data.parallels}</p>
      </div>

      {/* Group interactions */}
      <div style={ps.interactBlock}>
        <p style={ps.sectionLabel}>How You Connect</p>
        <div style={ps.interactGrid}>
          {Object.entries(data.interactions).map(([grp, text]) => {
            const gc = GROUP_COLORS[grp] || GROUP_COLORS.Guardians;
            return (
              <div key={grp} style={{
                ...ps.interactCard,
                background: gc.bg,
                borderColor: gc.primary + '30',
              }}>
                <p style={{ ...ps.interactGroup, color: gc.primary }}>{grp}</p>
                <p style={ps.interactText}>{text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const ps = {
  section: {
    position: 'relative', zIndex: 5,
    maxWidth: '860px', margin: '0 auto',
    padding: '20px 48px 80px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.55)', marginBottom: '14px',
  },
  nickname: {
    fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.5px',
  },
  animalTag: {
    display: 'block',
    fontSize: '13px', fontWeight: 600, letterSpacing: '2px', fontFamily: 'monospace',
    marginBottom: '44px',
  },
  barsCard: {
    background: 'linear-gradient(145deg, rgba(8,24,58,0.85), rgba(4,14,36,0.92))',
    border: '1px solid rgba(72,202,228,0.12)', borderRadius: '20px',
    padding: '30px 36px 18px', marginBottom: '28px', textAlign: 'left',
  },
  barsEyebrow: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'rgba(100,170,220,0.4)', marginBottom: '22px',
  },
  barRow: {
    display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px',
  },
  barLabelLeft: {
    fontSize: '13px', fontWeight: 600, minWidth: '88px', textAlign: 'right',
    letterSpacing: '0.2px', transition: 'color 0.3s',
  },
  barLabelRight: {
    fontSize: '13px', fontWeight: 600, minWidth: '88px', textAlign: 'left',
    letterSpacing: '0.2px', transition: 'color 0.3s',
  },
  barTrack: {
    flex: 1, height: '8px', background: 'rgba(255,255,255,0.07)',
    borderRadius: '4px', overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: '4px' },
  barPct: {
    fontSize: '12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    minWidth: '38px', textAlign: 'right',
  },
  strengthsRow: { marginBottom: '28px' },
  sectionLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'rgba(100,170,220,0.4)', marginBottom: '14px',
  },
  badges: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    padding: '8px 20px', borderRadius: '20px', border: '1px solid',
    fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px',
  },
  descCard: {
    background: 'linear-gradient(145deg, rgba(4,16,44,0.65), rgba(2,10,28,0.75))',
    border: '1px solid rgba(72,202,228,0.07)', borderRadius: '18px',
    padding: '28px 34px', marginBottom: '32px', textAlign: 'left',
  },
  descBody: {
    fontSize: '16px', color: 'rgba(210,235,255,0.82)', lineHeight: 1.85,
  },
  parallelsBlock: { marginBottom: '44px', textAlign: 'left' },
  parallelsBody: {
    fontSize: '14px', color: 'rgba(180,220,255,0.6)', lineHeight: 1.85, fontStyle: 'italic',
  },
  interactBlock: { textAlign: 'left' },
  interactGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px',
  },
  interactCard: { borderRadius: '16px', border: '1px solid', padding: '20px 22px' },
  interactGroup: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
    marginBottom: '8px',
  },
  interactText: {
    fontSize: '13px', color: 'rgba(200,230,255,0.65)', lineHeight: 1.72,
  },
};

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
  signupOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 10, 24, 0.72)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 50,
  },
  signupModal: {
    width: '100%',
    maxWidth: '460px',
    background: 'linear-gradient(145deg, rgba(6,18,45,0.96), rgba(2,10,25,0.98))',
    border: '1px solid rgba(72,202,228,0.14)',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 26px 80px rgba(0,0,0,0.45)',
  },
  signupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  signupEyebrow: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(72,202,228,0.58)',
  },
  signupClose: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(72,202,228,0.16)',
    background: 'rgba(255,255,255,0.03)',
    color: '#cfefff',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
  },
  signupTitle: {
    fontSize: '30px',
    fontWeight: 800,
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  signupSub: {
    fontSize: '14px',
    color: 'rgba(190,225,255,0.68)',
    lineHeight: 1.7,
    marginBottom: '22px',
  },
  signupForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  signupInput: {
    width: '100%',
    padding: '15px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(72,202,228,0.14)',
    background: 'rgba(5,16,40,0.82)',
    color: '#e8f4fd',
    fontSize: '14px',
    outline: 'none',
  },
  signupError: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.12)',
    color: '#fca5a5',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  signupSubmit: {
    marginTop: '4px',
    padding: '16px 18px',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 12px 30px rgba(0,0,0,0.24)',
  },
};
