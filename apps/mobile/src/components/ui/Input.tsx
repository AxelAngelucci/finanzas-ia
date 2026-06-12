import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  secureToggle?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  hint,
  secureToggle = false,
  secureTextEntry,
  leftIcon,
  rightElement,
  editable = true,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = secureTextEntry && !showPassword;
  const hasError = !!error;

  return (
    <View className="w-full mb-4">
      {label ? (
        <Text className="text-text font-medium text-sm mb-1.5">{label}</Text>
      ) : null}

      <View
        className={[
          'flex-row items-center bg-surface rounded-2xl border px-4 py-3',
          hasError ? 'border-danger' : 'border-gray-200',
          !editable ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={hasError ? '#DC2626' : '#9CA3AF'}
            style={{ marginRight: 8 }}
          />
        ) : null}

        <TextInput
          className="flex-1 text-text text-base"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isSecure}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />

        {secureToggle && secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ) : null}

        {rightElement ?? null}
      </View>

      {error ? (
        <Text className="text-danger text-xs mt-1 ml-1">{error}</Text>
      ) : hint ? (
        <Text className="text-text-3 text-xs mt-1 ml-1">{hint}</Text>
      ) : null}
    </View>
  );
}
