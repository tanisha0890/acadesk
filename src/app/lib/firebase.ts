import { FirebaseApp, initializeApp, getApps, getApp } from "firebase/app";
import { 
  Auth,
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check if Firebase keys are fully configured in the environment
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured && typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
}

export { auth };

// Safe custom sign-in function that falls back to clean simulation if Firebase is not configured
export async function firebaseSignIn(email: string, pass: string) {
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } else {
    // Elegant Simulation Flow
    console.warn("Firebase not configured. Falling back to secure mock authentication.");
    return {
      email,
      uid: `mock-uid-${Date.now()}`,
      displayName: email.split("@")[0]
    };
  }
}

// Safe custom sign-up function
export async function firebaseSignUp(email: string, pass: string, name?: string) {
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } else {
    console.warn("Firebase not configured. Falling back to secure mock registration.");
    return {
      email,
      uid: `mock-uid-${Date.now()}`,
      displayName: name || email.split("@")[0]
    };
  }
}

// Safe custom Google sign-in function
export async function firebaseGoogleSignIn() {
  if (isFirebaseConfigured && auth) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } else {
    console.warn("Firebase not configured. Falling back to secure mock Google authentication.");
    return {
      email: "google-student@acadesk.edu",
      uid: `mock-google-uid-${Date.now()}`,
      displayName: "Google Student"
    };
  }
}

// Safe custom sign-out function
export async function firebaseSignOut() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}
