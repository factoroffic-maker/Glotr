import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

// Firebase Configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase config is fully loaded
const isFirebaseConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "your-api-key-here" &&
  firebaseConfig.projectId;

let auth;
let db;
let isMock = false;

if (isFirebaseConfigValid) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize real Firebase, falling back to mock mode:", error);
    isMock = true;
  }
} else {
  console.warn("⚠️ Firebase credentials not configured in .env.local. Running in offline MOCK mode.");
  isMock = true;
}

// ==========================================
// MOCK IMPLEMENTATION (LOCAL STORAGE BASED)
// ==========================================
class MockAuth {
  constructor() {
    this.listeners = [];
    this.currentUser = JSON.parse(localStorage.getItem("mock_current_user")) || null;
    
    // Simulate async auth state restoration
    setTimeout(() => {
      this.triggerListeners();
    }, 100);
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  triggerListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  async signInWithEmailAndPassword(email, password) {
    const users = JSON.parse(localStorage.getItem("mock_users")) || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password (Mock Auth)");
    }
    
    this.currentUser = { uid: user.uid, email: user.email, displayName: user.displayName };
    localStorage.setItem("mock_current_user", JSON.stringify(this.currentUser));
    
    // Update online status
    const allUsers = users.map(u => u.uid === user.uid ? { ...u, online: true } : u);
    localStorage.setItem("mock_users", JSON.stringify(allUsers));
    
    this.triggerListeners();
    return { user: this.currentUser };
  }

  async createUserWithEmailAndPassword(email, password, displayName) {
    const users = JSON.parse(localStorage.getItem("mock_users")) || [];
    if (users.find(u => u.email === email)) {
      throw new Error("Email already in use (Mock Auth)");
    }
    
    const newUser = {
      uid: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      displayName: displayName || email.split("@")[0],
      password, // Note: saved in plain text only for mock purposes!
      online: true,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem("mock_users", JSON.stringify(users));
    
    this.currentUser = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
    localStorage.setItem("mock_current_user", JSON.stringify(this.currentUser));
    
    this.triggerListeners();
    return { user: this.currentUser };
  }

  async signInWithGoogle() {
    await new Promise(resolve => setTimeout(resolve, 800));
    const googleEmail = "google.explorer@gmail.com";
    const googleName = "Google Explorer";
    const users = JSON.parse(localStorage.getItem("mock_users")) || [];
    let user = users.find(u => u.email === googleEmail);
    if (!user) {
      user = {
        uid: "google_" + Math.random().toString(36).substr(2, 9),
        email: googleEmail,
        displayName: googleName,
        online: true,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      localStorage.setItem("mock_users", JSON.stringify(users));
    } else {
      user.online = true;
      localStorage.setItem("mock_users", JSON.stringify(users));
    }
    
    this.currentUser = { uid: user.uid, email: user.email, displayName: user.displayName };
    localStorage.setItem("mock_current_user", JSON.stringify(this.currentUser));
    this.triggerListeners();
    return { user: this.currentUser };
  }

  async sendPasswordResetEmail(email) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const users = JSON.parse(localStorage.getItem("mock_users")) || [];
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error("Uživatel s tímto e-mailem nebyl nalezen. (Mock Auth)");
    }
    return true;
  }

  async signOut() {
    if (this.currentUser) {
      const users = JSON.parse(localStorage.getItem("mock_users")) || [];
      const allUsers = users.map(u => u.uid === this.currentUser.uid ? { ...u, online: false } : u);
      localStorage.setItem("mock_users", JSON.stringify(allUsers));
    }
    
    this.currentUser = null;
    localStorage.removeItem("mock_current_user");
    this.triggerListeners();
  }
}

class MockFirestore {
  constructor() {
    this.listeners = {};
    
    // Listen to storage events to support multi-tab synchronization
    window.addEventListener("storage", (e) => {
      if (e.key && (e.key.startsWith("mock_") || e.key === "mock_users")) {
        this.triggerAllListeners();
      }
    });
  }

  triggerAllListeners() {
    Object.keys(this.listeners).forEach(path => {
      this.listeners[path].forEach(cb => cb());
    });
  }

  // Local storage helpers
  getData(key) {
    return JSON.parse(localStorage.getItem("mock_col_" + key)) || [];
  }

  setData(key, data) {
    localStorage.setItem("mock_col_" + key, JSON.stringify(data));
    this.triggerAllListeners();
  }

