import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useCamera } from '@/hooks/useCamera';
import { useScanner } from '@/hooks/useScanner';
import { ScanningOverlay } from '@/components/ScanninOverlay';
import { CameraControls } from '@/components/CameraControls';
import { Button } from '@/components/Button';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';

export const ScannerScreen = () => {
  const cameraRef = useRef<CameraView>(null);
  const { permission, requestPermission, settings, toggleFlash, toggleCamera } =
    useCamera();
  const {
    isScanning,
    progress,
    frameCount,
    startScan,
    stopScan,
    captureFrame
  } = useScanner();
  const [showSettings, setShowSettings] = useState(false);

  // Handle camera permissions
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to scan 3D objects
        </Text>
        <Button
          title='Grant Permission'
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  const handleStartScan = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Web Platform',
        'Full 3D scanning features require native device capabilities. This demo shows the interface.',
        [{ text: 'Continue', onPress: startScan }]
      );
    } else {
      startScan();
    }
  };

  const handleStopScan = () => {
    stopScan();
    Alert.alert(
      'Scan Complete',
      `Captured ${frameCount} frames. Processing point cloud...`,
      [
        {
          text: 'View Results',
          onPress: () => {
            // Navigate to viewer tab - this would be handled by navigation
            console.log('Navigate to 3D viewer');
          }
        },
        { text: 'OK' }
      ]
    );
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <View style={styles.container}>
      <StatusBar style='light' />

      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={settings.facing}
        flash={settings.flashMode ? 'on' : 'off'}
        autofocus={settings.autoFocus ? 'on' : 'off'}
      >
        {/* Camera Controls */}
        <CameraControls
          isScanning={isScanning}
          flashMode={settings.flashMode}
          onToggleFlash={toggleFlash}
          onToggleCamera={toggleCamera}
          onStartScan={handleStartScan}
          onStopScan={handleStopScan}
          onSettings={handleSettings}
        />
      </CameraView>

      {/* Scanning Overlay */}
      <ScanningOverlay
        isVisible={isScanning}
        progress={progress}
        frameCount={frameCount}
        onCancel={stopScan}
      />

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsTitle}>Camera Settings</Text>
          <Text style={styles.settingItem}>Quality: {settings.quality}</Text>
          <Text style={styles.settingItem}>
            Auto Focus: {settings.autoFocus ? 'On' : 'Off'}
          </Text>
          <Button
            title='Close'
            onPress={() => setShowSettings(false)}
            variant='outline'
            size='small'
            style={styles.closeButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  camera: {
    flex: 1
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND,
    paddingHorizontal: 40
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center'
  },
  permissionText: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32
  },
  permissionButton: {
    minWidth: 200
  },
  settingsPanel: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: SCANNER_CONSTANTS.UI.BORDER_RADIUS,
    padding: 20,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 16
  },
  settingItem: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: 8
  },
  closeButton: {
    marginTop: 16
  }
});
