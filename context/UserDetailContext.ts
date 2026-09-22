import { createContext, useContext } from 'react';
import { UserDetail } from '@/types/types';

interface UserDetailContextType {
  userDetails: UserDetail | null;
  setUserDetails: React.Dispatch<React.SetStateAction<UserDetail | null>>;
}

export const UserDetailContext = createContext<UserDetailContextType | null>(null);

export const useUserDetailContext = () => {
  const context = useContext(UserDetailContext);
  if (!context) {
    throw new Error('useUserDetailContext must be used within UserDetailContext.Provider');
  }
  return context;
};