  // Basic collection query matching
  subscribe(collectionName, filters, sortField, callback) {
    const runQuery = () => {
      let data = [];
      if (collectionName === "users") {
        data = JSON.parse(localStorage.getItem("mock_users")) || [];
      } else {
        data = this.getData(collectionName);
      }
      
      // Apply filters
      if (filters && filters.length > 0) {
        data = data.filter(item => {
          return filters.every(f => {
            const { field, op, value } = f;
            if (op === "==") return item[field] === value;
            if (op === "array-contains") return Array.isArray(item[field]) && item[field].includes(value);
            if (op === "in") return Array.isArray(value) && value.includes(item[field]);
            return true;
          });
        });
      }
      
      // Apply sorting
      if (sortField) {
        data.sort((a, b) => {
          const valA = a[sortField] || "";
          const valB = b[sortField] || "";
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        });
      }
      
      // Map to Firestore-like snapshot
      const snapshot = {
        docs: data.map(docData => ({
          id: docData.id || docData.uid,
          data: () => docData
        }))
      };
      
      callback(snapshot);
    };

    const path = `${collectionName}_${JSON.stringify(filters || [])}`;
    if (!this.listeners[path]) {
      this.listeners[path] = [];
    }
    this.listeners[path].push(runQuery);
    
    // Initial run
    runQuery();
    
    return () => {
      this.listeners[path] = this.listeners[path].filter(cb => cb !== runQuery);
    };
  }

  async addDocument(collectionName, docData) {
    const list = this.getData(collectionName);
    const id = "doc_" + Math.random().toString(36).substr(2, 9);
    const newDoc = { 
      id, 
      ...docData, 
      createdAt: new Date().toISOString() 
    };
    list.push(newDoc);
    this.setData(collectionName, list);
    return { id };
  }

  async setDocument(collectionName, docId, docData) {
    const list = this.getData(collectionName);
    const index = list.findIndex(d => (d.id || d.uid) === docId);
    const updatedDoc = { 
      id: docId, 
      ...docData, 
      updatedAt: new Date().toISOString() 
    };
    
    if (index >= 0) {
      list[index] = updatedDoc;
    } else {
      list.push(updatedDoc);
    }
    
    this.setData(collectionName, list);
  }

  async deleteDocument(collectionName, docId) {
    let list = this.getData(collectionName);
    list = list.filter(d => (d.id || d.uid) !== docId);
    this.setData(collectionName, list);
  }

  async getDocuments(collectionName, filters) {
    let data = [];
    if (collectionName === "users") {
      data = JSON.parse(localStorage.getItem("mock_users")) || [];
    } else {
      data = this.getData(collectionName);
    }
    
    if (filters && filters.length > 0) {
      data = data.filter(item => {
        return filters.every(f => {
          const { field, op, value } = f;
          if (op === "==") return item[field] === value;
          if (op === "array-contains") return Array.isArray(item[field]) && item[field].includes(value);
          return true;
        });
      });
    }
    
    return {
      docs: data.map(docData => ({
        id: docData.id || docData.uid,
        data: () => docData
      }))
    };
  }
}

class RealAuthWrapper {
  constructor(authInstance) {
    this.auth = authInstance;
  }
  
  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }
  
  async signInWithEmailAndPassword(email, password) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  
  async createUserWithEmailAndPassword(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName) {
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(cred.user, { displayName });
    }
    return cred;
  }
  
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }
  
  async signOut() {
    return signOut(this.auth);
  }
  
  async sendPasswordResetEmail(email) {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    return sendPasswordResetEmail(this.auth, email);
  }
  
  get currentUser() {
    return this.auth.currentUser;
  }
}

// Export Auth wrappers
export const mockAuth = new MockAuth();
export const mockFirestore = new MockFirestore();
export const realAuth = auth ? new RealAuthWrapper(auth) : null;

export const getAppAuth = () => isMock ? mockAuth : realAuth;
export const getAppDb = () => isMock ? mockFirestore : db;
export const getIsMock = () => isMock;

// Real vs Mock Firestore Helper Methods
export const appOnSnapshot = (collectionName, filters, sortField, callback) => {
  if (isMock) {
    return mockFirestore.subscribe(collectionName, filters, sortField, callback);
  } else {
    // Build real Firestore query
    const colRef = collection(db, collectionName);
    let q = colRef;
    
    if (filters) {
      filters.forEach(f => {
        q = query(q, where(f.field, f.op, f.value));
      });
    }
    
    if (sortField) {
      q = query(q, orderBy(sortField));
    }
    
    return onSnapshot(q, callback);
  }
};

export const appAddDoc = async (collectionName, data) => {
  if (isMock) {
    return mockFirestore.addDocument(collectionName, data);
  } else {
    return addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp()
    });
  }
};

export const appSetDoc = async (collectionName, docId, data) => {
  if (isMock) {
    return mockFirestore.setDocument(collectionName, docId, data);
  } else {
    return setDoc(doc(db, collectionName, docId), data, { merge: true });
  }
};

export const appDeleteDoc = async (collectionName, docId) => {
  if (isMock) {
    return mockFirestore.deleteDocument(collectionName, docId);
  } else {
    return deleteDoc(doc(db, collectionName, docId));
  }
};

export const appGetDocs = async (collectionName, filters) => {
  if (isMock) {
    return mockFirestore.getDocuments(collectionName, filters);
  } else {
    const colRef = collection(db, collectionName);
    let q = colRef;
    if (filters) {
      filters.forEach(f => {
        q = query(q, where(f.field, f.op, f.value));
      });
    }
    return getDocs(q);
  }
};
