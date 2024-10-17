import 'firebase/auth';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import serviceAccount from '../../serviceAccountKey.js';


// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

// Initialize Firebase for your web app
const firebaseConfig = {
  apiKey: "AIzaSyDcME8nIulxFaWb4HcJ2TTiI8zdVCa0gcI",
  authDomain: "stake-d4343.firebaseapp.com",
  projectId: "stake-d4343",
  storageBucket: "stake-d4343.appspot.com",
  messagingSenderId: "460669965884",
  appId: "1:460669965884:web:f34f5a58f31ded2bd61539"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = admin.auth();
export default firebaseApp;
