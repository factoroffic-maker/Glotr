import React, { useState, useEffect } from "react";
import { subscribeToFriendsStreams } from "../db";
import { Play, Tv, Users, Activity } from "lucide-react";
import { translations } from "../i18n";

export default function StreamListTab({ user, onJoinStream, lang = "cs" }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = translations[lang] || translations.cs;

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeToFriendsStreams(user.uid, (activeStreams) => {
      setStreams(activeStreams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Activity size={24} className="badge-live" style={{ background: "transparent", color: "var(--accent-forest)" }} />
        <span>{t.searching}</span>
      </div>
    );
  }

  return (
    <div>
      {streams.length === 0 ? (
        <div className="glass-panel" style={styles.emptyContainer}>
          <Tv size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontSize: "1.3rem", marginBottom: "8px", color: "var(--text-main)" }}>{t.noActiveStreams}</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "400px", textAlign: "center" }}>
            {t.streamsHelp}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {streams.map((stream) => (
            <div key={stream.id} className="glass-card" style={styles.card}>
              {/* Card visual header (Mock stream thumbnail) */}
              <div style={styles.thumbnail}>
                <div style={styles.thumbnailOverlay}>
                  <button 
                    onClick={() => onJoinStream(stream.id)} 
                    style={styles.playBtn}
                    className="btn-primary"
                  >
                    <Play size={20} fill="white" />
                  </button>
                </div>
                <div style={styles.badgeRow}>
                  <span className="badge-live">{t.liveBadge}</span>
                  <span style={styles.viewerBadge}>
                    <Users size={12} /> {stream.viewersCount || 0} {t.viewers}
                  </span>
                </div>
              </div>

              {/* Card details */}
              <div style={styles.details}>
                <h4 style={styles.streamTitle}>{stream.title}</h4>
                <div style={styles.hostRow}>
                  <div style={styles.hostAvatar}>
                    {stream.hostName ? stream.hostName.charAt(0).toUpperCase() : "S"}
                  </div>
                  <span style={styles.hostName}>{stream.hostName}</span>
                </div>
                
                <button 
                  onClick={() => onJoinStream(stream.id)}
                  className="btn-secondary"
                  style={styles.watchBtn}
                >
                  {t.btnWatch}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "60px",
    color: "var(--text-muted)"
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    minHeight: "300px",
    boxShadow: "0 8px 30px rgba(45, 106, 79, 0.03)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px"
  },
  card: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    border: "1px solid var(--glass-border)"
  },
  thumbnail: {
    height: "160px",
    background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #3a86c8 100%)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid var(--glass-border)"
  },
  thumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s ease",
    cursor: "pointer"
  },
  playBtn: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 20px rgba(45, 106, 79, 0.35)"
  },
  badgeRow: {
    position: "absolute",
    top: "12px",
    left: "12px",
    right: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  viewerBadge: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(4px)",
    color: "var(--text-main)",
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
    border: "1px solid var(--glass-border)"
  },
  details: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1
  },
  streamTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "var(--text-main)"
  },
  hostRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  hostAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "var(--accent-forest-glow)",
    border: "1px solid rgba(45, 106, 79, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    color: "var(--accent-forest)",
    fontSize: "0.8rem"
  },
  hostName: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontWeight: "500"
  },
  watchBtn: {
    width: "100%",
    marginTop: "auto",
    padding: "10px"
  }
};

// Add CSS rule for card overlay dynamically in the browser
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .glass-card:hover div[style*="thumbnailOverlay"] {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}
