// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuSCpSqUkHhb7zQkXelh3B4YiOVKHm9so",
  authDomain: "yourtube-clone-57b76.firebaseapp.com",
  projectId: "yourtube-clone-57b76",
  storageBucket: "yourtube-clone-57b76.firebasestorage.app",
  messagingSenderId: "1077180138534",
  appId: "1:1077180138534:web:861c2ccb3f86b2555e12e7",
  measurementId: "G-Q6T83KVK44",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
