import React, { useState, useEffect } from "react";
import { 
  searchUserByEmail, 
  sendFriendRequest, 
  subscribeToIncomingRequests, 
  subscribeToOutgoingRequests, 
  subscribeToFriendsList,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend
} from "../db";
import { Search, UserPlus, UserCheck, UserX, Clock, UserMinus, ShieldAlert } from "lucide-react";
import { translations } from "../i18n";

export default function FriendsTab({ user, lang = "cs" }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searchSuccess, setSearchSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  const t = translations[lang] || translations.cs;

  // Subscribe to friendships and requests
  useEffect(() => {
    if (!user) return;

    const unsubIncoming = subscribeToIncomingRequests(user.uid, setIncomingRequests);
    const unsubOutgoing = subscribeToOutgoingRequests(user.uid, setOutgoingRequests);
    const unsubFriends = subscribeToFriendsList(user.uid, setFriends);

    return () => {
      unsubIncoming();
      unsubOutgoing();
      unsubFriends();
    };
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setSearchSuccess("");
    setSearchResults(null);
    if (!searchEmail.trim()) return;

    setLoading(true);
    try {
      const foundUser = await searchUserByEmail(searchEmail);
      if (!foundUser) {
        setSearchError(t.errNoUser);
      } else if (foundUser.uid === user.uid) {
        setSearchError(t.errAddSelf);
      } else {
        setSearchResults(foundUser);
      }
    } catch (err) {
      setSearchError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResults) return;
    setSearchError("");
    setSearchSuccess("");
    try {
      await sendFriendRequest(user, searchResults);
      setSearchSuccess(`${t.friendRequestSent} (${searchResults.displayName})`);
      setSearchResults(null);
      setSearchEmail("");
    } catch (err) {
      setSearchError(err.message || "Error");
    }
  };

  const handleAccept = async (req) => {
    try {
      await acceptFriendRequest(req, user);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDecline = async (reqId) => {
    try {
      await declineFriendRequest(reqId);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (confirm("Are you sure?")) {
      try {
        await removeFriend(friendId, user.uid);
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <div style={styles.grid}>
      {/* Left side: Network Lists (Friends, Incoming) */}
      <div style={styles.leftCol}>
        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>
              <Clock size={18} color="var(--accent-terracotta)" />
              <span>{t.incomingRequests} ({incomingRequests.length})</span>
            </h3>
            <div style={styles.list}>
              {incomingRequests.map((req) => (
                <div key={req.id} className="glass-card" style={styles.item}>
                  <div style={styles.itemMeta}>
                    <span style={styles.itemName}>{req.fromName}</span>
                    <span style={styles.itemSub}>{req.from}</span>
                  </div>
                  <div style={styles.actionBtns}>
                    <button 
                      onClick={() => handleAccept(req)}
                      className="btn-primary" 
                      style={styles.actionBtnSmall}
                      title="Accept Request"
                    >
                      <UserCheck size={16} /> {t.btnAccept}
                    </button>
                    <button 
                      onClick={() => handleDecline(req.id)}
                      className="btn-secondary" 
                      style={{ ...styles.actionBtnSmall, color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.25)" }}
                      title="Decline Request"
                    >
                      <UserX size={16} /> {t.btnDecline}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>
            <UserCheck size={18} color="var(--accent-forest)" />
            <span>{t.myFriends} ({friends.length})</span>
          </h3>
          {friends.length === 0 ? (
            <p style={styles.emptyText}>{t.emptyFriends}</p>
          ) : (
            <div style={styles.list}>
              {friends.map((friend) => (
                <div key={friend.uid} className="glass-card" style={styles.item}>
                  <div style={styles.friendMeta}>
                    <div style={styles.avatar}>
                      {friend.displayName ? friend.displayName.charAt(0).toUpperCase() : "F"}
                    </div>
                    <div>
                      <div style={styles.itemName}>{friend.displayName}</div>
                      <div style={styles.statusRow}>
                        <span style={{
                          ...styles.statusDot,
                          backgroundColor: friend.online ? "#2d6a4f" : "#9ca3af"
                        }}></span>
                        <span style={styles.statusText}>{friend.online ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFriend(friend.uid)}
                    className="btn-secondary"
                    style={styles.removeBtn}
                    title="Remove Friend"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Add Friends (Search) & Sent Requests */}
      <div style={styles.rightCol}>
        {/* Search Panel */}
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>
            <Search size={18} color="var(--accent-sky)" />
            <span>{t.addFriendTitle}</span>
          </h3>

          <form onSubmit={handleSearch} style={styles.searchForm}>
            <div style={styles.inputWrapper}>
              <input
                type="email"
                placeholder="friend@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="glass-input"
                style={styles.searchInput}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-secondary" style={styles.searchBtn}>
              {loading ? t.searching : t.btnSearch}
            </button>
          </form>

          {/* Search Result display */}
          {searchResults && (
            <div style={styles.resultCard} className="glass-card">
              <div style={styles.resultMeta}>
                <div style={styles.avatarLarge}>
                  {searchResults.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={styles.resultName}>{searchResults.displayName}</h4>
                  <p style={styles.resultEmail}>{searchResults.email}</p>
                </div>
              </div>
              <button 
                onClick={handleSendRequest}
                className="btn-primary" 
                style={{ width: "100%", marginTop: "12px" }}
              >
                <UserPlus size={16} /> {t.addFriendTitle}
              </button>
            </div>
          )}

          {searchError && (
            <div style={styles.searchError}>
              <ShieldAlert size={16} /> <span>{searchError}</span>
            </div>
          )}
          {searchSuccess && (
            <div style={styles.searchSuccess}>
              <UserCheck size={16} /> <span>{searchSuccess}</span>
            </div>
          )}
        </div>

        {/* Sent / Outgoing Requests */}
        {outgoingRequests.length > 0 && (
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>
              <Clock size={18} color="var(--text-muted)" />
              <span>{t.sentRequests} ({outgoingRequests.length})</span>
            </h3>
            <div style={styles.list}>
              {outgoingRequests.map((req) => (
                <div key={req.id} className="glass-card" style={styles.item}>
                  <div style={styles.itemMeta}>
                    <span style={styles.itemName}>{req.toName}</span>
                    <span style={styles.itemSub}>Čeká na schválení</span>
                  </div>
                  <button 
                    onClick={() => handleDecline(req.id)}
                    className="btn-secondary" 
                    style={styles.cancelBtn}
                    title="Cancel Friend Request"
                  >
                    {t.btnCancel}
                  </button>
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    alignItems: "start"
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  panel: {
    padding: "24px",
    boxShadow: "0 8px 30px rgba(45, 106, 79, 0.03)"
  },
  panelTitle: {
    fontSize: "1.15rem",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid var(--glass-border)",
    paddingBottom: "12px",
    color: "var(--text-main)"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    transition: "all 0.2s ease",
    border: "1px solid var(--glass-border)"
  },
  itemMeta: {
    display: "flex",
    flexDirection: "column"
  },
  itemName: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--text-main)"
  },
  itemSub: {
    fontSize: "0.75rem",
    color: "var(--text-muted)"
  },
  actionBtns: {
    display: "flex",
    gap: "8px"
  },
  actionBtnSmall: {
    padding: "8px 12px",
    fontSize: "0.85rem",
    borderRadius: "8px"
  },
  friendMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "var(--accent-forest-glow)",
    border: "1px solid rgba(45, 106, 79, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "var(--accent-forest)",
    fontSize: "1rem"
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "2px"
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%"
  },
  statusText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)"
  },
  removeBtn: {
    padding: "8px",
    borderRadius: "8px",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    background: "rgba(239, 68, 68, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtn: {
    padding: "6px 12px",
    fontSize: "0.8rem",
    borderRadius: "8px"
  },
  emptyText: {
    color: "var(--text-muted)",
    fontSize: "0.9rem",
    textAlign: "center",
    padding: "20px"
  },
  searchForm: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px"
  },
  inputWrapper: {
    flex: 1
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "0.9rem"
  },
  searchBtn: {
    padding: "10px 20px"
  },
  resultCard: {
    padding: "20px",
    border: "1px solid rgba(45, 106, 79, 0.2)"
  },
  resultMeta: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px"
  },
  avatarLarge: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "var(--accent-sky-glow)",
    border: "1px solid rgba(58, 134, 200, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "var(--accent-sky)",
    fontSize: "1.2rem"
  },
  resultName: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text-main)"
  },
  resultEmail: {
    fontSize: "0.8rem",
    color: "var(--text-muted)"
  },
  searchError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--accent-terracotta)",
    background: "rgba(231, 111, 81, 0.08)",
    border: "1px solid rgba(231, 111, 81, 0.25)",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    marginTop: "12px"
  },
  searchSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--accent-forest)",
    background: "rgba(45, 106, 79, 0.08)",
    border: "1px solid rgba(45, 106, 79, 0.25)",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    marginTop: "12px"
  }
};
