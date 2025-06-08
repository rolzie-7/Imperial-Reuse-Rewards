import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UserProfileProps {
  id: string;
  points: number;
  IS_ADMIN: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ id, points, IS_ADMIN }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.idText}>User ID: {id}</Text>
      <Text style={styles.pointsText}>Points: {points}</Text>
      {IS_ADMIN && <Text style={styles.adminBadge}>ADMIN</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  idText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
  },
  adminBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E53E3E',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default UserProfile;