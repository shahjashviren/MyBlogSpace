import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase web config — public by design (it ships in every page load of
 * any Firebase website). No secrets live here; real security is enforced
 * by Firestore security rules + Firebase Auth.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDhODembosa4e35Cp1av6F0X4JkMX2sa8Y",
  authDomain: "jash-blogspace.firebaseapp.com",
  projectId: "jash-blogspace",
  storageBucket: "jash-blogspace.firebasestorage.app",
  messagingSenderId: "157478957566",
  appId: "1:157478957566:web:1de8bc279de18b796b50af",
  measurementId: "G-MEFCSSBLTK",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
