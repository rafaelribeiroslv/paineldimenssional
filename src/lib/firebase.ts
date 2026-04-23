import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Essas variáveis devem ser configuradas nas configurações do AI Studio (Secrets)
// Elas começam com VITE_ para serem expostas ao frontend.
const firebaseConfig = {
  apiKey: "AIzaSyDgXEl1AjtMnCrWKUFZ2Aeh9AeUwuwXUhs",
  authDomain: "appvip-77f6d.firebaseapp.com",
  databaseURL: "https://appvip-77f6d-default-rtdb.firebaseio.com",
  projectId: "appvip-77f6d",
  storageBucket: "appvip-77f6d.firebasestorage.app",
  messagingSenderId: "897414209112",
  appId: "1:897414209112:web:0731b564e9e0b5a48bf42d",
  measurementId: "G-ZSQE61R8PC"
};

// Log de depuração amigável caso as chaves não existam
if (!firebaseConfig.apiKey) {
  console.warn("Configuração do Firebase ausente. O app funcionará em modo demonstração limitada ou falhará até que as chaves sejam adicionadas em 'Settings > Environment Variables'.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
