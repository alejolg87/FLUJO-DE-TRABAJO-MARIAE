import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
  profile: any | null;
  workspace: any | null;
  loading: boolean;
}

const AuthContext = createContext<UserContextType>({ user: null, profile: null, workspace: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setWorkspace(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userPath = `users/${user.uid}`;
    
    // Listen to Profile
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      } else {
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL,
          role: 'member',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userPath);
      setLoading(false);
    });

    // Listen to Workspace
    const workspaceQuery = query(collection(db, 'workspaces'), where('ownerId', '==', user.uid));
    const unsubscribeWorkspace = onSnapshot(workspaceQuery, async (workspaceSnapshot) => {
      if (!workspaceSnapshot.empty) {
        setWorkspace({ id: workspaceSnapshot.docs[0].id, ...workspaceSnapshot.docs[0].data() });
      } else {
        const workspaceData = {
          name: 'Mi Espacio',
          ownerId: user.uid,
          createdAt: serverTimestamp()
        };
        const workspaceRef = doc(collection(db, 'workspaces'));
        await setDoc(workspaceRef, workspaceData);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'workspaces'));

    return () => {
      unsubscribeProfile();
      unsubscribeWorkspace();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, workspace, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
