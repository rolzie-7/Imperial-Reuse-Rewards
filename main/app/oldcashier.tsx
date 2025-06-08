
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Button,
  Text,
  Platform,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import UserProfiles from "@/components/UserProfiles";
import { supabase } from "../scripts/supabase";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  

  // Fetch all users entries from supabase
  const reloadAllUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadAllUsers();
  }, []);

  // --- State for typing/selecting user ID ---
  const [userSearch, setUserSearch] = useState<string>(""); // typed ID substring
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserPoints, setSelectedUserPoints] = useState<number | null>(null);

  // Recompute suggestions whenever `userSearch` or `items` changes
  useEffect(() => {
    if (userSearch.trim().length === 0) {
      setFilteredUsers([]);
      setSelectedUserId(null);
      setSelectedUserPoints(null);
      return;
    }

    // Show any users whose ID (as string) startsWith `userSearch`
    const matches = items.filter((u) =>
      u.id.toString().startsWith(userSearch.trim())
    );
    setFilteredUsers(matches);

    // If the typed string exactly equals one user’s ID, auto‐select it:
    const exactMatch = matches.find(
      (u) => u.id.toString() === userSearch.trim()
    );
    if (exactMatch) {
      setSelectedUserId(exactMatch.id);
      setSelectedUserPoints(exactMatch.points ?? 0);
    } else {
      setSelectedUserId(null);
      setSelectedUserPoints(null);
    }
  }, [userSearch, items]);

  // Input states for add/redeem amounts
  const [addAmount, setAddAmount] = useState<string>("");
  const [redeemAmount, setRedeemAmount] = useState<string>("");

  //  Add points
  const handleAddPoints = async () => {
    if (selectedUserId === null) {
      console.warn("No user selected; cannot add points.");
      return;
    }

    const amount = parseInt(addAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      console.warn("Add amount is not a positive number.");
      return;
    }

    // Fetch current points for this user
    const { data: fetchData, error: fetchError } = await supabase
      .from("users")
      .select("points")
      .eq("id", selectedUserId)
      .single();

    if (fetchError) {
      console.error("Error fetching user row:", fetchError);
      return;
    }
    if (!fetchData) {
      console.warn(`No row found for id=${selectedUserId}`);
      return;
    }

    const currentPoints = fetchData.points ?? 0;
    const newPoints = currentPoints + amount;

    // Update the same row’s points
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("id", selectedUserId)
      .single();

    console.log("Supabase addPoints response:", { error: updateError });
    if (updateError) {
      console.error("Error updating points:", updateError);
    } else {
      // Reload entire list so UI reflects the change
      await reloadAllUsers();
      setAddAmount("");
      setUserSearch(selectedUserId.toString());
    }
  };

  // Redeem points
  const handleRedeemPoints = async () => {
    if (selectedUserId === null) {
      console.warn("No user selected; cannot redeem points.");
      return;
    }

    const amount = parseInt(redeemAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      console.warn("Redeem amount is not a positive number.");
      return;
    }

    // Fetch current points
    const { data: fetchData, error: fetchError } = await supabase
      .from("users")
      .select("points")
      .eq("id", selectedUserId)
      .single();

    if (fetchError) {
      console.error("Error fetching user row:", fetchError);
      return;
    }
    if (!fetchData) {
      console.warn(`No row found for id=${selectedUserId}`);
      return;
    }

    const currentPoints = fetchData.points ?? 0;
    const newPoints = Math.max(0, currentPoints - amount);

    // Update that user points 
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("id", selectedUserId)
      .single();

    console.log("Supabase redeemPoints response:", { error: updateError });
    if (updateError) {
      console.error("Error updating (redeeming) points:", updateError);
    } else {
      // Reload entire list so UI reflects the change
      await reloadAllUsers();
      setRedeemAmount("");
      setUserSearch(selectedUserId.toString());
    }
  };

  // Render each suggestion row
  const renderSuggestion = ({ item }: { item: any }) => {
    const label = `${item.name || item.email || `User ${item.id}`} (ID: ${item.id}, ${item.points ?? 0} pts)`;

    return (
      <TouchableOpacity
        style={styles.suggestionRow}
        onPress={() => {
          setUserSearch(item.id.toString());
          setSelectedUserId(item.id);
          setSelectedUserPoints(item.points ?? 0);
          setFilteredUsers([]); // hide suggestions
        }}
      >
        <Text style={styles.suggestionText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={{ marginBottom: 16 }}>
        Cashier Interface
      </ThemedText>

      {/* ─── POINTS MANAGEMENT ──────────────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <View style={styles.pointsContainer}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Manage Points
          </ThemedText>

          {/* 1) Type‐in field for User ID */}
          <TextInput
            style={styles.userInput}
            placeholder="Type User ID to select…"
            keyboardType="number-pad"
            value={userSearch}
            onChangeText={setUserSearch}
          />

          {/* 2) Suggestions dropdown (if text and matches exist) */}
          {userSearch.trim().length > 0 && filteredUsers.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredUsers}
                keyExtractor={(u) => u.id.toString()}
                renderItem={renderSuggestion}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* 3) “No matching user” if typed but no matches */}
          {userSearch.trim().length > 0 && filteredUsers.length === 0 && (
            <Text style={styles.noMatchText}>No matching user</Text>
          )}

          {/* 4) Display the currently selected user ID + points */}
          {selectedUserId !== null && selectedUserPoints !== null && (
            <View style={styles.selectedInfoRow}>
              <Text style={styles.selectedLabel}>Selected User ID:</Text>
              <Text style={styles.selectedValue}>{selectedUserId}</Text>
              <Text style={styles.selectedPoints}>
                Points: {selectedUserPoints}
              </Text>
            </View>
          )}

          {/* Add Points Row */}
          <View style={styles.actionRow}>
            <TextInput
              style={styles.input}
              placeholder="Points to add"
              keyboardType="number-pad"
              value={addAmount}
              onChangeText={setAddAmount}
            />
            <Button title="Add" onPress={handleAddPoints} />
          </View>

          {/* Redeem Points Row */}
          <View style={styles.actionRow}>
            <TextInput
              style={styles.input}
              placeholder="Points to redeem"
              keyboardType="number-pad"
              value={redeemAmount}
              onChangeText={setRedeemAmount}
            />
            <Button title="Redeem" onPress={handleRedeemPoints} />
          </View>
        </View>
      )}
      <TouchableOpacity
        style={styles.scannerButton}
        onPress={() => router.push("/Scanner")}
      >
        <Text style={styles.scannerButtonText}>Go to Scanner</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  pointsContainer: {
    width: "100%",
    maxWidth: 400,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    color: "#333",
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
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 14,
  },
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
    marginBottom: 12,
  },
  selectedLabel: {
    fontWeight: "600",
    marginRight: 4,
  },
  selectedValue: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedPoints: {
    fontSize: 14,
    color: "#555",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  scannerButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
  },
  scannerButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

});