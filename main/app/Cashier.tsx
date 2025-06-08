import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { supabase } from "../scripts/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();
  const params = useLocalSearchParams();

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

  // run once on mount
  useEffect(() => {
    reloadAllUsers();
  }, []);
  
  useEffect(() => {
    if (params.scannedUserId && params.scannerAction) {
      // clear the params instantly so this effect won't retrigger
      router.replace({ pathname: "/Cashier", params: {} });

      handleScannerResult();
    }
  }, [params]);

  const handleScannerResult = async () => {
    const userId = params.scannedUserId as string;
    const action = params.scannerAction as string;

    if (!userId || !/^\d+$/.test(userId)) {
      Alert.alert("Error", "Invalid user ID from scanner");
      return;
    }

    try {
      // Fetch current user data
      const { data: fetchData, error: fetchError } = await supabase
        .from("users")
        .select("points")
        .eq("id", userId)
        .single();

      if (fetchError || !fetchData) {
        Alert.alert("Error", "User not found in database");
        return;
      }

      const currentPoints = fetchData.points ?? 0;

      if (action === "add_point") {
        // Add 1 point
        const newPoints = currentPoints + 1;
        const { error: updateError } = await supabase
          .from("users")
          .update({ points: newPoints })
          .eq("id", userId)
          .single();

        if (updateError) {
          Alert.alert("Error", "Failed to add point");
        } else {
          Alert.alert("Success", `Added 1 point to User ID: ${userId}`);
          await reloadAllUsers();
          router.replace({ pathname: "/Cashier", params: {} });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process scanner result");
    }
  };

  // Main header + scanner
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Navigate to EditPoints button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => router.push("../EditPoints")}
      >
        <Text style={styles.toggleButtonText}>
          Edit Points
        </Text>
      </TouchableOpacity>

      <ThemedText type="title" style={{ marginBottom: 16 }}>
        Cashier Interface
      </ThemedText>

      <View style={styles.scannerSection}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Scanner Functions
        </ThemedText>

        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() =>
            router.push({ pathname: "/Scanner", params: { mode: "scan_only" } })
          }
        >
          <Text style={styles.scannerButtonText}>Scan Only</Text>
          <Text style={styles.scannerButtonSubtext}>View User ID and Points</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() =>
            router.push({ pathname: "/Scanner", params: { mode: "add_point" } })
          }
        >
          <Text style={styles.scannerButtonText}>Add Point</Text>
          <Text style={styles.scannerButtonSubtext}>Scan to add 1 point</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main content */}
      <FlatList
        data={[]}
        keyExtractor={(_, i) => i.toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.mainContent} 
        renderItem={undefined}      
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flexGrow: 1,
    padding: 16,
  },
  headerContainer: {
    paddingBottom: 24,
  },
  toggleButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    color: "#333",
  },
  scannerSection: {
    marginTop: 24,
  },
  scannerButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scannerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scannerButtonSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
});