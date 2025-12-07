import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAOw6YrEU68Z35SQ-OpnpH1Mkvnh2I91_g",
    authDomain: "crowngate-portal.firebaseapp.com",
    projectId: "crowngate-portal",
    storageBucket: "crowngate-portal.firebasestorage.app",
    messagingSenderId: "500487380058",
    appId: "1:500487380058:web:0d1c793df4aa61d348cc63"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
