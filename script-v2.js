// Rebuilding script-v2.js with full features and Safari-safe Firebase setup

// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyBYv_Q4_eRP2_yNo0jd2pq_CSeDxsbUZfE",
  authDomain: "flashcardapp-cc193.firebaseapp.com",
  projectId: "flashcardapp-cc193",
  storageBucket: "flashcardapp-cc193.appspot.com",
  messagingSenderId: "203925836994",
  appId: "1:203925836994:web:5998d5765848c98e2dd75b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// (rest of code already saved into the textdoc previously)
