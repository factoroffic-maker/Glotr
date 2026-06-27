import React, { useState, useEffect, useRef } from "react";
import { getAppAuth } from "../firebase";
import { createUserProfile, searchUserByEmail } from "../db";
import { LogIn, UserPlus, Mail, Lock, User, Map, Radio, Users, Phone, Calendar } from "lucide-react";
import { translations } from "../i18n";

import natureLandscapePhoto from "../assets/nature_landscape_photo.png";
import seaCoastlineLandscape from "../assets/sea_coastline_landscape.png";
import hikerMountainSelfie from "../assets/hiker_mountain_selfie.png";
import beautifulCoastalCity from "../assets/beautiful_coastal_city.png";
import hikersSelfieGroup from "../assets/hikers_selfie_group.png";

// Local translations for the onboarding features cards
const infoTranslations = {
  cs: {
    welcomePillText: "Vítej v komunitě GLOTR",
    mainDesc: "Spoj se s přírodou, nádhernými městy a dalšími dobrodruhy. Prozkoumej malebné trasy, sdílej své cesty v reálném čase a najdi parťáky, kteří sdílejí tvou vášeň pro outdoor.",
    exploreTitle: "Prozkoumej trasy",
    exploreDesc: "Hledej stezcan, plánuj cesty a sdílej body na mapě.",
    liveTitle: "Živá vysílání",
    liveDesc: "Sdílej své zážitky z terénu s přáteli v reálném čase.",
    friendsTitle: "Parťáci na cestu",
    friendsDesc: "Nájdi další turisty a hikery v okolí a vyrazte spolu.",
    authCardWelcome: "Vítej zpět, objeviteli",
    authCardJoin: "Připoj se ke komunitě ještě dnes",
  },
  en: {
    welcomePillText: "Welcome to GLOTR Community",
    mainDesc: "Connect with nature, gorgeous cities, and fellow adventurers. Explore scenic routes, share your trail journeys in real time, and connect with people who share your passion for the outdoors.",
    exploreTitle: "Explore Trails",
    exploreDesc: "Find trails, plan routes, and share map logs.",
    liveTitle: "Live Broadcasts",
    liveDesc: "Share your outdoor experiences with friends in real time.",
    friendsTitle: "Trail Buddies",
    friendsDesc: "Connect with fellow hikers nearby and head out together.",
    authCardWelcome: "Welcome back, explorer",
    authCardJoin: "Join the community today",
  },
  sk: {
    welcomePillText: "Vitajte v komunite GLOTR",
    mainDesc: "Spojte sa s prírodou, nádhernými mestami a ďalšími dobrodruhmi. Preskúmajte malebné trasy, zdieľajte svoje cesty v reálném čase a nájdite parťákov, ktorí zdieľajú vašu vášeň pre outdoor.",
    exploreTitle: "Preskúmaj trasy",
    exploreDesc: "Hľadaj chodníky, plánuj cesty a zdieľaj body na mape.",
    liveTitle: "Živé vysielania",
    liveDesc: "Zdieľaj svoje zážitky z terénu s priateľmi v reálnom čase.",
    friendsTitle: "Parťáci na cestu",
    friendsDesc: "Nájdi ďalších turistov a hikerov v okolí a vyrazte spolu.",
    authCardWelcome: "Vitaj späť, objaviteľ",
    authCardJoin: "Pripoj sa ku komunite ešte dnes",
  },
  uk: {
    welcomePillText: "Ласкаво просимо до спільноти GLOTR",
    mainDesc: "Спілкуйтеся з природою, прекрасними містами та іншими шукачами пригод. Досліджуйте мальовничі маршрути, діліться своїми подорожами в реальному часі та знаходьте друзів.",
    exploreTitle: "Досліджуйте маршрути",
    exploreDesc: "Знаходьте стежки, плануйте маршрути та діліться точками.",
    liveTitle: "Прямі трансляції",
    liveDesc: "Діліться своїми пригодами з друзями в реальному часі.",
    friendsTitle: "Друзі для походів",
    friendsDesc: "Знайдіть однодумців поблизу та вирушайте разом.",
    authCardWelcome: "З поверненням, досліднику",
    authCardJoin: "Приєднуйся до спільноти сьогодні",
  },
  es: {
    welcomePillText: "Bienvenido a la Comunidad GLOTR",
    mainDesc: "Conéctate con la naturaleza, ciudades hermosas y compañeros de aventura. Explora rutas, comparte tus viajes en tiempo real y encuentra amigos que compartan tu pasión.",
    exploreTitle: "Explorar Rutas",
    exploreDesc: "Encuentra senderos, planifica rutas y comparte registros.",
    liveTitle: "Transmisiones en Vivo",
    liveDesc: "Comparte tus aventuras con amigos en tiempo real.",
    friendsTitle: "Compañeros de Ruta",
    friendsDesc: "Conéctate con senderistas cercanos y exploren juntos.",
    authCardWelcome: "Bienvenido de nuevo, explorador",
    authCardJoin: "Únete a la comunidad hoy mismo",
  },
  it: {
    welcomePillText: "Benvenuto nella Community GLOTR",
    mainDesc: "Connettiti con la natura, città meravigliose e compagni di avventura. Esplora sentieri scenografici, condivi i tuoi viaggi in tempo reale e connettiti con amanti dell'outdoor.",
    exploreTitle: "Esplora Sentieri",
    exploreDesc: "Trova sentieri, pianifica percorsi e condividi registri.",
    liveTitle: "Trasmissioni in Diretta",
    liveDesc: "Condividi le tue avventure con gli amici in tempo reale.",
    friendsTitle: "Amici di Sentiero",
    friendsDesc: "Connettiti con altri escursionisti e viaggiate insieme.",
    authCardWelcome: "Bentornato, esploratore",
    authCardJoin: "Unisciti a la community oggi",
  },
  fr: {
    welcomePillText: "Bienvenue sur la Communauté GLOTR",
    mainDesc: "Connectez-vous avec la nature, de magnifiques villes et des compagnons d'aventure. Explorez des sentiers pittoresques, partagez vos voyages en temps réel et rencontrez des passionnés.",
    exploreTitle: "Explorer les Sentiers",
    exploreDesc: "Trouvez des sentiers, planifiez des itinéraires et partagez.",
    liveTitle: "Diffusions en Direct",
    liveDesc: "Partagez vos aventures avec vos amis en temps réel.",
    friendsTitle: "Compagnons de Sentier",
    friendsDesc: "Connectez-vous avec d'autres randonneurs et explorez ensemble.",
    authCardWelcome: "Bon retour, explorateur",
  }
};

