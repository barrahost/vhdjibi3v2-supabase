import { createContext, useContext, useState } from 'react';

interface UserProfileContextType {
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const UserProfileContext = createContext<UserProfileContextType>({
  isProfileModalOpen: false,
  openProfileModal: () => {},
  closeProfileModal: () => {}
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <UserProfileContext.Provider value={{
      isProfileModalOpen,
      openProfileModal,
      closeProfileModal
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);