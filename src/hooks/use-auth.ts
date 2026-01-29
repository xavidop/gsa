import { useContext } from 'react';
import { FirebaseContext } from '@/components/providers/firebase-provider';

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
