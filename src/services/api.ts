import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const USER_COLLECTION = 'users';
const POST_COLLECTION = 'posts';
const CATEGORY_COLLECTION = 'categories';

export const api = {
  // Helper to handle Firestore errors consistently
  handleError(error: any) {
    console.error("Firestore Error:", error);
    throw new Error(error.message || 'Falha na comunicação dimensional');
  },

  async login(credentials: { username: string, password: string }) {
    try {
      // We simulate username login by appending a dummy domain for Firebase Auth
      // or we can just fetch the user from Firestore to verify their existence first
      const email = `${credentials.username.toLowerCase()}@dimensional.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
      
      // Fetch profile data
      const userDoc = await getDoc(doc(db, USER_COLLECTION, userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error("Perfil não encontrado no sistema.");
      }
      
      const userData = userDoc.data();
      
      // Check VIP expiry
      if (userData.role !== 'admin' && userData.expiryDate) {
        const expiry = (userData.expiryDate as Timestamp).toDate();
        if (expiry < new Date()) {
          await signOut(auth);
          throw new Error("Seu Vip Acabou Renove!");
        }
      }
      
      if (userData.status === 'pending') {
        await signOut(auth);
        throw new Error("Sua conta aguarda aprovação do Admin Supremo.");
      }
      
      if (userData.status === 'rejected') {
        const rejectedBy = userData.rejectedBy || 'Administrador';
        await signOut(auth);
        throw new Error(`Conta rejeitada por: ${rejectedBy}`);
      }

      return { user: { id: userCredential.user.uid, ...userData } };
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error("Usuário ou senha incorretos");
      }
      throw this.handleError(err);
    }
  },

  async getMe() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, USER_COLLECTION, user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              resolve({ 
                id: user.uid, 
                ...data,
                expiryDate: (data.expiryDate as Timestamp)?.toDate().toISOString() || null
              });
            } else {
              reject(new Error("Usuário não encontrado"));
            }
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error("Não autenticado"));
        }
      });
    });
  },

  async getPosts() {
    try {
      const q = query(collection(db, POST_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString()
      }));
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async createPost(post: any) {
    try {
      const docRef = await addDoc(collection(db, POST_COLLECTION), {
        ...post,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...post };
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async deletePost(id: string) {
    try {
      await deleteDoc(doc(db, POST_COLLECTION, id));
      return { success: true };
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async updatePost(id: string, post: any) {
    try {
      await updateDoc(doc(db, POST_COLLECTION, id), post);
      return { id, ...post };
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async getUsers() {
    try {
      const snapshot = await getDocs(collection(db, USER_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: (doc.data().expiryDate as Timestamp)?.toDate().toISOString() || null
      }));
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async createUser(userData: any) {
    // Note: Creating a user in Firebase Auth requires Admin SDK or client-side createUserWithEmailAndPassword
    // For simplicity in this demo, we'll assume the Admin will use a dedicated function 
    // but in a real app, users usually register themselves or use Firebase Admin.
    // Here we'll just save to Firestore and suggest the admin to handle Auth.
    try {
      // In a real scenario, you'd use a Cloud Function to create the Auth user.
      throw new Error("A criação de usuários agora deve ser feita via Registro (Firebase Auth) ou Cloud Functions para segurança.");
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async updateUser(id: string, userData: any) {
    try {
      const updateData = { ...userData };
      if (userData.expiryDate) {
        updateData.expiryDate = Timestamp.fromDate(new Date(userData.expiryDate));
      }
      await updateDoc(doc(db, USER_COLLECTION, id), updateData);
      return { success: true };
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async deleteUser(id: string) {
    try {
      await deleteDoc(doc(db, USER_COLLECTION, id));
      return { success: true };
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async getCategories() {
    try {
      const snapshot = await getDocs(collection(db, CATEGORY_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async createCategory(category: any) {
    try {
      const docRef = await addDoc(collection(db, CATEGORY_COLLECTION), category);
      return { id: docRef.id, ...category };
    } catch (err) {
      throw this.handleError(err);
    }
  },

  async deleteCategory(id: string) {
    try {
      await deleteDoc(doc(db, CATEGORY_COLLECTION, id));
      return { success: true };
    } catch (err) {
      throw this.handleError(err);
    }
  }
};
