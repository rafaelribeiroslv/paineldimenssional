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

  async bootstrapSuperAdmin(credentials: { username: string, password: string }) {
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { setDoc, doc } = await import('firebase/firestore');
      
      const email = `${credentials.username.toLowerCase()}@dimensional.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, credentials.password);
      
      await setDoc(doc(db, USER_COLLECTION, userCredential.user.uid), {
        username: credentials.username,
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp(),
        expiryDate: null
      });
      
      return { user: { id: userCredential.user.uid, username: credentials.username, role: 'admin', status: 'active' } };
    } catch (err: any) {
      throw this.handleError(err);
    }
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
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut: signOutAuth } = await import('firebase/auth');
      
      // Get config from existing app or use hardcoded (better to get from a config file)
      // Since we don't have easy access to the config object here without re-reading it or importing it,
      // and we know it's in lib/firebase.ts, I'll temporarily use the known config or try to derive it.
      // Better way: import it.
      
      const email = `${userData.username.toLowerCase()}@dimensional.com`;
      const password = userData.password;

      // Initialize a secondary app to create user without signing out admin
      const secondaryAppName = `AdminHelper_${Date.now()}`;
      const secondaryApp = initializeApp(auth.app.options, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      let uid: string;
      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        uid = userCredential.user.uid;
        // Sign out from the temporary app
        await signOutAuth(secondaryAuth);
      } catch (authErr: any) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(secondaryApp);
        
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error("Este nome de usuário já está sendo usado no sistema de autenticação.");
        }
        throw authErr;
      }

      const { deleteApp } = await import('firebase/app');
      await deleteApp(secondaryApp);

      await setDoc(doc(db, USER_COLLECTION, uid), {
        username: userData.username,
        role: userData.role || 'user',
        status: 'active',
        createdAt: serverTimestamp(),
        expiryDate: userData.expiryDate ? Timestamp.fromDate(new Date(userData.expiryDate)) : null
      });

      return { success: true, message: "Usuário criado com sucesso e pronto para acesso." };
    } catch (err: any) {
      if (err.message.includes('permission-denied')) {
        throw new Error("Você não tem permissão para criar usuários. Verifique se é o Admin Supremo.");
      }
      throw this.handleError(err);
    }
  },

  async updateUser(id: string, userData: any) {
    try {
      const updateData = { ...userData };
      if (userData.expiryDate !== undefined) {
        updateData.expiryDate = userData.expiryDate ? Timestamp.fromDate(new Date(userData.expiryDate)) : null;
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
