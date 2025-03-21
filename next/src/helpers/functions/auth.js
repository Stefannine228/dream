import {
  auth,
  database,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  ref,
  set,
  get,
} from "../../helpers/firebase.js";

export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const token = await user.getIdToken();

    localStorage.setItem("googleToken", token);
    console.log("Logged in with Google! UID:", user.uid);

    await saveUIDToFirebase(user);
    return user;
  } catch (error) {
    console.error("Error with Google Sign-In:", error.message);
  }
}

async function saveUIDToFirebase(user) {
  try {
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      email: user.email,
      timestamp: Date.now(),
    });
    console.log("✅ User data saved!");
  } catch (error) {
    console.error("❌ Firebase write error:", error);
  }
}

export async function googleLogout() {
  try {
    await signOut(auth);
    localStorage.removeItem("googleToken");
    console.log("Logged out");
  } catch (error) {
    console.error("Error with logout:", error.message);
  }
}

export function isTokenExpired() {
  const token = localStorage.getItem("googleToken");
  if (!token) return true;
  const decoded = JSON.parse(atob(token.split(".")[1]));
  return Date.now() > decoded.exp * 1000;
}
