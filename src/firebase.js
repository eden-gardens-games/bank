import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
	apiKey: "AIzaSyBxotqOEdkMoZfwgQtcWsVP2DcivfFinqM",
	authDomain: "mafia-7afa1.firebaseapp.com",
	projectId: "mafia-7afa1",
	storageBucket: "mafia-7afa1.firebasestorage.app",
	messagingSenderId: "350568178297",
	appId: "1:350568178297:web:8b0fa1721a336f5d232aa8",
	measurementId: "G-ZG0SK1MV9F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { createUserWithEmailAndPassword, signInWithEmailAndPassword };