// Background slideshow logic with 5 requested category images
const bgImages = [
  natureLandscapePhoto,
  seaCoastlineLandscape,
  hikerMountainSelfie,
  beautifulCoastalCity,
  hikersSelfieGroup
];

export default function Login({ onClose, lang = "cs", onLoginStart, onAnimationComplete }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [username, setUsername] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+420");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [bgIndex, setBgIndex] = useState(0);

  const [animationPhase, setAnimationPhase] = useState("idle"); // idle, moving, pulsing, expanding, finished
  const [compassRect, setCompassRect] = useState(null);
  const [isMovingStarted, setIsMovingStarted] = useState(false);
  const originalCompassRef = useRef(null);

  useEffect(() => {
    const savedRemember = localStorage.getItem("glotr_remember") === "true";
    if (savedRemember) {
      setRememberMe(true);
      setEmail(localStorage.getItem("glotr_email") || "");
      setPassword(localStorage.getItem("glotr_password") || "");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Monitor screen size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 840);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const auth = getAppAuth();
  const t = translations[lang] || translations.cs;
  const localT = infoTranslations[lang] || infoTranslations.cs;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || animationPhase !== "idle") return;
    setError("");
    setLoading(true);

    if (onLoginStart) {
      onLoginStart();
    }

    if (originalCompassRef.current) {
      const rect = originalCompassRef.current.getBoundingClientRect();
      setCompassRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2
      });
    }

    setAnimationPhase("moving");
    setTimeout(() => {
      setIsMovingStarted(true);
    }, 50);

    let authError = null;
    let loggedInUser = null;

    try {
      if (isRegister) {
        // Register flow
        const generatedDisplayName = username || `${firstName} ${lastName}`;
        const combinedPhone = phone ? `${phonePrefix} ${phone}` : "";
        const userCredential = await auth.createUserWithEmailAndPassword(email, password, generatedDisplayName);
        await createUserProfile(
          userCredential.user.uid, 
          email, 
          generatedDisplayName,
          { username, firstName, lastName, phone: combinedPhone, dob }
        );
        loggedInUser = userCredential.user;
      } else {
        // Login flow
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        loggedInUser = userCredential.user;
      }
    } catch (err) {
      console.error(err);
      authError = err.message || t.loginError;
    }

    // Move phase duration: 800ms
    setTimeout(() => {
      if (authError) {
        setError(authError);
        setAnimationPhase("idle");
        setIsMovingStarted(false);
        setLoading(false);
        if (onAnimationComplete) {
          onAnimationComplete(null);
        }
        return;
      }

      // Persist credentials if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem("glotr_remember", "true");
        localStorage.setItem("glotr_email", email);
        localStorage.setItem("glotr_password", password);
      } else {
        localStorage.removeItem("glotr_remember");
        localStorage.removeItem("glotr_email");
        localStorage.removeItem("glotr_password");
      }

      setAnimationPhase("pulsing");

      // Pulsing phase runs for 1.8 seconds minimum for aesthetic appreciation
      setTimeout(() => {
        setAnimationPhase("expanding");

        // Expanding fullscreen phase: 900ms
        setTimeout(() => {
          setAnimationPhase("finished");
          if (onAnimationComplete) {
            onAnimationComplete(loggedInUser);
          }
        }, 900);

      }, 1800);

    }, 800);
  };

  const handleGoogleSignIn = async () => {
    if (loading || animationPhase !== "idle") return;
    setError("");
    setLoading(true);

    if (onLoginStart) {
      onLoginStart();
    }

    if (originalCompassRef.current) {
      const rect = originalCompassRef.current.getBoundingClientRect();
      setCompassRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2
      });
    }

    setAnimationPhase("moving");
    setTimeout(() => {
      setIsMovingStarted(true);
    }, 50);

    let authError = null;
    let loggedInUser = null;

    try {
      const userCredential = await auth.signInWithGoogle();
      const existingProfile = await searchUserByEmail(userCredential.user.email);
      if (!existingProfile) {
        const parts = (userCredential.user.displayName || "").split(" ");
        const first = parts[0] || "";
        const last = parts.slice(1).join(" ") || "";
        await createUserProfile(
          userCredential.user.uid,
          userCredential.user.email,
          userCredential.user.displayName || userCredential.user.email.split("@")[0],
          { firstName: first, lastName: last, phone: "", dob: "" }
        );
      }
      loggedInUser = userCredential.user;
    } catch (err) {
      console.error(err);
      authError = err.message || t.loginError;
    }

    setTimeout(() => {
      if (authError) {
        setError(authError);
        setAnimationPhase("idle");
        setIsMovingStarted(false);
        setLoading(false);
        if (onAnimationComplete) {
          onAnimationComplete(null);
        }
        return;
      }

      setAnimationPhase("pulsing");

      setTimeout(() => {
        setAnimationPhase("expanding");

        setTimeout(() => {
          setAnimationPhase("finished");
          if (onAnimationComplete) {
            onAnimationComplete(loggedInUser);
          }
        }, 900);

      }, 1800);

    }, 800);
  };

  const handleForgotPassword = async () => {
    const emailToReset = prompt(t.enterEmailReset, email);
    if (!emailToReset) return;
    
    setError("");
    setLoading(true);
    try {
      await auth.sendPasswordResetEmail(emailToReset);
      alert(t.resetEmailSent);
    } catch (err) {
      console.error(err);
      setError(err.message || t.resetError);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = onClose ? {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(250, 250, 249, 0.85)",
    backdropFilter: "blur(12px)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  } : styles.container;

  return (
    <div 
      style={{
        ...containerStyle,
        transition: "opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
      }} 
      className={animationPhase === "expanding" ? "login-page-fadeout" : ""}
    >
      {/* 1. CSS animations for smooth floating nature effects & glowing focus inputs */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-nature-1 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.01); }
        }
        @keyframes float-nature-2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(0.99); }
        }
        @keyframes float-nature-3 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.005); }
        }
        @keyframes fadeInUpOrganic {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-in-organic {
          animation: fadeInUpOrganic 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .float-card-1 { animation: float-nature-1 8s ease-in-out infinite; }
        .float-card-2 { animation: float-nature-2 7.2s ease-in-out infinite 1s; }
        .float-card-3 { animation: float-nature-3 9s ease-in-out infinite 2s; }
        
        .nature-input {
          font-family: 'Space Grotesk', sans-serif !important;
          transition: all 0.25s ease !important;
          border-radius: 12px !important;
          border: 1px solid rgba(45, 106, 79, 0.22) !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        .nature-input:focus {
          border-color: var(--accent-terracotta) !important;
          box-shadow: 0 0 14px rgba(231, 111, 81, 0.35) !important;
          background: #ffffff !important;
          transform: translateY(-1px);
        }
        .nature-btn {
          font-family: 'Outfit', sans-serif !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 12px !important;
          transition: all 0.25s ease !important;
        }
        .nature-btn:hover {
          box-shadow: 0 8px 24px rgba(45, 106, 79, 0.3) !important;
          transform: scale(1.02);
        }
        .text-gradient-logo {
          background: linear-gradient(135deg, #4ade80, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @keyframes compass-spin-needle-fast {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(720deg); }
        }
        .needle-spin-fast {
          animation: compass-spin-needle-fast 2.5s infinite ease-in-out;
          transform-origin: 12px 12px;
        }

        @keyframes compass-pulse-grow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(2.2);
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.55)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.3));
          }
          50% {
            transform: translate(-50%, -50%) scale(3.0);
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 35px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 50px rgba(56, 189, 248, 0.4));
          }
        }
        .compass-pulse-active {
          animation: compass-pulse-grow 1.4s ease-in-out infinite;
        }

        @keyframes spin-slow-centered {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .logo-spin-centered {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: spin-slow-centered 20s linear infinite;
          vertical-align: middle;
          line-height: 0;
        }

        .login-page-fadeout {
          opacity: 0 !important;
          pointer-events: none;
        }
      `}} />

      {/* 2. HD Crossfading background images (high visibility - opacity 0.94) */}
      {bgImages.map((img, idx) => (
        <div
          key={img}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgIndex === idx ? 0.94 : 0,
            transition: "opacity 1.8s ease-in-out",
            zIndex: 0
          }}
        />
      ))}

      {/* 3. Subtle overlay veil to preserve crisp HD image details while offering slight shade */}
      <div style={styles.overlayVeil} />

      {/* 4. Close Button (if popup) */}
      {onClose && (
        <button 
          type="button" 
          onClick={onClose} 
          style={styles.closeBtn}
          title="Zavřít"
        >
          ✕
        </button>
      )}

      {/* 5. Main Layout Frame (Centered layout) */}
      <div 
        style={{
          ...styles.centeredContainer,
          transition: "opacity 0.6s ease-in-out",
          opacity: animationPhase !== "idle" ? 0 : 1,
          pointerEvents: animationPhase !== "idle" ? "none" : "auto"
        }} 
        className="anim-fade-in-organic"
      >
        
        {/* Header Area: Wrapped in deep forest card for perfect legibility */}
        <div style={styles.headerAreaCard}>
          <div style={styles.pillBadge}>
            <svg 
              viewBox="0 0 24 24" 
              width="14" 
              height="14" 
              className="logo-spin" 
              style={{ 
                marginRight: "6px", 
                display: "inline-block", 
                verticalAlign: "middle",
                transform: "translateY(-1px)",
                filter: "drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))"
              }}
            >
              <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.5" strokeDasharray="1, 1.5" />
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="7.5" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
              <line x1="12" y1="9.5" x2="12" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
              <line x1="12" y1="13.5" x2="12" y2="14.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
              <line x1="13.5" y1="12" x2="14.5" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
              <line x1="9.5" y1="12" x2="10.5" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
              <circle cx="12" cy="3.8" r="0.6" fill="#ffffff" />
              <circle cx="12" cy="20.2" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
              <circle cx="20.2" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
              <circle cx="3.8" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
              <polygon points="12,4.5 14,12 12,10.5" fill="#ffffff" />
              <polygon points="12,4.5 10,12 12,10.5" fill="rgba(255, 255, 255, 0.95)" />
              <polygon points="12,19.5 10,12 12,13.5" fill="rgba(255, 255, 255, 0.55)" />
              <polygon points="12,19.5 14,12 12,13.5" fill="rgba(255, 255, 255, 0.4)" />
              <circle cx="12" cy="12" r="1.2" fill="#ffffff" stroke="rgba(0, 0, 0, 0.15)" strokeWidth="0.5" />
            </svg>
            <span style={{ verticalAlign: "middle" }}>{localT.welcomePillText}</span>
          </div>
          
          <div style={styles.logoRowCentered}>
            <span style={styles.brandTitleCentered} className="text-gradient-logo">
              GL
              <svg 
                ref={originalCompassRef}
                viewBox="0 0 24 24" 
                width={isMobile ? 48 : 72} 
                height={isMobile ? 48 : 72}
                className="logo-spin" 
                style={{ 
                  margin: isMobile ? "0 -8px" : "0 -12px", 
                  transform: isMobile ? "translateY(-1px)" : "translateY(-1.5px)",
                  position: "relative",
                  zIndex: 10,
                  visibility: animationPhase !== "idle" ? "hidden" : "visible",
                  filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.55)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.3))"
                }}
              >
                {/* Outer tick ring (compass dial) */}
                <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.5" strokeDasharray="1, 1.5" />
                
                {/* Main Outer Circle */}
                <circle cx="12" cy="12" r="9.5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                
                {/* Inner ring */}
                <circle cx="12" cy="12" r="7.5" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
                
                {/* Cardinal Directions / Indicators */}
                <line x1="12" y1="9.5" x2="12" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
                <line x1="12" y1="13.5" x2="12" y2="14.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
                <line x1="13.5" y1="12" x2="14.5" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
                <line x1="9.5" y1="12" x2="10.5" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />

                {/* Cardinal dots at edge */}
                <circle cx="12" cy="3.8" r="0.6" fill="#ffffff" />
                <circle cx="12" cy="20.2" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
                <circle cx="20.2" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
                <circle cx="3.8" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.7)" />

                {/* Micro ticks at 45 deg */}
                <line x1="6.34" y1="6.34" x2="7.05" y2="7.05" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
                <line x1="17.66" y1="6.34" x2="16.95" y2="7.05" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
                <line x1="6.34" y1="17.66" x2="7.05" y2="16.95" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
                <line x1="17.66" y1="17.66" x2="16.95" y2="16.95" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />

                {/* Compass Needle Group */}
                <g className={animationPhase === "pulsing" ? "needle-spin-fast" : ""}>
                  {/* North pointer (Solid White with a shaded edge) */}
                  <polygon points="12,4.5 14,12 12,10.5" fill="#ffffff" />
                  <polygon points="12,4.5 10,12 12,10.5" fill="rgba(255, 255, 255, 0.95)" />
                  {/* South pointer (Translucent White with a shaded edge) */}
                  <polygon points="12,19.5 10,12 12,13.5" fill="rgba(255, 255, 255, 0.55)" />
                  <polygon points="12,19.5 14,12 12,13.5" fill="rgba(255, 255, 255, 0.4)" />
                </g>

                {/* Center pivot dot */}
                <circle cx="12" cy="12" r="1.2" fill="#ffffff" stroke="rgba(0, 0, 0, 0.15)" strokeWidth="0.5" />
              </svg>
              TR
            </span>
          </div>

          <h2 style={styles.mainHeadlineCentered}>{t.slogan}</h2>
          <p style={styles.mainDescriptionCentered}>{localT.mainDesc}</p>
        </div>

        {/* Center: Frosted Glass Auth Card */}
        <div style={styles.formPaneCentered}>
          <div className="glass-panel" style={styles.cardCentered}>
            
            <div style={styles.cardIntro}>
              <h3 style={styles.formPaneTitle}>
                {isRegister ? t.signUpTab : t.signInTab}
              </h3>
              <p style={styles.formPaneSubtitle}>
                {isRegister ? localT.authCardJoin : localT.authCardWelcome}
              </p>
            </div>

            {/* Tab Swapping */}
            <div style={styles.tabContainer}>
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setError(""); }}
                style={{
                  ...styles.tabButton,
                  borderBottom: !isRegister ? "3px solid var(--accent-forest)" : "3px solid transparent",
                  color: !isRegister ? "var(--text-main)" : "var(--text-muted)",
                  fontWeight: !isRegister ? "800" : "500",
                  fontFamily: "Space Grotesk, sans-serif"
                }}
              >
                <LogIn size={16} /> {t.signInTab}
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setError(""); }}
                style={{
                  ...styles.tabButton,
                  borderBottom: isRegister ? "3px solid var(--accent-forest)" : "3px solid transparent",
                  color: isRegister ? "var(--text-main)" : "var(--text-muted)",
                  fontWeight: isRegister ? "800" : "500",
                  fontFamily: "Space Grotesk, sans-serif"
                }}
              >
                <UserPlus size={16} /> {t.signUpTab}
              </button>
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              {isRegister && (
                <>
                  {/* First Name & Last Name */}
                  <div style={isMobile ? styles.formRowMobile : styles.formRow}>
                    <div style={{ ...styles.inputWrapper, flex: 1 }}>
                      <User size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder={t.firstName}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="glass-input nature-input"
                        style={styles.input}
                        required={isRegister}
                      />
                    </div>
                    <div style={{ ...styles.inputWrapper, flex: 1 }}>
                      <User size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder={t.lastName}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="glass-input nature-input"
                        style={styles.input}
                        required={isRegister}
                      />
                    </div>
                  </div>

                  {/* Username & Date of Birth */}
                  <div style={isMobile ? styles.formRowMobile : styles.formRow}>
                    <div style={{ ...styles.inputWrapper, flex: 1 }}>
                      <User size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder={t.username}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="glass-input nature-input"
                        style={styles.input}
                        required={isRegister}
                      />
                    </div>
                    <div style={{ ...styles.inputWrapper, flex: 1 }}>
                      <Calendar size={18} style={styles.inputIcon} />
                      <input
                        type="date"
                        placeholder={t.dob}
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="glass-input nature-input"
                        style={{ ...styles.input, color: dob ? "var(--text-main)" : "var(--text-muted)" }}
                        required={isRegister}
                      />
                    </div>
                  </div>

                  {/* Phone with Country Prefix Selector */}
                  <div style={isMobile ? styles.formRowMobile : styles.formRow}>
                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="glass-input nature-input"
                        style={styles.prefixSelect}
                      >
                        <option value="+420">🇨🇿 +420</option>
                        <option value="+421">🇸🇰 +421</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+48">🇵🇱 +48</option>
                        <option value="+43">🇦🇹 +43</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+380">🇺🇦 +380</option>
                        <option value="+1">🇺🇸 +1</option>
                      </select>
                      <div style={{ ...styles.inputWrapper, flex: 1 }}>
                        <Phone size={18} style={styles.inputIcon} />
                        <input
                          type="tel"
                          placeholder={t.phone}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="glass-input nature-input"
                          style={styles.input}
                          required={isRegister}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder={t.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input nature-input"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input nature-input"
                  style={styles.input}
                  required
                  minLength={6}
                />
              </div>

              {!isRegister && (
                <div style={styles.rememberRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <span>{t.rememberMe}</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={styles.forgotBtn}
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary nature-btn" 
                style={styles.submitBtn}
              >
                {loading ? t.processing : isRegister ? t.btnSignUp : t.btnSignIn}
              </button>

              {/* Google Sign-in Option */}
              <div style={styles.dividerRow}>
                <div style={styles.dividerLine}></div>
                <span style={styles.dividerText}>{t.orDivider}</span>
                <div style={styles.dividerLine}></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn-secondary" 
                style={{ ...styles.submitBtn, background: "rgba(255, 255, 255, 0.85)", border: "1px solid rgba(45, 106, 79, 0.15)", gap: "10px", marginTop: "0px" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>{isRegister ? t.googleSignUp : t.googleSignIn}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom: Feature Cards displayed horizontally/vertically */}
        <div style={isMobile ? styles.featuresListMobile : styles.featuresListRow}>
          
          <div className="glass-card float-card-1" style={styles.featureCardCentered}>
            <div style={{ ...styles.featureIconContainer, background: "rgba(45, 106, 79, 0.15)", border: "1px solid rgba(45, 106, 79, 0.25)" }}>
              <Map size={18} color="var(--accent-forest)" />
            </div>
            <div style={styles.featureCardBody}>
              <h4 style={styles.featureCardTitle}>{localT.exploreTitle}</h4>
              <p style={styles.featureCardDesc}>{localT.exploreDesc}</p>
            </div>
          </div>

          <div className="glass-card float-card-2" style={styles.featureCardCentered}>
            <div style={{ ...styles.featureIconContainer, background: "rgba(231, 111, 81, 0.15)", border: "1px solid rgba(231, 111, 81, 0.25)" }}>
              <Radio size={18} color="var(--accent-terracotta)" />
            </div>
            <div style={styles.featureCardBody}>
              <h4 style={styles.featureCardTitle}>{localT.liveTitle}</h4>
              <p style={styles.featureCardDesc}>{localT.liveDesc}</p>
            </div>
          </div>

          <div className="glass-card float-card-3" style={styles.featureCardCentered}>
            <div style={{ ...styles.featureIconContainer, background: "rgba(58, 134, 200, 0.15)", border: "1px solid rgba(58, 134, 200, 0.25)" }}>
              <Users size={18} color="var(--accent-sky)" />
            </div>
            <div style={styles.featureCardBody}>
              <h4 style={styles.featureCardTitle}>{localT.friendsTitle}</h4>
              <p style={styles.featureCardDesc}>{localT.friendsDesc}</p>
            </div>
          </div>

        </div>
      </div> {/* Closes centeredContainer to keep overlay outside of transform animations */}

      {/* 6. Animating overlay compass (FLIP animation) */}
      {animationPhase !== "idle" && compassRect && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          pointerEvents: "none"
        }}>
          <svg
            viewBox="0 0 24 24"
            className={
              animationPhase === "pulsing"
                ? "compass-pulse-active"
                : animationPhase === "moving"
                  ? "logo-spin-centered"
                  : ""
            }
            style={{
              position: "absolute",
              transition: animationPhase === "moving" 
                ? "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" 
                : animationPhase === "expanding"
                  ? "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.9s ease-in-out"
                  : "none",
              top: (animationPhase === "pulsing" || animationPhase === "expanding")
                ? "50%"
                : isMovingStarted 
                  ? (compassRect.targetY ?? (window.innerHeight / 2))
                  : (compassRect.top + compassRect.height / 2),
              left: (animationPhase === "pulsing" || animationPhase === "expanding")
                ? "50%"
                : isMovingStarted 
                  ? (compassRect.targetX ?? (window.innerWidth / 2))
                  : (compassRect.left + compassRect.width / 2),
              width: animationPhase === "expanding"
                ? (isMobile ? 72 : 110)
                : (animationPhase === "pulsing")
                  ? (isMobile ? 120 : 160) // doubled size
                  : isMovingStarted 
                    ? (isMobile ? 120 : 160) // doubled size
                    : compassRect.width,
              height: animationPhase === "expanding"
                ? (isMobile ? 72 : 110)
                : (animationPhase === "pulsing")
                  ? (isMobile ? 120 : 160) // doubled size
                  : isMovingStarted 
                    ? (isMobile ? 120 : 160) // doubled size
                    : compassRect.height,
              transform: animationPhase === "expanding"
                ? "translate(-50%, -50%) scale(30)"
                : "translate(-50%, -50%) scale(1)",
              opacity: animationPhase === "expanding" ? 0 : 1,
              filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.6))"
            }}
          >
            {/* Outer tick ring */}
            <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.5" strokeDasharray="1, 1.5" />
            
            {/* Main Outer Circle */}
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            
            {/* Inner ring */}
            <circle cx="12" cy="12" r="7.5" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
            
            {/* Cardinal Directions / Indicators */}
            <line x1="12" y1="9.5" x2="12" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
            <line x1="12" y1="13.5" x2="12" y2="14.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
            <line x1="13.5" y1="12" x2="14.5" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />
            <line x1="9.5" y1="12" x2="10.5" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.5" />

            {/* Cardinal dots at edge */}
            <circle cx="12" cy="3.8" r="0.6" fill="#ffffff" />
            <circle cx="12" cy="20.2" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
            <circle cx="20.2" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
            <circle cx="3.8" cy="12" r="0.6" fill="rgba(255, 255, 255, 0.7)" />

            {/* Micro ticks at 45 deg */}
            <line x1="6.34" y1="6.34" x2="7.05" y2="7.05" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
            <line x1="17.66" y1="6.34" x2="16.95" y2="7.05" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
            <line x1="6.34" y1="17.66" x2="7.05" y2="16.95" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
            <line x1="17.66" y1="17.66" x2="16.95" y2="16.95" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />

            {/* Compass Needle Group */}
            <g className={animationPhase === "pulsing" ? "needle-spin-fast" : ""}>
              {/* North pointer (Solid White with a shaded edge) */}
              <polygon points="12,4.5 14,12 12,10.5" fill="#ffffff" />
              <polygon points="12,4.5 10,12 12,10.5" fill="rgba(255, 255, 255, 0.95)" />
              {/* South pointer (Translucent White with a shaded edge) */}
              <polygon points="12,19.5 10,12 12,13.5" fill="rgba(255, 255, 255, 0.55)" />
              <polygon points="12,19.5 14,12 12,13.5" fill="rgba(255, 255, 255, 0.4)" />
            </g>

            {/* Center pivot dot */}
            <circle cx="12" cy="12" r="1.2" fill="#ffffff" stroke="rgba(0, 0, 0, 0.15)" strokeWidth="0.5" />
          </svg>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "100vh",
    width: "100vw",
    position: "relative",
    overflowX: "hidden",
    overflowY: "auto",
    background: "#fafaf9",
    padding: "48px 24px"
  },
  overlayVeil: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, rgba(45, 106, 79, 0.08) 0%, rgba(231, 111, 81, 0.05) 50%, rgba(58, 134, 200, 0.05) 100%)",
    backdropFilter: "none",
    zIndex: 1
  },
  closeBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(45, 106, 79, 0.2)",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent-forest)",
    cursor: "pointer",
    fontSize: "1rem",
    zIndex: 10,
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  centeredContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: "850px",
    zIndex: 2,
    gap: "32px"
  },
  headerAreaCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    background: "rgba(18, 35, 28, 0.85)",
    border: "2px solid rgba(255, 255, 255, 0.55)",
    borderRadius: "24px",
    padding: "36px 40px",
    width: "100%",
    maxWidth: "600px",
    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    marginTop: "20px"
  },
  pillBadge: {
    background: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "0.8rem",
    fontWeight: "700",
    letterSpacing: "0.05em",
    fontFamily: "Space Grotesk, sans-serif",
    color: "#fff",
    marginBottom: "20px"
  },
  logoRowCentered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px"
  },
  brandTitleCentered: {
    fontSize: "3.2rem",
    fontWeight: "900",
    letterSpacing: "-0.09em",
    lineHeight: 1,
    fontFamily: "Unbounded, sans-serif",
    display: "flex",
    alignItems: "center",
    textShadow: "0 4px 14px rgba(0,0,0,0.35)",
    paddingRight: "0.15em",
    overflow: "visible"
  },
  mainHeadlineCentered: {
    fontSize: "2.9rem",
    fontWeight: "500",
    marginBottom: "16px",
    lineHeight: 1.2,
    fontFamily: "'Great Vibes', cursive",
    color: "#ffffff",
    textShadow: "0 2px 10px rgba(0,0,0,0.35)"
  },
  mainDescriptionCentered: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    fontFamily: "Space Grotesk, sans-serif",
    color: "rgba(255, 255, 255, 0.88)",
    marginBottom: "0px",
    maxWidth: "520px"
  },
  formPaneCentered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: "460px"
  },
  cardCentered: {
    width: "100%",
    padding: "40px 36px",
    boxShadow: "0 25px 55px rgba(0, 0, 0, 0.22)",
    background: "rgba(255, 255, 255, 0.95)",
    border: "2px solid #ffffff",
    borderRadius: "24px",
    zIndex: 2,
    position: "relative"
  },
  cardIntro: {
    textAlign: "center",
    marginBottom: "24px"
  },
  formPaneTitle: {
    fontSize: "1.75rem",
    fontWeight: "800",
    fontFamily: "Outfit, sans-serif",
    color: "var(--text-main)",
    lineHeight: 1.2
  },
  formPaneSubtitle: {
    fontSize: "0.88rem",
    fontFamily: "Space Grotesk, sans-serif",
    color: "var(--text-muted)",
    marginTop: "6px"
  },
  tabContainer: {
    display: "flex",
    marginBottom: "24px",
    borderBottom: "1px solid rgba(45, 106, 79, 0.08)"
  },
  tabButton: {
    flex: 1,
    background: "none",
    border: "none",
    padding: "12px",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    outline: "none"
  },
  errorAlert: {
    background: "rgba(231, 111, 81, 0.08)",
    border: "1px solid rgba(231, 111, 81, 0.25)",
    color: "var(--accent-terracotta)",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontFamily: "Space Grotesk, sans-serif",
    marginBottom: "16px",
    lineHeight: "1.4"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-muted)",
    pointerEvents: "none"
  },
  input: {
    width: "100%",
    paddingLeft: "40px",
    fontSize: "0.9rem",
    height: "44px"
  },
  submitBtn: {
    marginTop: "8px",
    width: "100%",
    fontSize: "1.05rem",
    height: "46px"
  },
  featuresListRow: {
    display: "flex",
    flexDirection: "row",
    gap: "24px",
    width: "100%",
    marginTop: "20px",
    justifyContent: "center"
  },
  featuresListMobile: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    marginTop: "10px"
  },
  featureCardCentered: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "14px 18px",
    background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid rgba(45, 106, 79, 0.15)",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    flex: 1,
    maxWidth: "320px",
    transition: "border 0.25s ease, background 0.25s ease"
  },
  featureIconContainer: {
    borderRadius: "10px",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    flexShrink: 0
  },
  featureCardBody: {
    display: "flex",
    flexDirection: "column"
  },
  featureCardTitle: {
    fontSize: "0.95rem",
    fontWeight: "700",
    fontFamily: "Outfit, sans-serif",
    color: "var(--text-main)",
    letterSpacing: "0.02em",
    marginBottom: "1px"
  },
  featureCardDesc: {
    fontSize: "0.8rem",
    fontFamily: "Space Grotesk, sans-serif",
    color: "var(--text-muted)",
    lineHeight: 1.35
  },
  formRow: {
    display: "flex",
    gap: "12px",
    width: "100%"
  },
  formRowMobile: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%"
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    margin: "12px 0 4px 0",
    width: "100%",
    gap: "8px"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(45, 106, 79, 0.15)"
  },
  dividerText: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    fontFamily: "Space Grotesk, sans-serif"
  },
  prefixSelect: {
    width: "110px",
    paddingLeft: "10px",
    paddingRight: "24px",
    height: "44px",
    fontSize: "0.9rem",
    background: "rgba(255, 255, 255, 0.7)",
    border: "1px solid var(--glass-border)",
    borderRadius: "10px",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    backgroundSize: "14px",
    cursor: "pointer",
    outline: "none"
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "-4px",
    marginBottom: "4px",
    width: "100%"
  },
  forgotBtn: {
    background: "none",
    border: "none",
    padding: "0",
    color: "var(--accent-forest)",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "Space Grotesk, sans-serif",
    textDecoration: "underline",
    outline: "none"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    color: "var(--text-dark)",
    cursor: "pointer",
    fontFamily: "Space Grotesk, sans-serif",
    userSelect: "none"
  },
  checkbox: {
    cursor: "pointer",
    accentColor: "var(--accent-forest)",
    width: "16px",
    height: "16px",
    borderRadius: "4px"
  }
};
