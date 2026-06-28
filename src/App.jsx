import React, { useState, useEffect } from "react";
import { getAppAuth } from "./firebase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem("glotr_lang") || "cs");
  const [showSettings, setShowSettings] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = getAppAuth().onAuthStateChanged((currentUser) => {
      if (currentUser) {
        if (!isTransitioning) {
          setUser(currentUser);
        } else {
          setPendingUser(currentUser);
        }
      } else {
        setUser(null);
        setPendingUser(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [isTransitioning]);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("glotr_lang", newLang);
  };

  if (initializing) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <span style={styles.loadingText}>Initializing GLOTR...</span>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Global settings / language switcher in top-left corner */}
      <div style={{
        ...styles.settingsWrapper,
        opacity: isTransitioning ? 0 : 1,
        pointerEvents: isTransitioning ? "none" : "auto"
      }}>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          style={styles.settingsBtn}
          title="Jazyk / Language"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-forest)" }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase" }}>{lang}</span>
        </button>

        {showSettings && (
          <div className="glass-panel" style={styles.settingsDropdown}>
            <div style={styles.dropdownHeader}>Language / Jazyk</div>
            <button onClick={() => { changeLanguage("cs"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "cs" ? "700" : "400", background: lang === "cs" ? "var(--accent-forest-glow)" : "none"}}>Čeština (CS)</button>
            <button onClick={() => { changeLanguage("en"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "en" ? "700" : "400", background: lang === "en" ? "var(--accent-forest-glow)" : "none"}}>English (EN)</button>
            <button onClick={() => { changeLanguage("sk"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "sk" ? "700" : "400", background: lang === "sk" ? "var(--accent-forest-glow)" : "none"}}>Slovenčina (SK)</button>
            <button onClick={() => { changeLanguage("uk"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "uk" ? "700" : "400", background: lang === "uk" ? "var(--accent-forest-glow)" : "none"}}>Українська (UK)</button>
            <button onClick={() => { changeLanguage("es"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "es" ? "700" : "400", background: lang === "es" ? "var(--accent-forest-glow)" : "none"}}>Español (ES)</button>
            <button onClick={() => { changeLanguage("it"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "it" ? "700" : "400", background: lang === "it" ? "var(--accent-forest-glow)" : "none"}}>Italiano (IT)</button>
            <button onClick={() => { changeLanguage("fr"); setShowSettings(false); }} style={{...styles.dropdownItem, fontWeight: lang === "fr" ? "700" : "400", background: lang === "fr" ? "var(--accent-forest-glow)" : "none"}}>Français (FR)</button>
          </div>
        )}
      </div>

      {user ? (
        <Dashboard user={user} lang={lang} />
      ) : (
        <Login 
          lang={lang} 
          onLoginStart={() => setIsTransitioning(true)}
          onAnimationComplete={(loggedInUser) => {
            setUser(loggedInUser || pendingUser);
            setIsTransitioning(false);
            setPendingUser(null);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    background: "#fafaf9"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100vw",
    background: "#fafaf9",
    gap: "16px"
  },
  loader: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid rgba(45, 106, 79, 0.1)",
    borderTopColor: "#2d6a4f",
    animation: "spin 1s infinite linear"
  },
  loadingText: {
    color: "#2d6a4f",
    fontSize: "0.95rem",
    fontFamily: "Outfit, sans-serif",
    fontWeight: "600",
    letterSpacing: "0.05em"
  },
  settingsWrapper: {
    position: "fixed",
    top: "16px",
    left: "16px",
    zIndex: 3000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    transition: "opacity 0.25s ease-out"
  },
  settingsBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid var(--glass-border)",
    background: "rgba(255, 255, 255, 0.85)",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(45, 106, 79, 0.06)",
    color: "var(--text-main)",
    transition: "all 0.2s ease"
  },
  settingsDropdown: {
    marginTop: "6px",
    display: "flex",
    flexDirection: "column",
    padding: "6px",
    minWidth: "150px",
    boxShadow: "0 10px 25px rgba(45, 106, 79, 0.08)",
    background: "rgba(255, 255, 255, 0.95)"
  },
  dropdownHeader: {
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    padding: "4px 8px 8px 8px",
    fontWeight: "600",
    borderBottom: "1px solid var(--glass-border)",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  dropdownItem: {
    background: "none",
    border: "none",
    padding: "8px 12px",
    textAlign: "left",
    fontSize: "0.85rem",
    cursor: "pointer",
    color: "var(--text-main)",
    borderRadius: "8px",
    transition: "background 0.2s ease"
  }
};

// Add keyframe animation for the spinner
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    button[style*="dropdownItem"]:hover {
      background: var(--bg-primary) !important;
    }
  `;
  document.head.appendChild(style);
}
