import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { saveResult } from '../api';

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

// Keys match the backend animal names exactly (localScore codeMap)
const ANIMAL_DATA = {
  // ── Hunters (Deep + Predator) ──────────────────────────────────────────────
  'Great White Shark': {  // DCPS
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
  'Barracuda': {  // DCPF — Hunters
    nickname: "The Relentless Pursuer",
    strengths: ["Tenacious", "Decisive", "Bold", "Adaptable"],
    description: "You pursue goals with unwavering intensity, changing direction without losing speed. Where others hesitate at the edge of chaos, you accelerate into it. Your adaptability isn't indecision — it's superior agility. You don't just chase opportunity; you outpace it.",
    parallels: "Barracudas can reach 43 mph in short bursts — combining explosive speed with a predator's patience for exactly the right moment. You know when to wait and exactly when to strike.",
    interactions: {
      Hunters:   "Mutual respect for intensity and outcomes. You push each other to move faster and think sharper.",
      Wanderers: "They introduce angles you hadn't considered. You give their exploration a target. An effective combination.",
      Guardians: "Their sustained effort matches your bursts. When you align on a goal, execution is relentless.",
      Builders:  "You provide the momentum; they provide the precision. Together you hit targets others can't reach.",
    },
  },
  'Moray Eel': {  // DCNS — Wanderers
    nickname: "The Hidden Depth",
    strengths: ["Perceptive", "Patient", "Intense", "Unconventional"],
    description: "You are misread at first — and that's fine with you. Moray eels appear solitary but maintain long-term relationships with cleaner shrimp partners. You hold your world tightly, reveal yourself selectively, and reward those who take time to understand you with a loyalty that's almost geological in its depth.",
    parallels: "Moray eels have a second set of jaws — the pharyngeal jaw — that shoots forward to grip prey. Your second layer is your emotional intelligence: hidden, precise, and more powerful than anyone expecting only your surface.",
    interactions: {
      Hunters:   "They'll underestimate your depth. Let them — until the moment they see your full capability.",
      Wanderers: "Kindred spirits who understand the value of the unseen. Deep trust forms slowly but lasts.",
      Guardians: "They appreciate your consistency and depth. You appreciate their reliability. A quiet but profound bond.",
      Builders:  "They're intrigued by your unconventional mind. You provide angles their structured thinking wouldn't reach.",
    },
  },
  'Mantis Shrimp': {  // DCNF — Wanderers
    nickname: "The Chromatic Innovator",
    strengths: ["Perceptive", "Creative", "Empathetic", "Curious"],
    description: "You see the world in spectrums others literally cannot perceive. Mantis shrimp have 16 photoreceptors — humans have 3. Your emotional and creative bandwidth works the same way: you pick up nuance, subtext, and possibility in environments that appear flat to everyone else. Your care for people is as sharp as your creativity.",
    parallels: "Mantis shrimp are one of the few animals known to form monogamous pair bonds lasting up to 20 years. Your depth of loyalty and care is as extraordinary as your perception — and just as rarely fully understood.",
    interactions: {
      Hunters:   "You introduce color into their black-and-white world. They give your creativity a concrete target.",
      Wanderers: "Your most natural kin. Both explorers of the invisible. Conversations here go extraordinary places.",
      Guardians: "They provide the structure that lets your creativity sustain itself. A deeply enabling relationship.",
      Builders:  "Powerful pairing — your perceptive creativity combined with their systematic approach produces real breakthroughs.",
    },
  },
  'Sea Turtle': {  // DRPS — Hunters
    nickname: "The Ancient Strategist",
    strengths: ["Patient", "Strategic", "Principled", "Enduring"],
    description: "You navigate by instinct refined over millennia. Sea turtles travel thousands of miles without GPS, guided by the Earth's own magnetic field — and you carry that same internal compass. You are unhurried but never lost, deliberate but never slow. Your patience is a weapon; your principles are your armor.",
    parallels: "Sea turtles have outlasted five mass extinctions — not through aggression, but through perfect calibration to what endures. You win by being right for longer than others can sustain being wrong.",
    interactions: {
      Hunters:   "You provide strategic depth they sometimes lack. They provide urgency that sharpens your timing.",
      Wanderers: "You give their curiosity a framework. They remind you that exploration has its own value.",
      Guardians: "Deep alignment — both of you think in the long game. Together you build things that outlast any individual effort.",
      Builders:  "Your strategic patience gives their innovations room to fully develop before they're released.",
    },
  },
  'Manta Ray': {  // DRPF — Hunters
    nickname: "The Soaring Visionary",
    strengths: ["Visionary", "Intuitive", "Independent", "Graceful"],
    description: "You glide above the ordinary with effortless power, seeing patterns others miss from below. Manta rays are the ocean's largest filter feeders — gathering vast amounts of input and distilling only what nourishes. You process more information than you show, and your insights arrive as quiet certainties rather than loud proclamations.",
    parallels: "Manta rays breach the ocean surface dramatically but rarely — choosing the moment carefully. You operate the same way: most of your power is invisible, surfacing only when the moment demands it.",
    interactions: {
      Hunters:   "You bring a perspective from altitude that ground-level hunters need. They help you commit to action from vision.",
      Wanderers: "Complementary souls — both of you see beyond the immediate. You process it differently but reach similar truths.",
      Guardians: "You inspire them with the view from above. They ground your vision in what's actually achievable.",
      Builders:  "Your pattern recognition gives their systems a map. You help them build toward something worth reaching.",
    },
  },
  'Flying Fish': {  // DRNS — Wanderers
    nickname: "The Boundary Breaker",
    strengths: ["Adventurous", "Empathetic", "Imaginative", "Resilient"],
    description: "You refuse to be limited to one element. Flying fish are the only fish that routinely leave their medium — gliding above the surface for 200 meters on transparent wings. You're rooted in feeling and connection, but always reaching beyond the expected. You bring others with you when you leap; you don't just escape, you elevate.",
    parallels: "Flying fish leap to escape predators, but what evolved as survival became transcendence. Your greatest strength is the same: what others experience as pressure, you convert into a breakthrough.",
    interactions: {
      Hunters:   "Your leaps inspire them to think outside their usual range. You show them horizons they hadn't aimed for.",
      Wanderers: "Natural companions. Both of you cross boundaries others treat as fixed. Together you go further.",
      Guardians: "They appreciate your resilience and care for others. You benefit from their grounding influence.",
      Builders:  "You provide the imaginative leaps; they construct the landing platforms. A remarkably productive dynamic.",
    },
  },
  'Jellyfish': {  // DRNF — Wanderers
    nickname: "The Free Spirit",
    strengths: ["Intuitive", "Adaptive", "Open-Hearted", "Peaceful"],
    description: "You move with the current and find meaning in every direction. Jellyfish have no brain, no heart — only sensation, only now. You live in the present with a grace that others find both mysterious and magnetic. You don't impose, you don't compete — you flow. Your openness creates space for others to be exactly who they are.",
    parallels: "Jellyfish are among the oldest animals on Earth — more than 500 million years of survival. Their simplicity is not a flaw; it is precisely why they outlasted almost everything else. You endure by refusing to be brittle, by bending where others break.",
    interactions: {
      Hunters:   "You puzzle them — and they need exactly that. You show them a way of being their approach cannot access.",
      Wanderers: "Your most natural kin. Together you drift into experiences that feel less like plans and more like coming home.",
      Guardians: "They cherish your openness. You help them feel the warmth beneath their careful structures.",
      Builders:  "They help you give form to your feelings. It doesn't diminish your freedom — it gives it somewhere to land.",
    },
  },
  'Humpback Whale': {  // RCPS — Guardians
    nickname: "The Resonant Leader",
    strengths: ["Inspiring", "Principled", "Decisive", "Communal"],
    description: "Your presence changes the room — like a humpback's song that travels a thousand miles through water. You lead through resonance rather than volume, through example rather than instruction. You are socially fluent and decisively protective: you know your community deeply and defend it fiercely when needed.",
    parallels: "Humpback whales are documented protecting other species from orca attacks — an altruism researchers still study. You extend your protection beyond your own group, driven by principle rather than proximity.",
    interactions: {
      Hunters:   "You share decisiveness but offer the social intelligence they often lack. They follow your lead when they trust you.",
      Wanderers: "You offer them a safe harbor and a larger cause. They bring the spontaneity that keeps your community alive.",
      Guardians: "Deeply aligned. Both protective, principled, socially embedded. A natural leadership pairing.",
      Builders:  "Your vision gives their work meaning. They build the infrastructure that makes your community sustainable.",
    },
  },
  'Dolphin': {  // RCPF — Guardians
    nickname: "The Insightful Connector",
    strengths: ["Empathetic", "Playful", "Strategic", "Collaborative"],
    description: "You are the ocean's social genius — combining a predator's effectiveness with genuine community warmth. Dolphins hunt cooperatively, play deliberately, and form alliances that last decades. You move between strategy and empathy with uncommon ease, making people feel both seen and challenged. You are driven to protect the people in your orbit.",
    parallels: "Dolphins teach skills to their young beyond survival basics — cultural transmission. You carry that same impulse: not just to succeed, but to bring others forward with you.",
    interactions: {
      Hunters:   "You soften their edges without dulling their effectiveness. They learn from how you make people feel valued.",
      Wanderers: "You provide direction they sometimes lack. They provide spontaneity you genuinely enjoy. Rich partnership.",
      Guardians: "Deep natural alignment. Both socially driven and protective. Together you build resilient communities.",
      Builders:  "You provide the human insight that makes their systems land well. A necessary and valued partnership.",
    },
  },
  'Octopus': {  // RCNS — Builders
    nickname: "The Creative Mastermind",
    strengths: ["Strategic", "Creative", "Adaptable", "Independent"],
    description: "You are the ocean's most intelligent shapeshifter. Octopuses have three hearts, blue blood, and a neural cluster in every arm — and so do you, in a sense. You solve problems from multiple directions simultaneously, camouflage your true strategy until the perfect moment, and create solutions so lateral that no one else saw the angle.",
    parallels: "Octopuses are one of the only invertebrates that use tools — collecting shells, using coconut halves as portable armor. You build solutions from whatever is available, turning constraints into creative advantages.",
    interactions: {
      Hunters:   "You respect their decisiveness; they respect your cleverness. Together you operate at a different level entirely.",
      Wanderers: "You share curiosity but differ in focus. They bring color; you bring structure to it. A rich partnership.",
      Guardians: "They provide the emotional stability that lets your mind roam freely. Don't underestimate this.",
      Builders:  "Your natural home. You think alike, build alike, and challenge each other in exactly the ways that matter.",
    },
  },
  'Seahorse': {  // RCNF — Builders
    nickname: "The Steadfast Craftsperson",
    strengths: ["Patient", "Precise", "Caring", "Dependable"],
    description: "You are the ocean's most methodical builder. Seahorses hover with surgical precision using their dorsal fins while their prehensile tails anchor them to exactly where they need to be. You build carefully placed, precisely executed, never rushed. Your care for others is embedded in the quality of what you make.",
    parallels: "Seahorses greet their partner daily with a synchronized dance — maintaining relationship through consistent, deliberate ritual. You build trust the same way: through reliability so steady it becomes its own kind of beauty.",
    interactions: {
      Hunters:   "Your precision complements their decisiveness. They generate momentum; you ensure nothing is wasted.",
      Wanderers: "They bring you ideas you'd never generate alone. You help them land those ideas in reality.",
      Guardians: "Your care and their protection create a deeply safe and productive space for others.",
      Builders:  "Your most natural home. Mutual respect for craft and care. Together you build things that endure.",
    },
  },
  'Clownfish': {  // RRPS — Guardians
    nickname: "The Spirited Protector",
    strengths: ["Courageous", "Loyal", "Resilient", "Community-Minded"],
    description: "You are small in scale but enormous in impact. Clownfish are among the most aggressively territorial reef defenders — despite being a fraction of the size of most threats. You protect your space, your people, and your values with a ferocity that surprises those who underestimate you. And you do it from within a community that nourishes you in return.",
    parallels: "Clownfish and anemones evolved mutual immunity — each protecting the other from predators. You build the same kind of relationships: deeply reciprocal, where protection flows both ways without keeping score.",
    interactions: {
      Hunters:   "You match their protective energy. Differences in scale don't matter when purpose aligns.",
      Wanderers: "You offer them a home base to return to. They bring novelty that keeps your world from calcifying.",
      Guardians: "Your natural community. Both driven to protect what you love. Together you are formidable.",
      Builders:  "You give their creations a constituency — people who genuinely care. They build you better tools.",
    },
  },
  'Sea Otter': {  // RRPF — Guardians
    nickname: "The Nurturing Guardian",
    strengths: ["Caring", "Resourceful", "Principled", "Joyful"],
    description: "You are the reef's most deliberate protector — not through force, but through care. Sea otters maintain kelp forests by controlling urchin populations; without them, entire ecosystems collapse. You play the same role in your communities: maintaining the invisible infrastructure of relationships that everyone else takes for granted.",
    parallels: "Sea otters hold hands while sleeping so they don't drift apart. You hold communities together the same way — through consistent, affectionate presence that looks effortless and is in fact your greatest work.",
    interactions: {
      Hunters:   "Your care grounds their intensity. They provide decisive energy that complements your sustained nurture.",
      Wanderers: "You create the safe harbor they need when they've drifted too far. They bring you stories and new light.",
      Guardians: "A deep natural kinship. Both of you protect through presence. Together you are nearly unassailable.",
      Builders:  "You help their work reach the people who need it. They appreciate your care more than they express.",
    },
  },
  'Hermit Crab': {  // RRNS — Builders
    nickname: "The Adaptive Maker",
    strengths: ["Resourceful", "Collaborative", "Practical", "Empathetic"],
    description: "You build your world from what's available — and you do it beautifully. Hermit crabs participate in organized 'vacancy chains' where dozens of crabs exchange shells simultaneously so everyone upgrades. Your genius is the same: you see surplus where others see waste, and you build systems where everyone benefits.",
    parallels: "Hermit crab vacancy chains require trust and timing — each crab releasing its shell before the next is secured. You operate on that same trust: you let go of what you've built to help others, knowing the community you create will provide something better.",
    interactions: {
      Hunters:   "You make their boldness practical. They make your systems more ambitious. A productive tension.",
      Wanderers: "They bring you raw material — new ideas, new perspectives. You build the thing they were gesturing toward.",
      Guardians: "Both of you care about the collective. You build; they protect. A complete partnership.",
      Builders:  "Your natural family. You all see what could be made from what exists. Together you create ecosystems.",
    },
  },
  'Coral Polyp': {  // RRNF — Builders
    nickname: "The Foundation Builder",
    strengths: ["Patient", "Community-Oriented", "Persistent", "Nurturing"],
    description: "You build the infrastructure that makes everything else possible. Coral polyps are individually tiny — but collectively they have built structures visible from space, sustained by millions of years of patient accretion. Your contributions seem incremental until suddenly the reef exists because of you, and everything alive on it depends on what you built.",
    parallels: "A single coral polyp lives and builds for decades. The reef it contributes to will outlast every individual creature it shelters by millennia. Your work operates on that same timescale — not optimized for applause, but for permanence.",
    interactions: {
      Hunters:   "They protect the reef you're building. You give their intensity a structure worth defending.",
      Wanderers: "They bring biodiversity to your reef — new ideas and energy that make the ecosystem richer.",
      Guardians: "The deepest alliance. Both of you build for the long term. Together your work outlasts everything else.",
      Builders:  "Your natural home. You are the patient foundation they all build upon. Nothing here is wasted.",
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

  async function handleSignupSubmit(e) {
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
      // 1. Try to sign up the user
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: { data: { name: trimmedName } }
      });

      // 2. If they already exist, log them in instead
      if (authError && authError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signInError) throw signInError;
        authData = signInData;
      } else if (authError) {
        throw authError;
      }

      // 3. Save their animal result to the backend profiles table
      const userId = authData.user.id;
      await saveResult(userId, code, animal, group);

      // 4. Move to dashboard
      setShowSignup(false);
      navigate('/dashboard', {
        state: { group, userName: trimmedName, email: trimmedEmail },
      });

    } catch (err) {
      setSignupError(err.message);
    }
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
