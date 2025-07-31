import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useCamera } from '@/hooks/useCamera';
import { useScanner } from '@/hooks/useScanner';
import { ScanningOverlay } from '@/components/ScanninOverlay';
import { CameraControls } from '@/components/CameraControls';
import { Button } from '@/components/Button';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import { PointCloud } from '@/types/Scanner';
import { TabParamList } from '@/Navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export const ScannerScreen = () => {
  const cameraRef = useRef<CameraView>(null);
  const {
    permission,
    requestPermission,
    settings,
    toggleFlash,
    toggleCamera,
    takePhoto
  } = useCamera();
  const {
    isScanning,
    progress,
    frameCount,
    startScan,
    stopScan,
    captureFrame,
    saveScan,
    session
  } = useScanner();
  const [showSettings, setShowSettings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCaptureDisabled, setIsCaptureDisabled] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  // Cleanup effect to handle camera unmounting
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (isScanning) {
        stopScan();
      }
    };
  }, [isScanning, stopScan]);

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleTestCapture = async () => {
    console.log('=== TEST CAPTURE START ===');
    try {
      if (!cameraRef.current) {
        console.error('Camera ref is null in test');
        Alert.alert('Test Failed', 'Camera ref is null');
        return;
      }

      console.log('Camera ref exists, attempting capture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        exif: false,
        skipProcessing: false
      });

      console.log('Test capture successful:', photo);
      Alert.alert('Test Success', `Photo captured: ${photo.uri}`);
    } catch (error) {
      console.error('Test capture failed:', error);
      Alert.alert(
        'Test Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
    console.log('=== TEST CAPTURE END ===');
  };

  // Handle camera permissions
  if (!permission) {
    console.log('Permission is null, showing loading...');
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    console.log('Permission not granted, showing request...');
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

  console.log('Permission granted, camera should be working');

  const handleStartScan = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Web Platform',
        'Full 3D scanning features require native device capabilities. This demo shows the interface.',
        [{ text: 'Continue', onPress: () => startScan() }]
      );
    } else {
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Create a function that takes a photo using the camera ref
      const takePhotoFn = async () => {
        console.log(
          'takePhotoFn called, cameraRef:',
          cameraRef.current ? 'exists' : 'null'
        );
        if (!cameraRef.current) {
          throw new Error('Camera not available in takePhotoFn');
        }
        return await cameraRef.current
          .takePictureAsync({
            quality: 0.7,
            base64: false,
            exif: false,
            skipProcessing: false
          })
          .then((photo) => photo.uri);
      };

      // Create a callback for when frames are captured during scanning
      const onFrameCaptured = () => {
        console.log('Frame captured callback triggered');
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 400);
      };

      console.log('Starting scan with takePhotoFn and onFrameCaptured');
      startScan(takePhotoFn, onFrameCaptured);
    }
  };

  const handleStopScan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopScan();

    try {
      console.log('Creating point cloud from scan session...');
      console.log('Frame count:', frameCount);
      console.log('Session:', session);

      // Save the scan session and generate point cloud from captured frames
      console.log('Saving scan and generating point cloud...');
      const pointCloud = await saveScan(
        `Scan ${new Date().toLocaleDateString()}`,
        Platform.OS === 'ios' ? 'iPhone' : 'Android'
      );
      console.log('Scan saved successfully!');

      Alert.alert(
        'Scan Saved Successfully!',
        `✅ Captured ${frameCount} frames\n` +
          `📁 Saved to local storage\n` +
          `📊 Generated point cloud with ${pointCloud.metadata.pointCount.toLocaleString()} points\n` +
          `🔧 Processing method: ${pointCloud.metadata.processingMethod}\n\n` +
          `You can now view your 3D model in the Viewer tab.`,
        [
          {
            text: 'View Results',
            onPress: () => {
              navigation.navigate('Viewer');
            }
          },
          { text: 'Continue Scanning' }
        ]
      );
    } catch (error) {
      console.error('Failed to save scan:', error);
      Alert.alert(
        'Error',
        `Failed to save scan: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const handleCapturePhoto = async () => {
    // Prevent multiple rapid captures
    if (isCaptureDisabled) {
      console.log('Capture disabled, skipping...');
      return;
    }

    console.log('Starting photo capture...');

    try {
      // Disable capture temporarily
      setIsCaptureDisabled(true);

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setIsCapturing(true);

      // Check if camera is still mounted
      if (!cameraRef.current) {
        console.error('Camera ref is null');
        throw new Error('Camera not available');
      }

      console.log('Taking photo...');
      const photoUri = await takePhoto(cameraRef);
      console.log('Photo taken successfully:', photoUri);

      console.log('Capturing frame...');
      await captureFrame(photoUri);
      console.log('Frame captured successfully');

      // Reset capturing state after a short delay to show the flash effect
      setTimeout(() => setIsCapturing(false), 400);

      Alert.alert(
        'Photo Captured',
        `Photo saved successfully! Total frames: ${frameCount + 1}`
      );
    } catch (error) {
      console.error('Failed to capture photo:', error);
      setIsCapturing(false);

      if (error instanceof Error && error.message.includes('unmounted')) {
        Alert.alert(
          'Camera Error',
          'Camera was interrupted. Please try again.'
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to capture photo: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    } finally {
      // Re-enable capture after a delay
      setTimeout(() => setIsCaptureDisabled(false), 1000);
    }
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
          onCapturePhoto={handleCapturePhoto}
          isCaptureDisabled={isCaptureDisabled}
        />
      </CameraView>

      {/* Scanning Overlay */}
      <ScanningOverlay
        isVisible={isScanning}
        progress={progress}
        frameCount={frameCount}
        onCancel={stopScan}
        isCapturing={isCapturing}
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
            title='Test Camera'
            onPress={handleTestCapture}
            variant='outline'
            size='small'
            style={styles.testButton}
          />
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
  },
  testButton: {
    marginTop: 16
  }
});
