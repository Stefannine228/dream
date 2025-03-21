"use client";

import { useEffect, useState } from "react";
import { googleLogin, googleLogout, isTokenExpired } from "../../helpers/functions/auth";
import { auth, onAuthStateChanged } from "../../helpers/firebase";

export default function Auth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    <div>
      <h1>Next.js Firebase Auth</h1>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button onClick={googleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={googleLogin}>Login with Google</button>
      )}
    </div>
  );
}
