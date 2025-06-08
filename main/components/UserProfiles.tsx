// UserProfiles.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import UserProfile from './UserProfile';

export interface UserRecord {
  id: string;
  points: number;
  IS_ADMIN: boolean;
}

interface UserProfilesProps {
  users: UserRecord[];
}

const UserProfiles: React.FC<UserProfilesProps> = ({ users }) => {
  const renderItem = ({ item }: { item: UserRecord }) => (
    <UserProfile
      id={item.id}
      points={item.points}
      IS_ADMIN={item.IS_ADMIN}
    />
  );

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  content: {
    padding: 16,
  },
});

export default UserProfiles;