import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut, signInAnonymously } from 'firebase/auth';

interface UserContextType {
  user: { displayName: string | null; uid: string | null } | null;
  profile: any | null;
  workspace: any | null;
  loading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<UserContextType>({ 
  user: null, 
  profile: null, 
  workspace: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  updateProfile: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ displayName: string | null; uid: string | null } | null>(null);
  const [availability, setAvailability] = useState<'available' | 'unavailable'>('available');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('user_name');
    const savedId = localStorage.getItem('user_id');
    const savedAvailability = localStorage.getItem('user_availability') as 'available' | 'unavailable';
    
    if (savedName && savedId) {
      setUser({ displayName: savedName, uid: savedId });
    }
    if (savedAvailability) {
      setAvailability(savedAvailability);
    }
    setLoading(false);
  }, []);

  const login = async (name: string) => {
    // If there's an existing Firebase session, sign out first
    if (auth.currentUser) {
      await signOut(auth);
    }

    try {
      // Use anonymous auth in background to have a real Firebase session
      await signInAnonymously(auth);
      const userId = auth.currentUser?.uid || `user-${Math.random().toString(36).substr(2, 9)}`;
      
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_id', userId);
      setUser({ displayName: name, uid: userId });
    } catch (error) {
      console.error('Error during anonymous login:', error);
      // Fallback to purely local if anonymous auth fails/is disabled
      const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_id', userId);
      setUser({ displayName: name, uid: userId });
    }
  };

  const logout = () => {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_availability');
    signOut(auth);
    setUser(null);
  };

  const updateProfile = async (data: any) => {
    if (data.availability) {
      setAvailability(data.availability);
      localStorage.setItem('user_availability', data.availability);
      
      // Also try to update Firestore if we have a real user profile collection
      if (user?.uid && !user.uid.startsWith('user-')) {
        try {
          const { updateUserProfile } = await import('../lib/db');
          await updateUserProfile(user.uid, { availability: data.availability });
        } catch (e) {
          console.warn('Could not update Firestore profile:', e);
        }
      }
    }
  };

  const workspace = {
    id: 'public-workspace',
    name: 'Espacio Team MariaE'
  };

  const profile = user ? {
    uid: user.uid,
    displayName: user.displayName,
    role: 'Admin',
    availability: availability,
    photoURL: `https://ui-avatars.com/api/?name=${user.displayName}&background=f2ceb8&color=250505`
  } : null;

  return (
    <AuthContext.Provider value={{ user, profile, workspace, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
