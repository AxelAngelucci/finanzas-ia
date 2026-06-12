import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary active:opacity-90',
    text: 'text-white font-semibold',
  },
  secondary: {
    container: 'bg-primary-light border border-primary active:opacity-80',
    text: 'text-primary font-semibold',
  },
  danger: {
    container: 'bg-danger active:opacity-90',
    text: 'text-white font-semibold',
  },
  ghost: {
    container: 'bg-transparent active:bg-gray-100',
    text: 'text-primary font-semibold',
  },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'px-4 py-2 rounded-xl',
    text: 'text-sm',
  },
  md: {
    container: 'px-5 py-3 rounded-2xl',
    text: 'text-base',
  },
  lg: {
    container: 'px-6 py-4 rounded-2xl',
    text: 'text-lg',
  },
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  onPress,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];
  const isDisabled = disabled || loading;

  return (
    <AnimatedTouchable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={1}
      className={[
        'flex-row items-center justify-center',
        variantStyle.container,
        sizeStyle.container,
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#6366F1'}
        />
      ) : (
        <Text
          className={[variantStyle.text, sizeStyle.text].join(' ')}
          numberOfLines={1}
        >
          {children}
        </Text>
      )}
    </AnimatedTouchable>
  );
}
