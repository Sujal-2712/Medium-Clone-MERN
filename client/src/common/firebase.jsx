// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect  } from "firebase/auth"; 

// Your web app's Firebase configuration
// const firebaseConfig = {
//     
//   };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Google Auth provider
const provider = new GoogleAuthProvider();
const auth = getAuth();


export const authWithGoogle = async () => {
    try {
        const result = await signInWithRedirect(auth, provider);
        const user = result.user; // Authenticated user info
        console.log('User signed in:', user);
        return user;
    } catch (error) {
        console.error("Error during Google sign-in:", error);
        return null;
    }
};