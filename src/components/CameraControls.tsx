import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import {
  RotateCcw,
  Zap,
  ZapOff,
  Circle,
  Square,
  Settings,
  Camera
} from 'lucide-react-native';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface CameraControlsProps {
  isScanning: boolean;
  flashMode: boolean;
  onToggleFlash: () => void;
  onToggleCamera: () => void;
  onStartScan: () => void;
  onStopScan: () => void;
  onSettings: () => void;
  onCapturePhoto?: () => void;
  isCaptureDisabled?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  isScanning,
  flashMode,
  onToggleFlash,
  onToggleCamera,
  onStartScan,
  onStopScan,
  onSettings,
  onCapturePhoto,
  isCaptureDisabled = false
}) => {
  const scanButtonScale = useSharedValue(1);
  const scanButtonRotation = useSharedValue(0);

  React.useEffect(() => {
    if (isScanning) {
      scanButtonScale.value = withSpring(1.1);
      scanButtonRotation.value = withTiming(360, { duration: 2000 });
    } else {
      scanButtonScale.value = withSpring(1);
      scanButtonRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isScanning]);

  const scanButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scanButtonScale.value },
      { rotate: `${scanButtonRotation.value}deg` }
    ]
  }));

  const ControlButton: React.FC<{
    onPress: () => void;
    children: React.ReactNode;
    active?: boolean;
  }> = ({ onPress, children, active = false }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }]
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.9);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    return (
      <AnimatedTouchableOpacity
        style={[
          styles.controlButton,
          active && styles.controlButtonActive,
          animatedStyle
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top controls */}
      <View style={styles.topControls}>
        <ControlButton onPress={onToggleFlash} active={flashMode}>
          {flashMode ? (
            <Zap size={24} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />
          ) : (
            <ZapOff size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
          )}
        </ControlButton>

        <ControlButton onPress={onSettings}>
          <Settings size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </ControlButton>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <ControlButton onPress={onToggleCamera}>
          <RotateCcw size={28} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </ControlButton>

        {/* Main scan button */}
        <AnimatedTouchableOpacity
          style={[styles.scanButton, scanButtonStyle]}
          onPress={isScanning ? onStopScan : onStartScan}
        >
          <View style={styles.scanButtonInner}>
            {isScanning ? (
              <Square
                size={32}
                color={SCANNER_CONSTANTS.COLORS.BACKGROUND}
                fill={SCANNER_CONSTANTS.COLORS.BACKGROUND}
              />
            ) : (
              <Circle
                size={32}
                color={SCANNER_CONSTANTS.COLORS.BACKGROUND}
                fill={SCANNER_CONSTANTS.COLORS.BACKGROUND}
              />
            )}
          </View>
        </AnimatedTouchableOpacity>

        {/* Single photo capture button */}
        {onCapturePhoto && (
          <ControlButton
            onPress={isCaptureDisabled ? () => {} : onCapturePhoto}
            active={false}
          >
            <Camera
              size={28}
              color={
                isCaptureDisabled
                  ? SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY
                  : SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
              }
            />
          </ControlButton>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    pointerEvents: 'box-none'
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: SCANNER_CONSTANTS.COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  controlButtonActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: SCANNER_CONSTANTS.COLORS.PRIMARY
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SCANNER_CONSTANTS.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: SCANNER_CONSTANTS.COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },
  scanButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholder: {
    width: 50,
    height: 50
  }
});
