// screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
  TextInput,
  Button,
  Text
} from 'react-native';
import { supabase } from '../../scripts/supabase';
import { ThemedText } from '@/components/ThemedText';


export default function HomeScreen() {
  return <Redirect href="/WelcomeScreen" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 24,
  },

  // ── Lookup Section ─────────────────────────────────────────────────
  lookupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    backgroundColor:'#fff'
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 4,
  },
  resultText: {
    fontSize: 16,
  },
  boldText: {
    fontWeight: '700',
  },
});
