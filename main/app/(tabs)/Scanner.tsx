import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  const mode = (params.mode as string) || 'scan_only';
  const amount = params.amount as string;

  function handleBarCodeScanned({ type, data }: { type: string; data: string }) {
    if (scanned) return;
    setScanned(true);

    // Parse QR code data
    const parts = data.split(':');
    let userId = 'Unknown';
    let points = 'Unknown';

    if (parts.length === 4 && parts[0] === 'user' && parts[2] === 'points') {
      userId = parts[1];
      points = parts[3];
    } else {
      Alert.alert(
        'Invalid QR Code',
        'QR code format is not recognized',
        [{ text: 'OK', onPress: () => router.push('../Cashier') }]
      );
      return;
    }

    if (mode === 'scan_only') {
      Alert.alert(
        'QR Scan Result',
        `User ID: ${userId}\nPoints: ${points}`,
        [{ text: 'OK', onPress: () => router.push('../Cashier') }]
      );
    } else if (mode === 'add_point') {
      router.push({
        pathname: '../Cashier',
        params: { scannedUserId: userId, scannerAction: 'add_point' },
      });
    }
  }

  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const getModeText = () => {
    switch (mode) {
      case 'add_point':
        return 'Scan to Add 1 Point';
      case 'redeem_points':
        return `Scan to Redeem ${amount || '0'} Points`;
      default:
        return 'Scan QR Code';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{getModeText()}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('../Cashier')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Camera and Overlay Container */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        {/* Overlay Controls */}
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan Again Button */}
      {scanned && (
        <View style={styles.bottomContainer}>
          <Button
            title="Scan Again"
            onPress={() => {
              setScanned(false);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 6,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
});
