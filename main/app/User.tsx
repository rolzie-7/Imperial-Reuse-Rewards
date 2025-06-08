// app/(tabs)/user.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "../scripts/supabase";

interface UserRow {
  id: string;
  points: number;
}

export default function UserPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [points, setPoints] = useState<number>(0);
  const [qrPayload, setQrPayload] = useState<string>("");

  // Ranking-related state:
  const [ranking, setRanking] = useState<UserRow[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [rankingLoading, setRankingLoading] = useState<boolean>(false);

  const FIXED_USER_ID = "02378558";

 
  // reloadUser(): fetches the single row from "users" table
  //    where id = FIXED_USER_ID, then updates points + QR payload
  // ----------------------------------------------------------------------
  const reloadUser = useCallback(async () => {
    try {
      // Only show spinner on initial load
      if (loading) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from<UserRow>("users")
        .select("points")
        .eq("id", FIXED_USER_ID)
        .single();

      if (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "Could not load user from database.");
      } else if (data) {
        setPoints(data.points);
        setQrPayload(`user:${FIXED_USER_ID}:points:${data.points}`);
      } else {
        // If no row exists for that ID:
        setPoints(0);
        setQrPayload("");
      }
    } catch (err: any) {
      console.error("Unexpected error fetching user:", err);
      Alert.alert("Error", "Unexpected error fetching user.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // fetchRanking(): fetches all rows ordered by points desc,
  //    then computes this user's rank and stores top 5
  // ----------------------------------------------------------------------
  const fetchRanking = async () => {
    setRankingLoading(true);
    try {
      // Get all users sorted by points descending
      const { data, error } = await supabase
        .from<UserRow>("users")
        .select("id, points")
        .order("points", { ascending: false });

      if (error) {
        console.error("Error fetching ranking:", error);
        Alert.alert("Error", "Could not load ranking from database.");
      } else if (data) {
        setRanking(data);
        // Find this user's rank (1-based index in sorted array)
        const index = data.findIndex((r) => r.id === FIXED_USER_ID);
        setUserRank(index >= 0 ? index + 1 : null);
      }
    } catch (err: any) {
      console.error("Unexpected error fetching ranking:", err);
      Alert.alert("Error", "Unexpected error fetching ranking.");
    } finally {
      setRankingLoading(false);
    }
  };

  // On mount: load initial data, then start polling every second
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Load the first snapshot
    reloadUser();

    // Poll every 1 000 ms (1s)
    const intervalId = setInterval(() => {
      reloadUser();
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [reloadUser]);

  // ----------------------------------------------------------------------
  // If still loading (initial fetch), show a spinner
  // ----------------------------------------------------------------------
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // ----------------------------------------------------------------------
  // Main rendering: fixed user, QR code, and ranking button/list
  // ----------------------------------------------------------------------
  return (
    <ThemedView style={styles.container}>
      {/* Title */}
      <ThemedText type="title" style={{ marginBottom: 24 }}>
        User (ID: {FIXED_USER_ID})
      </ThemedText>

      {/* Card Container */}
      <View style={styles.card}>
        {/* Display fixed user's ID and points */}
        <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
          User ID: {FIXED_USER_ID}
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={{ marginBottom: 16 }}>
          Points: {points}
        </ThemedText>

        {/* Show QR code (only if payload is non-empty) */}
        {qrPayload ? (
          <View style={styles.qrContainer}>
            <QRCode
              value={qrPayload}
              size={200}
              backgroundColor="white"
              color="black"
            />
          </View>
        ) : (
          <ThemedText>No QR payload available</ThemedText>
        )}

        {/* Button to fetch ranking */}
        <View style={{ marginTop: 24, width: "100%" }}>
          <Button
            title="Get Ranking"
            onPress={fetchRanking}
            disabled={rankingLoading}
          />
        </View>

        {/* Ranking display */}
        {rankingLoading ? (
          <ActivityIndicator style={{ marginTop: 16 }} />
        ) : ranking.length > 0 ? (
          <View style={styles.rankingContainer}>
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
              Top 5 Users by Points:
            </ThemedText>
            <ScrollView style={styles.scrollArea}>
              {ranking.slice(0, 5).map((r, idx) => (
                <ThemedText key={r.id} style={{ marginBottom: 4 }}>
                  {idx + 1}. {r.id} — {r.points}
                </ThemedText>
              ))}
            </ScrollView>
            {userRank ? (
              <ThemedText type="defaultSemiBold" style={{ marginTop: 12 }}>
                Your Rank: {userRank} / {ranking.length}
              </ThemedText>
            ) : (
              <ThemedText type="defaultSemiBold" style={{ marginTop: 12 }}>
                You are not ranked.
              </ThemedText>
            )}
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // ThemedView handles light/dark background; just center + pad
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: "rgba(0, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4, // Android shadow
  },
  qrContainer: {
    marginTop: 16,
  },
  rankingContainer: {
    marginTop: 16,
    alignItems: "flex-start",
    width: "100%",
  },
  scrollArea: {
    maxHeight: 120,
    width: "100%",
  },
});