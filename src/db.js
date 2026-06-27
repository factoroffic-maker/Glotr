import { 
  appOnSnapshot, 
  appAddDoc, 
  appSetDoc, 
  appDeleteDoc, 
  appGetDocs, 
  getAppAuth 
} from "./firebase";

// ==========================================
// USER & PROFILE MANAGEMENT
// ==========================================

export const createUserProfile = async (uid, email, displayName, extraData = {}) => {
  const finalDisplayName = extraData.username || displayName || email.split("@")[0];
  return appSetDoc("users", uid, {
    uid,
    email,
    displayName: finalDisplayName,
    username: extraData.username || "",
    firstName: extraData.firstName || "",
    lastName: extraData.lastName || "",
    phone: extraData.phone || "",
    dob: extraData.dob || "",
    online: true
  });
};

export const searchUserByEmail = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const snapshot = await appGetDocs("users", [
    { field: "email", op: "==", value: normalizedEmail }
  ]);
  if (snapshot.docs.length === 0) return null;
  return snapshot.docs[0].data();
};

// ==========================================
// FRIENDS & FRIEND REQUESTS LOGIC
// ==========================================

// Send a friend request
export const sendFriendRequest = async (currentUser, targetUser) => {
  // Check if they are already friends
  const existingFriends = await checkFriendship(currentUser.uid, targetUser.uid);
  if (existingFriends) {
    throw new Error("You are already friends with this user!");
  }

  // Check if there is already an active request
  const reqSnapshot = await appGetDocs("friendRequests", [
    { field: "from", op: "==", value: currentUser.uid },
    { field: "to", op: "==", value: targetUser.uid }
  ]);
  
  const reverseReqSnapshot = await appGetDocs("friendRequests", [
    { field: "from", op: "==", value: targetUser.uid },
    { field: "to", op: "==", value: currentUser.uid }
  ]);

  if (reqSnapshot.docs.length > 0 || reverseReqSnapshot.docs.length > 0) {
    throw new Error("A pending friend request already exists between you two!");
  }

  // Create request
  return appAddDoc("friendRequests", {
    from: currentUser.uid,
    fromName: currentUser.displayName || currentUser.email.split("@")[0],
    to: targetUser.uid,
    toName: targetUser.displayName || targetUser.email.split("@")[0],
    status: "pending"
  });
};

// Check if friendship exists
export const checkFriendship = async (uid1, uid2) => {
  const snapshot = await appGetDocs("friendships", [
    { field: "users", op: "array-contains", value: uid1 }
  ]);
  
  return snapshot.docs.some(doc => {
    const data = doc.data();
    return data.users.includes(uid2);
  });
};

// Listen to inbound friend requests
export const subscribeToIncomingRequests = (uid, callback) => {
  return appOnSnapshot(
    "friendRequests",
    [
      { field: "to", op: "==", value: uid },
      { field: "status", op: "==", value: "pending" }
    ],
    null,
    (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    }
  );
};

// Listen to outbound friend requests
export const subscribeToOutgoingRequests = (uid, callback) => {
  return appOnSnapshot(
    "friendRequests",
    [
      { field: "from", op: "==", value: uid },
      { field: "status", op: "==", value: "pending" }
    ],
    null,
    (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    }
  );
};

// Listen to list of friends
export const subscribeToFriendsList = (uid, callback) => {
  return appOnSnapshot(
    "friendships",
    [{ field: "users", op: "array-contains", value: uid }],
    null,
    async (snapshot) => {
      const friendships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Map friendships to actual friend user records (to show online/offline status)
      const friendIds = friendships.map(f => f.users.find(id => id !== uid)).filter(Boolean);
      
      if (friendIds.length === 0) {
        callback([]);
        return;
      }
      
      // Query users
      const usersSnapshot = await appGetDocs("users", []);
      const allUsers = usersSnapshot.docs.map(d => d.data());
      
      const friends = allUsers.filter(u => friendIds.includes(u.uid));
      callback(friends);
    }
  );
};

// Accept friend request
export const acceptFriendRequest = async (request, currentUser) => {
  // Delete the friend request
  await appDeleteDoc("friendRequests", request.id);
  
  // Create friendship document
  return appAddDoc("friendships", {
    users: [request.from, currentUser.uid],
    names: [request.fromName, currentUser.displayName || currentUser.email.split("@")[0]],
    createdAt: new Date().toISOString()
  });
};

// Decline friend request
export const declineFriendRequest = async (requestId) => {
  return appDeleteDoc("friendRequests", requestId);
};

