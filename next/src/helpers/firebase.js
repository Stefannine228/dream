import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child } from "firebase/database";
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
    apiKey: "AIzaSyB4D_VgeVN61AV3RefuZjGGzConulsPTAE",
    authDomain: "map-dream-ed6e1.firebaseapp.com",
    databaseURL: "https://map-dream-ed6e1-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "map-dream-ed6e1",
    storageBucket: "map-dream-ed6e1.firebasestorage.app",
    messagingSenderId: "553244592475",
    appId: "1:553244592475:web:8d9818c7423da54c06327e",
    measurementId: "G-B3HJBJ36F8"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { database, auth, ref, get, child };