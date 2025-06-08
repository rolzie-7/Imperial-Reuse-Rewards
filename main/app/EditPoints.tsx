import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "../scripts/supabase";
import { useRouter } from "expo-router";

export default function EditPointsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserPoints, setSelectedUserPoints] = useState<number | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");

  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  // Fetch all users on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("users").select("id, name, points");
      console.log("⛔️ fetch users:", { data, error });
      if (error) console.error(error);
      else setItems(data || []);
    })();
  }, []);

  // Filter suggestions
  useEffect(() => {
    if (!userSearch.trim()) {
      setFilteredUsers([]);
      setSelectedUserId(null);
      return;
    }
    const matches = items.filter((u) => u.id.toString().startsWith(userSearch.trim()));
    setFilteredUsers(matches);
    const exact = matches.find((u) => u.id.toString() === userSearch.trim());
    if (exact) {
      setSelectedUserId(exact.id);
      setSelectedUserPoints(exact.points);
    } else {
      setSelectedUserId(null);
      setSelectedUserPoints(null);
    }
  }, [userSearch, items]);

  const handleAddPoints = async () => {
    if (!selectedUserId) return;
    const amt = parseInt(addAmount, 10);
    if (isNaN(amt) || amt <= 0) return;
    const newPts = (selectedUserPoints || 0) + amt;
    const { error } = await supabase
      .from("users")
      .update({ points: newPts })
      .eq("id", selectedUserId);
    if (error) console.error(error);
    else {
      setAddAmount("");
      setUserSearch(selectedUserId.toString());
      setSelectedUserPoints(newPts);
      // Update the items array to reflect the change
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedUserId ? { ...item, points: newPts } : item
        )
      );
    }
  };

  const handleRedeemPoints = async () => {
    if (!selectedUserId) return;
    const amt = parseInt(redeemAmount, 10);
    if (isNaN(amt) || amt <= 0) return;
    const newPts = Math.max(0, (selectedUserPoints || 0) - amt);
    const { error } = await supabase
      .from("users")
      .update({ points: newPts })
      .eq("id", selectedUserId);
    if (error) console.error(error);
    else {
      setRedeemAmount("");
      setUserSearch(selectedUserId.toString());
      setSelectedUserPoints(newPts);
      // Update the items array to reflect the change
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedUserId ? { ...item, points: newPts } : item
        )
      );
    }
  };

  const renderSuggestion = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionRow}
      onPress={() => setUserSearch(item.id.toString())}
    >
      <Text style={styles.suggestionText}>
        {item.name ?? `User ${item.id}`} – {item.points} pts
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back to Cashier</Text>
      </TouchableOpacity>

      <ThemedText type="title" style={{ marginBottom: 16 }}>
        Edit Points
      </ThemedText>

      <TextInput
        ref={inputRef}
        style={styles.userInput}
        placeholder="Type User ID…"
        keyboardType="number-pad"
        value={userSearch}
        onChangeText={setUserSearch}
      />

      {filteredUsers.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id.toString()}
            renderItem={renderSuggestion}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}

      {userSearch.trim().length > 0 && filteredUsers.length === 0 && (
        <Text style={styles.noMatchText}>No matching user</Text>
      )}

      {selectedUserId !== null && (
        <View style={styles.selectedInfoRow}>
          <Text style={styles.selectedLabel}>User:</Text>
          <Text style={styles.selectedValue}>{selectedUserId}</Text>
          <Text style={styles.selectedPoints}>Pts: {selectedUserPoints}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <TextInput
          style={styles.input}
          placeholder="Points to add"
          keyboardType="number-pad"
          value={addAmount}
          onChangeText={setAddAmount}
        />
        <TouchableOpacity style={styles.actionButton} onPress={handleAddPoints}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TextInput
          style={styles.input}
          placeholder="Points to redeem"
          keyboardType="number-pad"
          value={redeemAmount}
          onChangeText={setRedeemAmount}
        />
        <TouchableOpacity style={styles.actionButton} onPress={handleRedeemPoints}>
          <Text style={styles.buttonText}>Redeem</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  },
  userInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 4,
  },
  suggestionsContainer: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  suggestionRow: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee" 
  },
  suggestionText: { fontSize: 14 },
  noMatchText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
    marginBottom: 8,
    paddingLeft: 4,
  },
  selectedInfoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12 
  },
  selectedLabel: { fontWeight: "600", marginRight: 4 },
  selectedValue: { fontSize: 16, marginRight: 8 },
  selectedPoints: { fontSize: 14, color: "#555" },
  actionRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12 
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginRight: 8,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
});