import React, { useState, useEffect, useRef } from "react";
import { 
  startLiveStream, 
  stopLiveStream, 
  subscribeToStream, 
  subscribeToChatMessages, 
  sendChatMessage,
  checkFriendship
} from "../db";
import { 
  X, Send, Users, ShieldAlert, VideoOff, 
  Volume2, VolumeX, MessageSquare, AlertCircle
} from "lucide-react";
import { translations } from "../i18n";

export default function StreamRoom({ streamId, user, isViewer, onLeave, isMinimized = false, onExpand, lang = "cs" }) {
  const t = translations[lang] || translations.cs;
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true = ok, false = access denied
  const [isMuted, setIsMuted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const streamRef = useRef(null); // holds local MediaStream

  // 1. Authorize current user based on friendship
  useEffect(() => {
    async function verifyAccess() {
      if (!isViewer) {
        // Host is always authorized
        setIsAuthorized(true);
        return;
      }

      // Viewer: Subscribe to stream info to get the host's UID
      const unsubscribe = subscribeToStream(streamId, async (streamData) => {
        if (!streamData) {
          setStream(null);
          setIsAuthorized(false);
          return;
        }
        setStream(streamData);

        try {
          // Check if they are friends
          const areFriends = await checkFriendship(user.uid, streamData.hostId);
          setIsAuthorized(areFriends);
        } catch (err) {
          console.error("Error checking friendship:", err);
          setIsAuthorized(false);
        }
      });

      return () => unsubscribe();
    }

    verifyAccess();
  }, [streamId, user, isViewer]);

  // 2. Set up video feed (Webcam capture for host, simulation/placeholder for viewer)
  useEffect(() => {
    if (isAuthorized !== true) return;

    if (!isViewer) {
      // Host: Start webcam preview immediately
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setCameraError("");
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          setCameraError(t.webcamError);
        });
    }

    return () => {
      // Cleanup webcam stream tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAuthorized, isViewer, t.webcamError]);

  // 3. Listen to chat messages
  useEffect(() => {
    if (isAuthorized !== true) return;

    const unsubscribe = subscribeToChatMessages(streamId, (chatMsgs) => {
      setMessages(chatMsgs);
    });

    return () => unsubscribe();
  }, [streamId, isAuthorized]);

  // 4. Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 5. Host controls: Go Live / End Stream
  const handleStartStream = async () => {
    try {
      await startLiveStream(user, `${user.displayName || user.email.split("@")[0]}'s Live Stream`);
      setIsLive(true);
    } catch (err) {
      alert("Error starting stream: " + err.message);
    }
  };

  const handleEndStream = async () => {
    if (confirm("Are you sure you want to end this live stream?")) {
      try {
        await stopLiveStream(streamId);
        setIsLive(false);
        onLeave();
      } catch (err) {
        alert("Error ending stream: " + err.message);
      }
    }
  };

  // 6. Chat actions
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendChatMessage(streamId, user, newMessage);
      setNewMessage("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  // Render loading state
  if (isAuthorized === null) {
    return (
      <div style={isMinimized ? styles.loadingContainerMinimized : styles.loadingContainer}>
        <div className="badge-live" style={{ background: "transparent", color: "#8b5cf6" }}>Verifying connection...</div>
      </div>
    );
  }

  // Render Access Denied state (Friends Only Check)
  if (isAuthorized === false) {
    return (
      <div style={isMinimized ? styles.errorContainerMinimized : styles.errorContainer}>
        <div className="glass-panel" style={isMinimized ? styles.errorCardMinimized : styles.errorCard}>
          <ShieldAlert size={isMinimized ? 24 : 64} color="#f87171" style={{ marginBottom: isMinimized ? "8px" : "20px" }} />
          <h2 style={{ fontSize: isMinimized ? "1.0rem" : "1.8rem", marginBottom: isMinimized ? "4px" : "12px", fontFamily: "Outfit, sans-serif" }}>{t.accessDenied}</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: isMinimized ? "8px" : "24px", fontSize: isMinimized ? "0.75rem" : "0.95rem", lineHeight: "1.4" }}>
            {t.accessDeniedHelp}
          </p>
          <button onClick={onLeave} className="btn-primary" style={isMinimized ? { padding: "4px 8px", fontSize: "0.75rem" } : {}}>
            {t.btnLeave}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={isMinimized ? styles.theaterContainerMinimized : styles.theaterContainer}>
      {/* Video Stream Column */}
      <div style={isMinimized ? styles.videoColumnMinimized : styles.videoColumn}>
        {/* Stream Header */}
        <div style={isMinimized ? styles.roomHeaderMinimized : styles.roomHeader}>
          {isMinimized ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }} title={isViewer ? (stream?.title || t.liveBadge) : t.liveBadge}>
                  {isViewer ? (stream?.title || t.liveBadge) : (isLive ? t.liveBadge : "Preview")}
                </span>
                {(isLive || isViewer) && (
                  <span className="badge-live" style={{ fontSize: "0.55rem", padding: "1px 4px", background: "var(--accent-terracotta)" }}>{t.liveBadge}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button type="button" onClick={onExpand} className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "6px" }}>
                  Expand
                </button>
                <button 
                  type="button"
                  onClick={onLeave} 
                  className="btn-secondary" 
                  style={{ padding: "4px 6px", fontSize: "0.7rem", borderRadius: "6px", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }}
                  title={isViewer ? t.btnLeave : t.btnEndLive}
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={styles.headerTitleRow}>
                  <h2 style={styles.streamTitle}>
                    {isViewer ? (stream?.title || t.liveBadge) : (isLive ? t.liveBadge : "Preview")}
                  </h2>
                  {(isLive || isViewer) && (
                    <span className="badge-live" style={styles.liveIndicator}>
                      {t.liveBadge}
                    </span>
                  )}
                </div>
                <p style={styles.hostSubtitle}>
                  {lang === "cs" ? "Pořadatel: " : lang === "sk" ? "Hostiteľ: " : lang === "uk" ? "Автор: " : "Host: "} <strong>{isViewer ? (stream?.hostName || "Friend") : (lang === "cs" ? "Vy" : lang === "sk" ? "Vy" : lang === "uk" ? "Ви" : "You")}</strong>
                </p>
              </div>

              <div style={styles.headerActions}>
                {!isViewer ? (
                  !isLive ? (
                    <button onClick={handleStartStream} className="btn-primary" style={styles.goLiveBtn}>
                      {t.btnOpenStudio}
                    </button>
                  ) : (
                    <button onClick={handleEndStream} className="btn-danger" style={styles.endLiveBtn}>
                      {t.btnEndLive}
                    </button>
                  )
                ) : (
                  <button onClick={onLeave} className="btn-secondary" style={styles.leaveBtn}>
                    <X size={16} /> {t.btnLeave}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Video Player Box */}
        <div style={isMinimized ? styles.playerContainerMinimized : styles.playerContainer} className="glass-panel">
          {cameraError ? (
            <div style={styles.videoPlaceholder}>
              <VideoOff size={isMinimized ? 24 : 48} color="#f87171" />
              <p style={{ marginTop: isMinimized ? "8px" : "16px", color: "#f87171", fontSize: isMinimized ? "0.75rem" : "0.95rem" }}>{cameraError}</p>
            </div>
          ) : !isViewer ? (
            /* Broadcaster Preview */
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                style={styles.videoElement}
              />
              {!isLive && (
                <div style={isMinimized ? styles.previewOverlayMinimized : styles.previewOverlay}>
                  <AlertCircle size={isMinimized ? 20 : 32} color="var(--accent-forest)" style={{ marginBottom: isMinimized ? "4px" : "12px" }} />
                  <p style={{ fontWeight: "600", fontSize: isMinimized ? "0.75rem" : "1.0rem", color: "var(--text-main)" }}>Preview Mode</p>
                  {!isMinimized && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Click "{t.btnOpenStudio}" above to start streaming.</p>}
                </div>
              )}
            </div>
          ) : (
            /* Viewer Video Player (Simulated or fallback player) */
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <div style={styles.mockStreamAnimation}>
                {/* Simulated ambient graphic since we are in local testing */}
                <div style={isMinimized ? styles.visualizerWaveMinimized : styles.visualizerWave}></div>
                <div style={isMinimized ? styles.visualizerWave2Minimized : styles.visualizerWave2}></div>
                
                <div style={isMinimized ? styles.viewerOverlayTextMinimized : styles.viewerOverlayText}>
                  <VideoOff size={isMinimized ? 20 : 48} color="var(--accent-forest)" style={{ marginBottom: isMinimized ? "4px" : "16px" }} />
                  <h3 style={{ fontSize: isMinimized ? "0.75rem" : "1.2rem", fontWeight: "600", marginBottom: isMinimized ? "2px" : "8px", color: "#fff" }}>Live Feed Connected</h3>
                  {!isMinimized && (
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", maxWidth: "350px", textAlign: "center" }}>
                      Connected to mock streaming server.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar Overlay */}
          <div style={isMinimized ? styles.playerControlsMinimized : styles.playerControls}>
            <button onClick={() => setIsMuted(!isMuted)} style={styles.controlIconBtn}>
              {isMuted ? <VolumeX size={isMinimized ? 14 : 18} /> : <Volume2 size={isMinimized ? 14 : 18} />}
            </button>
            <div style={styles.viewerCounter}>
              <Users size={isMinimized ? 12 : 14} /> 
              <span style={isMinimized ? { fontSize: "0.7rem" } : {}}>{(isViewer ? stream?.viewersCount : (isLive ? 1 : 0)) || 0} {t.viewers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Column */}
      {!isMinimized && (
        <div className="glass-panel" style={styles.chatColumn}>
          <div style={styles.chatHeader}>
            <MessageSquare size={18} color="var(--accent-forest)" />
            <h3 style={styles.chatHeaderTitle}>Live Chat</h3>
          </div>

          {/* Scrollable Message Area */}
          <div style={styles.messageContainer}>
            {messages.length === 0 ? (
              <div style={styles.emptyChat}>
                <p style={{ color: "var(--text-muted)" }}>Zatím žádné zprávy.</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Pozdravte ostatní a začněte konverzaci!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={styles.chatMessage}>
                  <div style={styles.msgHeader}>
                    <span style={{
                      ...styles.msgSender,
                      color: msg.senderId === user.uid ? "var(--accent-forest)" : "var(--accent-sky)"
                    }}>
                      {msg.senderName}
                    </span>
                    <span style={styles.msgTime}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  <p style={styles.msgText}>{msg.text}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Send message form */}
          <form onSubmit={handleSendMessage} style={styles.chatForm}>
            <input
              type="text"
              placeholder="Napiš zprávu..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="glass-input"
              style={styles.chatInput}
            />
            <button type="submit" className="btn-primary" style={styles.sendBtn}>
              <Send size={16} />
            </button>
          </form>
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
    width: "100%",
    height: "100%"
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    background: "var(--bg-primary)",
  },
  errorCard: {
    maxWidth: "460px",
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(45, 106, 79, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "12px",
    background: "#fff"
  },
  theaterContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "var(--bg-primary)",
    position: "relative",
    borderRadius: "12px",
    border: "1px solid var(--glass-border)"
  },
  videoColumn: {
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    height: "100%",
    overflow: "hidden"
  },
  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  streamTitle: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "var(--text-main)"
  },
  liveIndicator: {
    fontSize: "0.65rem",
    padding: "2px 6px"
  },
  hostSubtitle: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginTop: "2px"
  },
  headerActions: {
    display: "flex",
    gap: "12px"
  },
  goLiveBtn: {
    padding: "10px 20px",
    fontSize: "0.95rem"
  },
  endLiveBtn: {
    padding: "10px 20px",
    fontSize: "0.95rem",
    fontWeight: "600"
  },
  leaveBtn: {
    padding: "10px 20px",
    fontSize: "0.95rem"
  },
  playerContainer: {
    flex: 1,
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
    background: "#1c2826",
    border: "1px solid var(--glass-border)"
  },
  videoElement: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(250,250,249,0.85)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  mockStreamAnimation: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #3a86c8 100%)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  viewerOverlayText: {
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  visualizerWave: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    border: "1px solid rgba(45, 106, 79, 0.2)",
    animation: "pulse-live 4s infinite linear"
  },
  visualizerWave2: {
    position: "absolute",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    border: "1px solid rgba(58, 134, 200, 0.15)",
    animation: "pulse-live 6s infinite linear"
  },
  playerControls: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    right: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(8px)",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid var(--glass-border)",
    zIndex: 10
  },
  controlIconBtn: {
    background: "none",
    border: "none",
    color: "var(--text-main)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  viewerCounter: {
    fontSize: "0.8rem",
    color: "var(--text-dark)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "500"
  },
  chatColumn: {
    height: "100%",
    borderRadius: "0",
    borderTop: "none",
    borderBottom: "none",
    borderRight: "none",
    borderLeft: "1px solid var(--glass-border)",
    display: "flex",
    flexDirection: "column",
    background: "rgba(255, 255, 255, 0.75)"
  },
  chatHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--glass-border)",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  chatHeaderTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text-main)"
  },
  messageContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  emptyChat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center"
  },
  chatMessage: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  msgHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  msgSender: {
    fontSize: "0.85rem",
    fontWeight: "600"
  },
  msgTime: {
    fontSize: "0.7rem",
    color: "var(--text-muted)"
  },
  msgText: {
    fontSize: "0.9rem",
    color: "var(--text-dark)",
    wordBreak: "break-word",
    lineHeight: "1.4"
  },
  chatForm: {
    padding: "16px 20px",
    borderTop: "1px solid var(--glass-border)",
    display: "flex",
    gap: "10px"
  },
  chatInput: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "0.88rem"
  },
  sendBtn: {
    padding: "10px 14px",
    borderRadius: "10px"
  },
  theaterContainerMinimized: {
    display: "flex",
    flexDirection: "column",
    width: "300px",
    height: "220px",
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 1000,
    borderRadius: "16px",
    border: "1px solid var(--accent-forest)",
    boxShadow: "0 10px 30px rgba(45, 106, 79, 0.15)",
    padding: "8px"
  },
  videoColumnMinimized: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%"
  },
  roomHeaderMinimized: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    width: "100%"
  },
  playerContainerMinimized: {
    flex: 1,
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
    background: "#1c2826",
    border: "1px solid var(--glass-border)"
  },
  previewOverlayMinimized: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(250,250,249,0.85)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    padding: "10px"
  },
  viewerOverlayTextMinimized: {
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px"
  },
  visualizerWaveMinimized: {
    position: "absolute",
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "1px solid rgba(45, 106, 79, 0.2)",
    animation: "pulse-live 4s infinite linear"
  },
  visualizerWave2Minimized: {
    position: "absolute",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    border: "1px solid rgba(58, 134, 200, 0.15)",
    animation: "pulse-live 6s infinite linear"
  },
  playerControlsMinimized: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
    right: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.75)",
    padding: "6px 10px",
    borderRadius: "6px",
    zIndex: 10
  },
  loadingContainerMinimized: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "300px",
    height: "220px",
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 1000,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid var(--accent-forest)"
  },
  errorContainerMinimized: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "300px",
    height: "220px",
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 1000,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(239, 68, 68, 0.3)"
  },
  errorCardMinimized: {
    width: "100%",
    height: "100%",
    padding: "12px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  }
};
