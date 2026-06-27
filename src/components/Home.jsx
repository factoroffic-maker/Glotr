import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { subscribeToPublicPosts, createPublicPost } from "../db";
import { Compass, MapPin, Send, Video, LogIn, Users } from "lucide-react";
import { translations } from "../i18n";

export default function Home({ user, onEnterDashboard, onOpenLogin, isDashboardComponent = false, lang = "cs" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null); // { lat, lng }
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const tempMarkerRef = useRef(null);

  const t = translations[lang] || translations.cs;

  // 1. Subscribe to public posts
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPublicPosts((newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      // Center on Prague/Czech Republic: [49.8, 15.5]
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([49.8175, 15.473], 7);

      // CartoDB Positron Tile Layer (Premium, clean light style)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18
      }).addTo(map);

      mapInstance.current = map;

      // Listen to map clicks to pick coordinates
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setSelectedCoords({ lat, lng });
        setErrorMsg("");
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 3. Sync posts markers on the map
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const localeMap = { cs: "cs-CZ", sk: "sk-SK", uk: "uk-UA", en: "en-US" };
    const localeStr = localeMap[lang] || "cs-CZ";

    // Add new markers
    posts.forEach((post) => {
      if (post.lat && post.lng) {
        const marker = L.marker([post.lat, post.lng], {
          icon: L.divIcon({
            className: "custom-map-marker-wrapper",
            html: `<div style="
              width: 14px; 
              height: 14px; 
              background-color: var(--accent-forest); 
              border: 2px solid #fff; 
              border-radius: 50%; 
              box-shadow: 0 0 10px rgba(45, 106, 79, 0.5);
              cursor: pointer;
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        }).addTo(mapInstance.current);

        marker.bindPopup(`
          <div class="map-popup-content" style="color: var(--text-main); font-family: Outfit, sans-serif; font-size: 13px; padding: 4px; min-width: 140px;">
            <div style="font-weight: 700; color: var(--accent-forest); font-size: 13px; margin-bottom: 2px;">
              ${post.authorName}
            </div>
            <div style="color: var(--text-dark); font-weight: 500; margin-bottom: 6px;">
              ${post.text}
            </div>
            <div style="font-size: 10px; color: var(--text-muted); border-top: 1px solid var(--glass-border); padding-top: 4px;">
              ${new Date(post.createdAt).toLocaleString(localeStr, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
            </div>
          </div>
        `);

        markersRef.current.push(marker);
      }
    });
  }, [posts, lang]);

  // 4. Update click marker location
  useEffect(() => {
    if (!mapInstance.current) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    if (selectedCoords) {
      tempMarkerRef.current = L.marker([selectedCoords.lat, selectedCoords.lng], {
        icon: L.divIcon({
          className: "temp-marker-wrapper",
          html: `<div class="live-dot-pulse-temp" style="
            width: 16px; 
            height: 16px; 
            background-color: var(--accent-terracotta); 
            border: 2px solid #fff; 
            border-radius: 50%; 
            box-shadow: 0 0 12px var(--accent-terracotta);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(mapInstance.current);

      // Pan to the selected coordinates smoothly
      mapInstance.current.panTo([selectedCoords.lat, selectedCoords.lng]);
    }
  }, [selectedCoords]);

  // 5. Submit public post
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!postText.trim()) {
      setErrorMsg(t.errPostText);
      return;
    }

    if (!selectedCoords) {
      setErrorMsg(t.errCoords);
      return;
    }

    setSubmitting(true);
    try {
      await createPublicPost(user, postText, selectedCoords.lat, selectedCoords.lng, guestName);
      setSuccessMsg(t.postSuccess);
      setPostText("");
      setSelectedCoords(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyle = isDashboardComponent ? styles.dashboardContainer : styles.standaloneContainer;
  const gridStyle = isDashboardComponent ? styles.dashboardGrid : styles.standaloneGrid;
  const feedListStyle = isDashboardComponent ? styles.dashboardFeedList : styles.standaloneFeedList;

  return (
    <div style={containerStyle}>
      {/* Navbar (only visible if standalone) */}
      {!isDashboardComponent && (
        <header className="glass-panel" style={styles.header}>
          <div style={styles.brand}>
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

          <div style={styles.navActions}>
            <button 
              onClick={user ? onEnterDashboard : onOpenLogin}
              className="btn-primary"
              style={styles.streamBtn}
            >
              <Video size={16} />
              <span>{t.broadcastTrail}</span>
            </button>

            {user ? (
              <button onClick={onEnterDashboard} className="btn-secondary" style={styles.profileBtn}>
                <Users size={16} />
                <span>{user.displayName || user.email.split("@")[0]}</span>
              </button>
            ) : (
              <button onClick={onOpenLogin} className="btn-secondary" style={styles.profileBtn}>
                <LogIn size={16} />
                <span>{t.signInTab}</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Grid */}
      <div style={gridStyle}>
        {/* Map & Form Column */}
        <div style={styles.mapColumn}>
          {/* Map box */}
          <div className="glass-panel" style={{ ...styles.mapContainer, height: isDashboardComponent ? "60vh" : "420px" }}>
            <div ref={mapRef} style={styles.mapElement}></div>
            <div style={styles.mapInstruction}>
              <MapPin size={14} color="var(--accent-terracotta)" />
              <span>{t.mapInstruction}</span>
            </div>
          </div>

          {/* Create Post Form */}
          <div className="glass-panel" style={styles.formContainer}>
            <h3 style={styles.formTitle}>{t.addPostTitle}</h3>
            <form onSubmit={handleSubmitPost} style={styles.form}>
              {!user && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={styles.label}>{t.nicknameGuest}</label>
                  <input
                    type="text"
                    placeholder="Anonymní uživatel"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="glass-input"
                    style={styles.input}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={styles.label}>{t.whatsOnMind}</label>
                <textarea
                  placeholder={t.postPlaceholder}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="glass-input"
                  style={styles.textarea}
                  rows={2}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                {selectedCoords ? (
                  <div style={styles.coordsBadge}>
                    <MapPin size={12} color="var(--accent-terracotta)" />
                    <span>[{selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}]</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.coordsUnselected}</span>
                )}

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="btn-primary" 
                  style={styles.submitBtn}
                >
                  <Send size={14} />
                  <span>{t.btnSubmitPost}</span>
                </button>
              </div>

              {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}
              {successMsg && <div style={styles.successMsg}>{successMsg}</div>}
            </form>
          </div>
        </div>

        {/* Feed Column */}
        <div className="glass-panel" style={styles.feedColumn}>
          <div style={styles.feedHeader}>
            <Compass size={18} color="var(--accent-forest)" />
            <h3 style={styles.feedTitle}>{t.feedTitle}</h3>
          </div>

          <div style={feedListStyle}>
            {loading ? (
              <div style={styles.feedLoading}>Načítání...</div>
            ) : posts.length === 0 ? (
              <div style={styles.feedEmpty}>
                {t.feedEmpty}
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="glass-card" style={styles.postCard}>
                  <div style={styles.postMeta}>
                    <span style={styles.postAuthor}>{post.authorName}</span>
                    <span style={styles.postTime}>
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={styles.postText}>{post.text}</p>
                  <div style={styles.postCoords}>
                    <MapPin size={10} color="var(--text-muted)" />
                    <span>{post.lat.toFixed(3)}, {post.lng.toFixed(3)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  standaloneContainer: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    background: "#fafaf9",
    padding: "24px",
    gap: "24px",
    boxSizing: "border-box",
    overflowX: "hidden"
  },
  dashboardContainer: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "transparent",
    padding: "24px",
    boxSizing: "border-box",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 28px",
    width: "100%",
    boxSizing: "border-box"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
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
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  streamBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    fontSize: "0.9rem"
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    fontSize: "0.9rem"
  },
  standaloneGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: "24px",
    flex: 1,
    width: "100%",
    boxSizing: "border-box"
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "20px",
    flex: 1,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden"
  },
  mapColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
    overflowY: "auto"
  },
  mapContainer: {
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    position: "relative"
  },
  mapElement: {
    width: "100%",
    flex: 1,
    borderRadius: "10px",
    overflow: "hidden",
    zIndex: 1
  },
  mapInstruction: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    color: "var(--text-main)",
    fontSize: "0.8rem",
    fontWeight: "500"
  },
  formContainer: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  formTitle: {
    fontSize: "1.05rem",
    fontWeight: "600",
    fontFamily: "Outfit, sans-serif",
    color: "var(--text-main)"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  label: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    fontWeight: "500"
  },
  input: {
    padding: "8px 12px",
    fontSize: "0.88rem"
  },
  textarea: {
    padding: "8px 12px",
    fontSize: "0.88rem",
    resize: "none"
  },
  coordsBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(45, 106, 79, 0.08)",
    border: "1px solid rgba(45, 106, 79, 0.15)",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "0.8rem",
    color: "var(--accent-forest)",
    alignSelf: "flex-start"
  },
  errorMsg: {
    color: "#ef4444",
    fontSize: "0.82rem",
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    padding: "8px 12px",
    borderRadius: "8px"
  },
  successMsg: {
    color: "#2d6a4f",
    fontSize: "0.82rem",
    background: "rgba(45, 106, 79, 0.05)",
    border: "1px solid rgba(45, 106, 79, 0.15)",
    padding: "8px 12px",
    borderRadius: "8px"
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px 18px",
    fontSize: "0.88rem"
  },
  feedColumn: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "20px 16px",
    overflow: "hidden"
  },
  feedHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "10px",
    marginBottom: "12px"
  },
  feedTitle: {
    fontSize: "1.05rem",
    fontWeight: "600",
    fontFamily: "Outfit, sans-serif",
    color: "var(--text-main)"
  },
  standaloneFeedList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    flex: 1,
    overflowY: "auto",
    maxHeight: "680px",
    paddingRight: "4px"
  },
  dashboardFeedList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
    overflowY: "auto",
    height: "100%",
    paddingRight: "4px"
  },
  feedLoading: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.88rem",
    padding: "20px"
  },
  feedEmpty: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.88rem",
    padding: "40px 10px",
    lineHeight: "1.6"
  },
  postCard: {
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid var(--glass-border)"
  },
  postMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  postAuthor: {
    fontWeight: "600",
    fontSize: "0.88rem",
    color: "var(--accent-forest)"
  },
  postTime: {
    fontSize: "0.75rem",
    color: "var(--text-muted)"
  },
  postText: {
    fontSize: "0.85rem",
    color: "var(--text-dark)",
    lineHeight: "1.4",
    wordBreak: "break-word"
  },
  postCoords: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.72rem",
    color: "var(--text-muted)"
  }
};

// Injection of styles for custom scrollbars and popup overrides
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .leaflet-container {
      background: var(--bg-primary) !important;
    }
    .leaflet-bar a {
      background-color: rgba(255, 255, 255, 0.8) !important;
      color: var(--text-main) !important;
      border: 1px solid var(--glass-border) !important;
      backdrop-filter: blur(8px);
    }
    .leaflet-bar a:hover {
      background-color: #ffffff !important;
      color: var(--accent-forest) !important;
    }
    .leaflet-popup-content-wrapper {
      background: rgba(255, 255, 255, 0.95) !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(45, 106, 79, 0.12) !important;
      border: 1px solid var(--glass-border) !important;
    }
    .leaflet-popup-tip {
      background: rgba(255, 255, 255, 0.95) !important;
    }
    @keyframes pulse-live {
      0% { transform: scale(0.9); opacity: 0.4; }
      50% { transform: scale(1.2); opacity: 0.9; }
      100% { transform: scale(0.9); opacity: 0.4; }
    }
    .live-dot-pulse-temp {
      animation: pulse-live 1.5s infinite ease-in-out;
    }
  `;
  document.head.appendChild(style);
}
