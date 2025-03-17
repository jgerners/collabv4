// components/ProfileLink.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface ProfileLinkProps {
  userId: string;
  children: React.ReactNode;
}

const ProfileLink: React.FC<ProfileLinkProps> = ({ userId, children }) => {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { userId })}>
      {children}
    </TouchableOpacity>
  );
};

export default ProfileLink;
