import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/theme/AuthContext';
import Home from './src/screens/Home';
import Reflection from './src/screens/Reflection';
import Journal from './src/screens/Journal';
import Community from './src/screens/Community';
import Settings from './src/screens/Settings';
import Journey from './src/screens/Journey';
import Devotionals from './src/screens/Devotionals';
import DevotionalDetail from './src/screens/DevotionalDetail';
import Prayers from './src/screens/Prayers';
import PrayerDetail from './src/screens/PrayerDetail';
import Dashboard from './src/screens/Dashboard';
import Store from './src/screens/Store';
import Testimonies from './src/screens/Testimonies';
import PrayerRequest from './src/screens/PrayerRequest';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Bible from './src/screens/Bible';
import Hymnbook from './src/screens/Hymnbook';
import HymnDetail from './src/screens/HymnDetail';

import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { showInterstitialIfTimePassed, AdBanner, initializeAds } from './src/services/ads';
import client from './src/lib/appwrite';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Ads are now initialized in the Auth/Theme provider or directly in ads service

function MainTabs() {
    const colors = useThemeColors();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'DashboardTab') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'TestimoniesTab') iconName = focused ? 'megaphone' : 'megaphone-outline';
                    else if (route.name === 'PrayersTab') iconName = focused ? 'heart' : 'heart-outline';
                    else if (route.name === 'CommunityTab') iconName = focused ? 'people' : 'people-outline';
                    return (
                        <View style={focused ? {
                            backgroundColor: colors.primary + '20',
                            padding: 8,
                            borderRadius: 12,
                        } : null}>
                            <Ionicons name={iconName} size={size} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopWidth: 0,
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 8,
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    borderRadius: 25,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: -5 },
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen name="HomeTab" component={Home} />
            <Tab.Screen name="DashboardTab" component={Dashboard} />
            <Tab.Screen name="TestimoniesTab" component={Testimonies} />
            <Tab.Screen name="PrayersTab" component={Prayers} />
            <Tab.Screen name="CommunityTab" component={Community} />
        </Tab.Navigator>
    );
}

function MainApp() {
    const { user, isGuest, initializing } = useAuth();
    const colors = useThemeColors();

    if (initializing) return null; // Or a splash screen

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="auto" />
            <View style={{ flex: 1 }}>
                <NavigationContainer>
                    <Stack.Navigator 
                        screenOptions={{ headerShown: false }}
                    >
                        {(user || isGuest) ? (
                            <>
                                <Stack.Screen name="Main" component={MainTabs} />
                                <Stack.Screen name="Settings" component={Settings} />
                                <Stack.Screen name="Devotionals" component={Devotionals} />
                                <Stack.Screen name="DevotionalDetail" component={DevotionalDetail} />
                                <Stack.Screen name="Prayers" component={Prayers} />
                                <Stack.Screen name="PrayerDetail" component={PrayerDetail} />
                                <Stack.Screen name="Store" component={Store} />
                                <Stack.Screen name="PrayerRequest" component={PrayerRequest} />
                                <Stack.Screen name="Reflection" component={Reflection} />
                                <Stack.Screen name="Journal" component={Journal} />
                                <Stack.Screen name="Journey" component={Journey} />
                                <Stack.Screen name="Bible" component={Bible} />
                                <Stack.Screen name="Hymnbook" component={Hymnbook} />
                                <Stack.Screen name="HymnDetail" component={HymnDetail} />
                                {/* Auth screens accessible from within the app (e.g., guest prompts) */}
                                <Stack.Screen name="Login" component={Login} />
                                <Stack.Screen name="Register" component={Register} />
                            </>
                        ) : (
                            <>
                                <Stack.Screen name="Login" component={Login} />
                                <Stack.Screen name="Register" component={Register} />
                            </>
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
                <AdBanner />
            </View>
        </View>
    );
}

export default function App() {
    useEffect(() => {
        console.log('App started with Appwrite integration.');
        initializeAds().then(success => {
            console.log('AdMob Initialized:', success);
        });
    }, []);

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <MainApp />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
