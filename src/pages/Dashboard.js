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

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const myGroup = location.state?.group || 'Guardians';

  const [leaderboard, setLeaderboard] = useState(null);
  const [events, setEvents]           = useState(null);
  const [attendCode, setAttendCode]   = useState('');
  const [attendResult, setAttendResult] = useState(null);
  const [attendLoading, setAttendLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState('missions');
  const [expandedMissionId, setExpandedMissionId] = useState(null);

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
          <div style={{ ...styles.groupOrb, background: myMeta.bg, borderColor: myMeta.border }}>
            <span style={{ fontSize: '28px' }}>{myMeta.emoji}</span>
          </div>
          <div>
            <p style={styles.sidebarGroupName}>{myGroup}</p>
            <p style={styles.sidebarGroupLabel}>Your Group</p>
          </div>
        </div>
        <nav style={styles.sidebarNav}>
          {[
            { id: 'missions', icon: '🎯', label: 'Missions' },
            { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
            { id: 'attend', icon: '📍', label: 'Attend Event' },
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
              <span>{item.icon}</span>
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
          <div style={{ ...styles.myGroupBadge, background: myMeta.bg, borderColor: myMeta.border, color: myMeta.color }}>
            {myMeta.emoji} {myGroup}
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
                  placeholder="Enter event code (e.g. OCN2024)"
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
};
