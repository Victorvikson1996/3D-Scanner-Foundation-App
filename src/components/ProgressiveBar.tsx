import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: any;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showPercentage = false,
  color = SCANNER_CONSTANTS.COLORS.PRIMARY,
  backgroundColor = SCANNER_CONSTANTS.COLORS.SURFACE,
  animated = true,
  style
}) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progressValue.value = withTiming(progress, {
        duration: SCANNER_CONSTANTS.UI.ANIMATION_DURATION
      });
    } else {
      progressValue.value = progress;
    }
  }, [progress, animated]);

  const progressStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progressValue.value,
      [0, 100],
      [0, 100],
      Extrapolate.CLAMP
    );

    return {
      width: `${width}%`
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progressValue.value,
      [0, 50, 100],
      [0, 0.6, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity
    };
  });

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor
          }
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: color
            },
            progressStyle
          ]}
        />
        <Animated.View
          style={[
            styles.glow,
            {
              height: height + 4,
              backgroundColor: color,
              shadowColor: color
            },
            progressStyle,
            glowStyle
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  track: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  fill: {
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0
  },
  glow: {
    borderRadius: 6,
    position: 'absolute',
    left: -2,
    top: -2,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5
  },
  percentage: {
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4
  }
});
