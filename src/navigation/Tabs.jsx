import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Journal from '../screens/Journal';
import Settings from '../screens/Settings';
import Community from '../screens/Community';
import Dashboard from '../screens/Dashboard';
import { useThemeColors } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Journal') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Community') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Journey') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: { 
          backgroundColor: colors.tabBar, 
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 15,
          paddingTop: 10,
          position: 'absolute',
          bottom: 25, // Moved up 25 pixels
          left: 20,
          right: 20,
          borderRadius: 25,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Journal" component={Journal} />
      <Tab.Screen name="Community" component={Community} />
      <Tab.Screen name="Journey" component={Dashboard} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}