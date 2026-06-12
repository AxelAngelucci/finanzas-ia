import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatScreen } from '@/components/chat/ChatScreen';
import { useTheme } from '@/hooks/useTheme';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'index',         title: 'Inicio',       icon: 'home-outline',      activeIcon: 'home' },
  { name: 'movimientos',   title: 'Movimientos',   icon: 'list-outline',      activeIcon: 'list' },
  { name: 'reportes',      title: 'Reportes',      icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { name: 'configuracion', title: 'Config',        icon: 'settings-outline',  activeIcon: 'settings' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: 'transparent' }]}>
      <View style={[styles.pill, { backgroundColor: colors.surface2, shadowColor: colors.shadow }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={[
                styles.tab,
                focused && [styles.tabActive, { backgroundColor: colors.surface, shadowColor: colors.primary }],
              ]}
            >
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={20}
                color={focused ? colors.primary : colors.text3}
              />
              <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.text3 }]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Global Chat FAB ─────────────────────────────────────────────────────────

function GlobalChatFAB() {
  const [showChat, setShowChat] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowChat(true)}
        style={[
          styles.chatFab,
          {
            bottom: insets.bottom + 88,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>

      <ChatScreen visible={showChat} onClose={() => setShowChat(false)} />
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
      </Tabs>

      <GlobalChatFAB />
    </>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pill: {
    borderRadius: 28,
    flexDirection: 'row',
    padding: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 3,
  },
  tabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chatFab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 100,
  },
});
