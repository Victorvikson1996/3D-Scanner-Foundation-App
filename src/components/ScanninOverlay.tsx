import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import { ProgressBar } from './ProgressiveBar';

interface ScanningOverlayProps {
  isVisible: boolean;
  progress: number;
  frameCount: number;
  onCancel?: () => void;
}

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({
  isVisible,
  progress,
  frameCount,
  onCancel
}) => {
  const scanLinePosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (isVisible) {
      scanLinePosition.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      );

      pulseScale.value = withRepeat(
        withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      );
    } else {
      scanLinePosition.value = 0;
      pulseScale.value = 1;
    }
  }, [isVisible]);

  const scanLineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scanLinePosition.value, [0, 1], [-200, 200]);

    return {
      transform: [{ translateY }]
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      {/* Scanning frame */}
      <View style={styles.scanFrame}>
        <Animated.View style={[styles.corner, styles.topLeft, pulseStyle]} />
        <Animated.View style={[styles.corner, styles.topRight, pulseStyle]} />
        <Animated.View style={[styles.corner, styles.bottomLeft, pulseStyle]} />
        <Animated.View
          style={[styles.corner, styles.bottomRight, pulseStyle]}
        />

        {/* Scanning line */}
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
      </View>

      {/* Progress info */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Scanning in Progress</Text>
        <Text style={styles.progressSubtitle}>
          Captured {frameCount} frames
        </Text>

        <ProgressBar
          progress={progress}
          height={6}
          showPercentage={true}
          style={styles.progressBar}
        />

        <Text style={styles.instructionText}>
          Move your device slowly around the object
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCANNER_CONSTANTS.COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    marginBottom: 60
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: SCANNER_CONSTANTS.COLORS.PRIMARY,
    borderWidth: 3
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: SCANNER_CONSTANTS.COLORS.PRIMARY,
    shadowColor: SCANNER_CONSTANTS.COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%'
  },
  progressTitle: {
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8
  },
  progressSubtitle: {
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: 16,
    marginBottom: 20
  },
  progressBar: {
    marginBottom: 20
  },
  instructionText: {
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  }
});
