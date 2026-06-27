import React, { useState, useEffect } from "react";
import { getAppAuth, getIsMock } from "../firebase";
import { subscribeToIncomingRequests } from "../db";
import { Compass, Users, Video, LogOut, User, Map, Radio } from "lucide-react";
import FriendsTab from "./FriendsTab";
import StreamListTab from "./StreamListTab";
import StreamRoom from "./StreamRoom";
import Home from "./Home";
import { translations } from "../i18n";

export default function Dashboard({ user, lang = "cs" }) {
  const [activeTab, setActiveTab] = useState("explore"); // explore, streams, friends, golive
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [isViewer, setIsViewer] = useState(false);
  const isMock = getIsMock();

  const t = translations[lang] || translations.cs;

  useEffect(() => {
    if (!user) return;
    // Subscribe to incoming friend requests to show notification badge
    const unsubscribe = subscribeToIncomingRequests(user.uid, (requests) => {
      setPendingRequestsCount(requests.length);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    getAppAuth().signOut();
  };

  const handleJoinStream = (streamId) => {
    setActiveStreamId(streamId);
    setIsViewer(true);
    setActiveTab("stream-room");
  };

  const handleStartHostingStream = (streamId) => {
    setActiveStreamId(streamId);
    setIsViewer(false);
    setActiveTab("stream-room");
  };

  const handleLeaveRoom = () => {
    setActiveStreamId(null);
    setIsViewer(false);
    setActiveTab("streams");
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {/* Sidebar */}
        <aside className="glass-panel" style={styles.sidebar}>
          <div style={styles.logoArea}>
            <span style={styles.logoText}>
              GL
              <Compass 
                size={20} 
                color="var(--accent-forest)" 
                className="logo-spin" 
                style={{ margin: "0 1px", transform: "translateY(-1px)" }}
              />
              TR
            </span>
          </div>

          <nav style={styles.nav}>
            <button 
              onClick={() => setActiveTab("explore")}
              style={{
                ...styles.navItem,
                background: activeTab === "explore" ? "var(--accent-forest-glow)" : "transparent",
                color: activeTab === "explore" ? "var(--accent-forest)" : "var(--text-muted)",
                borderLeft: activeTab === "explore" ? "3px solid var(--accent-forest)" : "3px solid transparent",
                fontWeight: activeTab === "explore" ? "600" : "500"
              }}
            >
              <Map size={20} />
              <span>{t.exploreTrails}</span>
            </button>

            <button 
              onClick={() => setActiveTab("streams")}
              style={{
                ...styles.navItem,
                background: activeTab === "streams" ? "var(--accent-forest-glow)" : "transparent",
                color: activeTab === "streams" ? "var(--accent-forest)" : "var(--text-muted)",
                borderLeft: activeTab === "streams" ? "3px solid var(--accent-forest)" : "3px solid transparent",
                fontWeight: activeTab === "streams" ? "600" : "500"
              }}
            >
              <Radio size={20} />
              <span>{t.liveHikes}</span>
            </button>

            <button 
              onClick={() => setActiveTab("friends")}
              style={{
                ...styles.navItem,
                background: activeTab === "friends" ? "var(--accent-forest-glow)" : "transparent",
                color: activeTab === "friends" ? "var(--accent-forest)" : "var(--text-muted)",
                borderLeft: activeTab === "friends" ? "3px solid var(--accent-forest)" : "3px solid transparent",
                fontWeight: activeTab === "friends" ? "600" : "500"
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Users size={20} />
                {pendingRequestsCount > 0 && (
                  <span style={styles.badge}>{pendingRequestsCount}</span>
                )}
              </div>
              <span>{t.trailBuddies}</span>
            </button>

            <button 
              onClick={() => setActiveTab("golive")}
              style={{
                ...styles.navItem,
                background: activeTab === "golive" ? "var(--accent-forest-glow)" : "transparent",
                color: activeTab === "golive" ? "var(--accent-forest)" : "var(--text-muted)",
                borderLeft: activeTab === "golive" ? "3px solid var(--accent-forest)" : "3px solid transparent",
                fontWeight: activeTab === "golive" ? "600" : "500"
              }}
            >
              <Video size={20} />
              <span>{t.broadcastTrail}</span>
            </button>

            {/* Glowing Active Room Button */}
            {activeStreamId && (
              <button 
                onClick={() => setActiveTab("stream-room")}
                style={{
                  ...styles.navItem,
                  background: activeTab === "stream-room" ? "var(--accent-terracotta-glow)" : "transparent",
                  color: "var(--accent-terracotta)",
                  borderLeft: activeTab === "stream-room" ? "3px solid var(--accent-terracotta)" : "3px solid transparent",
                  fontWeight: "600",
                  marginTop: "12px"
                }}
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Video size={20} color="var(--accent-terracotta)" />
                  <span className="live-dot-pulse"></span>
                </div>
                <span>{t.activeRoom}</span>
              </button>
            )}
          </nav>

          {/* Sidebar User Footer */}
          <div style={styles.userFooter}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                <User size={18} color="var(--accent-forest)" />
              </div>
              <div style={styles.userMeta}>
                <span style={styles.userName} title={user.displayName || user.email}>
                  {user.displayName || user.email.split("@")[0]}
                </span>
                <span style={styles.userStatus}>{t.online}</span>
              </div>
            </div>

            <button onClick={handleLogout} style={styles.logoutBtn} title={t.signOut}>
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main Dashboard Area */}
        <main style={{ ...styles.mainContent, overflowY: activeTab === "stream-room" || activeTab === "explore" ? "hidden" : "auto", padding: activeTab === "explore" ? "0" : "40px" }}>
          {/* Header (hidden for Explore map to maximize view) */}
          {activeTab !== "stream-room" && activeTab !== "explore" && (
            <header style={styles.header}>
              <div>
                <h2 style={styles.headerTitle}>
                  {activeTab === "streams" && t.activeLiveStreams}
                  {activeTab === "friends" && t.trailBuddies}
                  {activeTab === "golive" && t.readyToBroadcast}
                </h2>
                <p style={styles.headerSubtitle}>
                  {activeTab === "streams" && t.watchFriendStreams}
                  {activeTab === "friends" && t.subFriends}
                  {activeTab === "golive" && t.streamVisibleToFriends}
                </p>
              </div>

              {isMock && (
                <div style={styles.mockBadge} title="Running on LocalStorage Simulation.">
                  <span style={styles.mockDot}></span> Offline Mock Mode
                </div>
              )}
            </header>
          )}

          {/* Dynamic Content Panel */}
          <div style={styles.panelWrapper}>
            {/* Always mount StreamRoom if a stream session is active */}
            {activeStreamId && (
              <StreamRoom 
                streamId={activeStreamId} 
                user={user} 
                isViewer={isViewer} 
                onLeave={handleLeaveRoom}
                isMinimized={activeTab !== "stream-room"}
                onExpand={() => setActiveTab("stream-room")}
                lang={lang}
              />
            )}

            {activeTab === "explore" && (
              <Home user={user} isDashboardComponent={true} lang={lang} />
            )}
            {activeTab === "streams" && (
              <StreamListTab user={user} onJoinStream={handleJoinStream} lang={lang} />
            )}
            {activeTab === "friends" && (
              <FriendsTab user={user} lang={lang} />
            )}
            {activeTab === "golive" && (
              activeStreamId ? (
                <div className="glass-panel" style={styles.goLiveContainer}>
                  <Video size={48} color="var(--accent-forest)" style={{ marginBottom: "16px" }} />
                  <h3 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "var(--text-main)" }}>{t.alreadyLive}</h3>
                  <p style={{ color: "var(--text-muted)", maxWidth: "420px", textAlign: "center", marginBottom: "24px" }}>
                    {t.alreadyLiveHelp}
                  </p>
                  <button 
                    onClick={() => setActiveTab("stream-room")}
                    className="btn-primary" 
                    style={{ padding: "14px 32px", fontSize: "1.1rem" }}
                  >
                    {t.btnReturnStudio}
                  </button>
                </div>
              ) : (
                <div className="glass-panel" style={styles.goLiveContainer}>
                  <Video size={48} color="var(--accent-forest)" style={{ marginBottom: "16px" }} />
                  <h3 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "var(--text-main)" }}>{t.readyBroadcast}</h3>
                  <p style={{ color: "var(--text-muted)", maxWidth: "420px", textAlign: "center", marginBottom: "24px" }}>
                    {t.readyBroadcastHelp}
                  </p>
                  <button 
                    onClick={() => handleStartHostingStream(`stream_${user.uid}`)}
                    className="btn-primary" 
                    style={{ padding: "14px 32px", fontSize: "1.1rem" }}
                  >
                    {t.btnOpenStudio}
                  </button>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    background: "transparent"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    width: "100%",
    height: "100vh",
    overflow: "hidden"
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    borderRadius: "0",
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    padding: "24px 16px",
    background: "rgba(255, 255, 255, 0.75)",
    borderRight: "1px solid var(--glass-border)"
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "36px",
    paddingLeft: "8px"
  },
  logoText: {
    fontSize: "1.5rem",
    fontFamily: "Unbounded, sans-serif",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    background: "linear-gradient(135deg, var(--accent-forest), var(--accent-sky))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    fontSize: "0.95rem",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  badge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "var(--accent-terracotta)",
    color: "white",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    fontSize: "0.65rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  userFooter: {
    marginTop: "auto",
    padding: "16px 8px",
    borderTop: "1px solid var(--glass-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    overflow: "hidden"
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--accent-forest-glow)",
    border: "1px solid rgba(45, 106, 79, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  userMeta: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  userName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "var(--text-main)"
  },
  userStatus: {
    fontSize: "0.75rem",
    color: "#2d6a4f",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500"
  },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    gap: "20px"
  },
  headerTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "4px",
    color: "var(--text-main)"
  },
  headerSubtitle: {
    color: "var(--text-muted)",
    fontSize: "0.95rem"
  },
  mockBadge: {
    background: "rgba(231, 111, 81, 0.08)",
    border: "1px solid rgba(231, 111, 81, 0.15)",
    color: "var(--accent-terracotta)",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap"
  },
  mockDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--accent-terracotta)",
    display: "inline-block"
  },
  panelWrapper: {
    flex: 1,
    minHeight: 0
  },
  goLiveContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    textAlign: "center",
    minHeight: "350px",
    boxShadow: "0 10px 30px rgba(45, 106, 79, 0.04)"
  }
};

// Add pulsing dot keyframe animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes pulse-dot {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(231, 111, 81, 0.4); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(231, 111, 81, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(231, 111, 81, 0); }
    }
    .live-dot-pulse {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 7px;
      height: 7px;
      background-color: var(--accent-terracotta);
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }
  `;
  document.head.appendChild(style);
}
