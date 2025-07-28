import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <AnimatedTouchableOpacity
      style={[buttonStyles, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? SCANNER_CONSTANTS.COLORS.BACKGROUND
              : SCANNER_CONSTANTS.COLORS.PRIMARY
          }
          size='small'
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SCANNER_CONSTANTS.UI.BORDER_RADIUS,
    paddingHorizontal: 16,
    gap: 8
  },

  // Variants
  primary: {
    backgroundColor: SCANNER_CONSTANTS.COLORS.PRIMARY
  },
  secondary: {
    backgroundColor: SCANNER_CONSTANTS.COLORS.SECONDARY
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SCANNER_CONSTANTS.COLORS.PRIMARY
  },
  ghost: {
    backgroundColor: 'transparent'
  },

  // Sizes
  small: {
    height: 36,
    paddingHorizontal: 12
  },
  medium: {
    height: SCANNER_CONSTANTS.UI.BUTTON_HEIGHT,
    paddingHorizontal: 16
  },
  large: {
    height: 56,
    paddingHorizontal: 24
  },

  // States
  disabled: {
    opacity: 0.5
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center'
  },
  primaryText: {
    color: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  secondaryText: {
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  outlineText: {
    color: SCANNER_CONSTANTS.COLORS.PRIMARY
  },
  ghostText: {
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  smallText: {
    fontSize: 14
  },
  mediumText: {
    fontSize: 16
  },
  largeText: {
    fontSize: 18
  },
  disabledText: {
    opacity: 0.7
  }
});
