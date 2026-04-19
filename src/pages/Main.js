import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const GROUPS = [
  {
    name: "Hunters",
    emoji: "🦈",
    desc: "Bold, driven, decisive. You cut through the current.",
  },
  {
    name: "Wanderers",
    emoji: "🐬",
    desc: "Free-spirited, curious, always exploring new depths.",
  },
  {
    name: "Builders",
    emoji: "🐙",
    desc: "Creative, strategic, weaving intricate solutions.",
  },
  {
    name: "Guardians",
    emoji: "🐢",
    desc: "Wise, steady, protecting what matters most.",
  },
];

const BUBBLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 7.5) % 84)}%`,
  size: `${7 + ((i * 3) % 14)}px`,
  delay: `${(i * 0.7) % 7}s`,
  duration: `${6 + ((i * 1.1) % 7)}s`,
  bottom: `${5 + ((i * 6) % 25)}%`,
}));

export default function Main() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const contactRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.bubblesWrap}>
        {BUBBLE_DATA.map((b) => (
          <div
            key={b.id}
            style={{
              position: "absolute",
              left: b.left,
              bottom: b.bottom,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              border: "1px solid rgba(100,200,255,0.28)",
              background:
                "radial-gradient(circle at 30% 30%, rgba(150,220,255,0.12), transparent)",
              animation: `bubble ${b.duration} ${b.delay} linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        <span style={styles.logo} onClick={() => navigate("/")}>
          HYML
        </span>
        <div style={styles.navLinks}>
          <span style={styles.navLink}>Sign In</span>
          <span style={styles.navLink} onClick={scrollToContact}>
            Contact
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          ...styles.hero,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 1s ease, transform 1s ease",
        }}
      >
        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Ocean-Based Type Indicator</p>
          <h1 style={styles.heroTitle}>
            What kind of
            <br />
            <span style={styles.accent}>ocean creature</span>
            <br />
            are you?
          </h1>
          <p style={styles.heroSub}>
            Dive deep. Discover your ocean personality.
            <br />
            Join your group and protect what matters.
          </p>
          <button style={styles.ctaBtn} onClick={() => navigate("/quiz")}>
            Take the Quiz &nbsp;→
          </button>
          <p style={styles.ctaNote}>16 questions · 2 minutes · Free</p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.animalOrb}>
            <span style={styles.orbEmoji}>🌊</span>
          </div>
        </div>
      </section>

      {/* Depth separator */}
      <div style={styles.depthRow}>
        <span style={styles.depthTag}>200m</span>
        <div style={styles.depthLine} />
      </div>

      {/* Groups */}
      <section style={styles.groupsSection}>
        <h2 style={styles.sectionTitle}>Discover Your Ocean Type — OBTI</h2>
        <p style={styles.sectionSub}>
          Four groups. One ocean. Which current do you ride?
        </p>
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
      </section>

      {/* About */}
      <section style={styles.aboutSection}>
        <p style={styles.aboutLabel}>About</p>

        {[
          {
            icon: "🔍",
            title: "Discover your own OBTI",
            body: "The Ocean-Based Type Indicator maps your personality to one of 16 ocean animals through a scientifically-inspired questionnaire. Understand how you think, connect, and act.",
            flip: false,
          },
          {
            icon: "🌍",
            title: "Join the group and earn echo points",
            body: "Connect with people who share your ocean type. Complete real-world environmental missions, earn echo points, and climb the leaderboard while protecting our oceans.",
            flip: true,
          },
          {
            icon: "📊",
            title: "Real data from Scripps Institution of Oceanography",
            body: "HYML partners with CalCOFI — one of the world's longest-running ocean monitoring programs — to show you what's at stake for marine life, right now.",
            flip: false,
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              ...styles.aboutRow,
              flexDirection: item.flip ? "row-reverse" : "row",
            }}
          >
            <div style={styles.aboutIcon}>{item.icon}</div>
            <div style={styles.aboutText}>
              <h3 style={styles.aboutTitle}>{item.title}</h3>
              <p style={styles.aboutBody}>{item.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer ref={contactRef} style={styles.footer}>
        <p style={styles.footerMain}>
          HYML · How You Marine Life · Built for the Scripps Institution of
          Oceanography Challenge
        </p>
        <p style={styles.footerSub}>
          Data powered by CalCOFI · California Current Ecosystem
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #020b18 0%, #041428 18%, #061e3a 40%, #082450 58%, #061e3a 78%, #041428 100%)",
    position: "relative",
    overflow: "hidden",
    color: "#e8f4fd",
  },
  bgGlow1: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,90,160,0.22) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgGlow2: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(ellipse 60% 40% at 80% 70%, rgba(0,60,120,0.12) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  bubblesWrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 1,
  },
  nav: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "22px 48px",
    borderBottom: "1px solid rgba(100,180,255,0.07)",
  },
  logo: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "5px",
    color: "#90e0ef",
    cursor: "pointer",
  },
  navLinks: { display: "flex", gap: "36px" },
  navLink: {
    color: "rgba(200,230,255,0.65)",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "1px",
    cursor: "pointer",
  },
  hero: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "80px 48px 90px",
    minHeight: "82vh",
    gap: "40px",
  },
  heroContent: { flex: 1, maxWidth: "560px" },
  eyebrow: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "3.5px",
    textTransform: "uppercase",
    color: "#48cae4",
    marginBottom: "20px",
  },
  heroTitle: {
    fontSize: "clamp(40px, 5.5vw, 68px)",
    fontWeight: 800,
    lineHeight: 1.1,
    color: "#e8f4fd",
    marginBottom: "28px",
    letterSpacing: "-1px",
  },
  accent: {
    background: "linear-gradient(90deg, #48cae4, #00b4d8, #0096c7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: "17px",
    lineHeight: 1.75,
    color: "rgba(200,230,255,0.72)",
    marginBottom: "44px",
  },
  ctaBtn: {
    display: "block",
    alignItems: "center",
    padding: "17px 42px",
    background: "linear-gradient(135deg, #0096c7, #00b4d8)",
    color: "#fff",
    border: "none",
    borderRadius: "50px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.5px",
    boxShadow: "0 8px 30px rgba(0,150,200,0.38)",
    animation: "pulse 3s ease-in-out infinite",
    marginBottom: "14px",
  },
  ctaNote: {
    fontSize: "12px",
    color: "rgba(180,210,240,0.45)",
    letterSpacing: "0.5px",
    marginTop: "12px",
  },
  heroRight: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    animation: "floatSlow 6s ease-in-out infinite",
  },
  animalOrb: {
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 35% 35%, rgba(0,150,200,0.22), rgba(0,30,80,0.65))",
    border: "1px solid rgba(72,202,228,0.22)",
    boxShadow:
      "0 0 80px rgba(0,150,200,0.18), inset 0 0 60px rgba(0,100,160,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orbEmoji: {
    fontSize: "110px",
    filter: "drop-shadow(0 0 28px rgba(72,202,228,0.45))",
  },
  depthRow: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "0 48px",
    marginBottom: "80px",
  },
  depthTag: {
    fontSize: "10px",
    color: "rgba(100,180,220,0.35)",
    letterSpacing: "2px",
    whiteSpace: "nowrap",
  },
  depthLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, rgba(72,202,228,0.25), transparent)",
  },
  groupsSection: {
    position: "relative",
    zIndex: 5,
    padding: "0 48px 90px",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "clamp(22px, 2.8vw, 34px)",
    fontWeight: 700,
    color: "#e8f4fd",
    marginBottom: "12px",
  },
  sectionSub: {
    fontSize: "15px",
    color: "rgba(180,220,255,0.55)",
    marginBottom: "52px",
  },
  groupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "22px",
    maxWidth: "920px",
    margin: "0 auto 44px",
  },
  groupCard: {
    background:
      "linear-gradient(145deg, rgba(10,30,70,0.75), rgba(5,18,45,0.9))",
    border: "1px solid rgba(72,202,228,0.13)",
    borderRadius: "20px",
    padding: "34px 22px",
    textAlign: "center",
    transition: "transform 0.22s, border-color 0.22s",
  },
  groupEmoji: {
    fontSize: "50px",
    marginBottom: "14px",
    filter: "drop-shadow(0 0 10px rgba(72,202,228,0.28))",
  },
  groupName: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#90e0ef",
    marginBottom: "10px",
    letterSpacing: "1px",
  },
  groupDesc: {
    fontSize: "13px",
    color: "rgba(180,220,255,0.6)",
    lineHeight: 1.65,
  },
  outlineBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "13px 34px",
    background: "transparent",
    color: "#48cae4",
    border: "1.5px solid rgba(72,202,228,0.45)",
    borderRadius: "50px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.5px",
  },
  aboutSection: {
    position: "relative",
    zIndex: 5,
    padding: "60px 48px 90px",
    maxWidth: "780px",
    margin: "0 auto",
  },
  aboutLabel: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "rgba(100,180,220,0.45)",
    marginBottom: "52px",
  },
  aboutRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "28px",
    marginBottom: "56px",
    animation: "fadeIn 1s ease both",
  },
  aboutIcon: {
    fontSize: "36px",
    flexShrink: 0,
    width: "60px",
    height: "60px",
    background: "rgba(10,28,65,0.8)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(72,202,228,0.12)",
  },
  aboutText: { flex: 1 },
  aboutTitle: {
    fontSize: "19px",
    fontWeight: 700,
    color: "#e8f4fd",
    marginBottom: "10px",
  },
  aboutBody: {
    fontSize: "14px",
    color: "rgba(180,220,255,0.62)",
    lineHeight: 1.72,
  },
  footer: {
    position: "relative",
    zIndex: 5,
    textAlign: "center",
    padding: "38px 48px",
    borderTop: "1px solid rgba(72,202,228,0.07)",
  },
  footerMain: {
    fontSize: "12px",
    color: "rgba(150,200,230,0.38)",
    marginBottom: "6px",
    letterSpacing: "0.5px",
  },
  footerSub: {
    fontSize: "11px",
    color: "rgba(100,160,200,0.28)",
    letterSpacing: "0.5px",
  },
};
