import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { formatARS } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyBudgetWidgetProps {
  dailyBudget: number; // in centavos
  daysRemaining: number;
  timePercentage: number; // 0-100
  budgetPercentage: number; // 0-100
  onPress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyBudgetWidget({
  dailyBudget,
  daysRemaining,
  timePercentage,
  budgetPercentage,
  onPress,
}: DailyBudgetWidgetProps) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 400 });
    progressWidth.value = withTiming(budgetPercentage, { duration: 800 });
  }, []);

  useEffect(() => {
    progressWidth.value = withTiming(budgetPercentage, { duration: 600 });
  }, [budgetPercentage]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progressWidth.value, 100)}%`,
  }));

  // Traffic light color logic
  const isSafe = budgetPercentage <= timePercentage;
  const isWarning = budgetPercentage > timePercentage && budgetPercentage < timePercentage + 15;
  const isDanger = budgetPercentage >= timePercentage + 15;

  const gradientStart = isDanger ? '#DC2626' : isWarning ? '#D97706' : '#6366F1';
  const gradientText = isDanger ? 'Cuidado con los gastos' : isWarning ? 'Casi al límite' : 'Vas bien';
  const statusColor = isDanger ? '#DC2626' : isWarning ? '#D97706' : '#059669';

  return (
    <Animated.View style={containerStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: gradientStart,
          shadowColor: gradientStart,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View className="p-5">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-x-2">
              <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center">
                <Ionicons name="wallet-outline" size={18} color="white" />
              </View>
              <Text className="text-white/80 font-medium text-sm">
                ¿Cuánto podés gastar hoy?
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </View>

          {/* Amount */}
          <Text
            className="text-white font-bold mb-1"
            style={{ fontSize: 36, lineHeight: 42 }}
          >
            {formatARS(dailyBudget)}
          </Text>

          <Text className="text-white/70 text-xs mb-4">
            por día · {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes
          </Text>

          {/* Progress */}
          <View className="gap-y-1.5">
            {/* Budget vs Time bars */}
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/70 text-xs">Progreso del presupuesto</Text>
              <Text className="text-white font-semibold text-xs">
                {Math.round(budgetPercentage)}% gastado
              </Text>
            </View>

            {/* Budget bar */}
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <Animated.View
                style={[progressBarStyle, { height: '100%', borderRadius: 999 }]}
                className="bg-white"
              />
            </View>

            {/* Time indicator */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-x-1">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <Text className="text-white/80 text-xs">{gradientText}</Text>
              </View>
              <Text className="text-white/60 text-xs">
                Tiempo: {Math.round(timePercentage)}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
