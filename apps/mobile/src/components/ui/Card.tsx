import React from 'react';
import { View, type ViewProps } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'xl' | '2xl' | '3xl';
  elevated?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Card({
  children,
  padding = 'md',
  rounded = '2xl',
  elevated = true,
  className,
  style,
  ...props
}: CardProps) {
  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[padding];

  const roundedClass = {
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  }[rounded];

  return (
    <View
      className={[
        'bg-surface',
        paddingClass,
        roundedClass,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={[
        elevated
          ? {
              shadowColor: '#1E1B4B',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 8,
              elevation: 3,
            }
          : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
