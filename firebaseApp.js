import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

window.apiKey = "AIzaSyB4D_VgeVN61AV3RefuZjGGzConulsPTAE",
window.authDomain ="map-dream-ed6e1.firebaseapp.com",
window.databaseURL ="https://map-dream-ed6e1-default-rtdb.europe-west1.firebasedatabase.app",
window.projectId = "map-dream-ed6e1",
window.storageBucket ="map-dream-ed6e1.firebasestorage.app",
window.messagingSenderId ="553244592475",
window.appId = "1:553244592475:web:8d9818c7423da54c06327e",
window.measurementId = "G-B3HJBJ36F8"

  const firebaseConfig = {
    apiKey: window.apiKey,
    authDomain: window.authDomain,
    databaseURL: window.databaseURL,
    projectId: window.projectId,
    storageBucket: window.storageBucket,
    messagingSenderId: window.messagingSenderId,
    appId: window.appId,
    measurementId: window.measurementId
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const loginBtn = document.getElementById('login')
  const addDataBtn = document.querySelector('.addDataBtn')
  const loginGoogleContainer = document.querySelector('.loginGoogleContainer')

  document.addEventListener('DOMContentLoaded', function() { 
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ User is authenticated:", user.uid);
        addDataBtn.style.display = "block";
        loginGoogleContainer.style.display = "none";
      } else {
        console.log("❌ No authenticated user found!");
        addDataBtn.style.display  = "none";
        loginGoogleContainer.style.display = "block";
      }
    });
  });

  export async function googleLogin() {
  
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      console.log(result, 'result')
  
      const uid = result.user.uid;
      const token = await result.user.getIdToken();
      const userEmail = result.user.email;
      localStorage.setItem('googleToken', token);
      console.log("Logged in with Google! UID:", uid, token);
  
      const obj = {
        uid: uid,
        userEmail: userEmail,
      }
  
      saveUIDToFirebase(obj);
    } catch (error) {
      console.error("Error with Google Sign-In:", error.message);
    }
  }

  // Initialize Firebase Database
const db = getDatabase();

  async function saveUIDToFirebase(user) {
    try {
      const db = getDatabase();
      console.log(user, 'user')
      const userRef = ref(db, `users/${user.uid}`);
  
      console.log("📌 Writing to Firebase at:", `users/${user.uid}`);
  
      await set(userRef, {
        uid: user.uid,
        email: user.userEmail,
        timestamp: Date.now()
      });
  
      console.log("✅ User data saved!");
  
      // Read data to verify
      const snapshot = await get(userRef);
      console.log("📝 Firebase data:", snapshot.val());
  
    } catch (error) {
      console.error("❌ Firebase write error:", error);
    }
  }

  async function googleLogout() {
    try {
      await signOut(auth);
      localStorage.removeItem('googleToken');
      console.log("Logged out");
  
      // Clear user info
      //userInfo.innerHTML = '';
  
      // Update the UI
      //updateUI();
    } catch (error) {
      console.error("Error with logout:", error.message);
    }
  }

  function isTokenExpired() {
    const token = localStorage.getItem('googleToken');
    if (!token) return true;
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = decoded.exp * 1000;
    return Date.now() > expiryTime;
  }
  
  // Redirect to login if token is expired
  function checkTokenAndRedirect() {
    if (isTokenExpired()) {
      googleLogout(); // Logout the user
      window.location.href = "/login.html"; // Redirect to login page
    }
  }

 if (loginBtn) {
   loginBtn.addEventListener('click', googleLogin);
 }
  