// Remove friend
export const removeFriend = async (friendId, currentUserId) => {
  const snapshot = await appGetDocs("friendships", [
    { field: "users", op: "array-contains", value: currentUserId }
  ]);
  
  const targetFriendship = snapshot.docs.find(doc => {
    return doc.data().users.includes(friendId);
  });
  
  if (targetFriendship) {
    return appDeleteDoc("friendships", targetFriendship.id);
  }
};

// ==========================================
// LIVE STREAMING & CHAT LOGIC
// ==========================================

// Create a stream
export const startLiveStream = async (currentUser, title) => {
  // Ensure user doesn't already have an active stream
  const activeSnapshot = await appGetDocs("streams", [
    { field: "hostId", op: "==", value: currentUser.uid }
  ]);
  
  if (activeSnapshot.docs.length > 0) {
    // Delete existing stream first
    await Promise.all(activeSnapshot.docs.map(d => appDeleteDoc("streams", d.id)));
  }

  // Create stream doc (in our mock and real db, we'll store this in `streams` collection)
  const streamId = "stream_" + currentUser.uid;
  await appSetDoc("streams", streamId, {
    id: streamId,
    hostId: currentUser.uid,
    hostName: currentUser.displayName || currentUser.email.split("@")[0],
    title: title || `${currentUser.displayName || currentUser.email.split("@")[0]}'s Live Stream`,
    active: true,
    viewersCount: 0,
    playbackUrl: "mock_stream_url_" + currentUser.uid, // Will use camera loopback
    createdAt: new Date().toISOString()
  });
  
  return streamId;
};

// Stop a stream
export const stopLiveStream = async (streamId) => {
  // Clear out chat messages in subcollection or delete the stream doc
  return appDeleteDoc("streams", streamId);
};

// Subscribe to active streams hosted by friends
export const subscribeToFriendsStreams = (currentUserId, callback) => {
  // 1. Listen to friendships to know who currentUserId's friends are
  return appOnSnapshot(
    "friendships",
    [{ field: "users", op: "array-contains", value: currentUserId }],
    null,
    (friendshipsSnapshot) => {
      const friendships = friendshipsSnapshot.docs.map(doc => doc.data());
      const friendIds = friendships.map(f => f.users.find(id => id !== currentUserId)).filter(Boolean);
      
      if (friendIds.length === 0) {
        callback([]);
        return;
      }
      
      // 2. Listen to active streams
      return appOnSnapshot(
        "streams",
        [], // List all streams, then filter on client to ensure we only get friends' streams
        null,
        (streamsSnapshot) => {
          const allStreams = streamsSnapshot.docs.map(d => d.data());
          // Filter streams to only show active ones hosted by friends
          const friendsStreams = allStreams.filter(s => s.active && friendIds.includes(s.hostId));
          callback(friendsStreams);
        }
      );
    }
  );
};

// Get single stream status
export const subscribeToStream = (streamId, callback) => {
  return appOnSnapshot(
    "streams",
    [],
    null,
    (snapshot) => {
      const streamDoc = snapshot.docs.find(d => d.id === streamId);
      callback(streamDoc ? streamDoc.data() : null);
    }
  );
};

// Subscribe to stream chat messages
export const subscribeToChatMessages = (streamId, callback) => {
  // For simplicity, we store chat messages in a collection named `chat_messages`
  // with a `streamId` field. This works identically in mock and real Firestore.
  return appOnSnapshot(
    "chat_messages",
    [{ field: "streamId", op: "==", value: streamId }],
    "createdAt", // Sort by timestamp
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    }
  );
};

// Send a chat message
export const sendChatMessage = async (streamId, currentUser, text) => {
  return appAddDoc("chat_messages", {
    streamId,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || currentUser.email.split("@")[0],
    text: text.trim(),
    createdAt: new Date().toISOString()
  });
};

// ==========================================
// PUBLIC MAP POSTS LOGIC
// ==========================================

// Subscribe to all public map posts
export const subscribeToPublicPosts = (callback) => {
  return appOnSnapshot(
    "posts",
    [],
    "createdAt",
    (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually descending (newest first) in case snapshot sort is limited in mock db
      const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(sortedPosts);
    }
  );
};

// Create a new public post on the map
export const createPublicPost = async (currentUser, text, lat, lng, guestName = "Anonym") => {
  const authorName = currentUser 
    ? (currentUser.displayName || currentUser.email.split("@")[0])
    : (guestName.trim() || "Anonym");
  
  return appAddDoc("posts", {
    authorName,
    authorId: currentUser ? currentUser.uid : "guest",
    text: text.trim(),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    createdAt: new Date().toISOString()
  });
};
