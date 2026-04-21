import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import VerseCard from '../components/VerseCard';
import { getRecentVerse, getDevotionals } from '../services/wordpress';
import { markCheckIn, getCurrentUser } from '../services/appwrite';
import { AdBanner, showInterstitialIfTimePassed, checkPremiumStatus } from '../services/ads';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [verse, setVerse] = useState({ text: '', reference: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const fetchHomeData = async () => {
    try {
        const [devotions, premium] = await Promise.all([
            getDevotionals(1),
            checkPremiumStatus()
        ]);
        if (devotions && devotions.length > 0) {
            setVerse(devotions[0]);
        }
        setIsPremium(premium);
    } catch (e) {
        console.error('Home data fetch error:', e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  }, []);

  const { width } = useWindowDimensions();
  const cardWidth = (width - 64) / (width > 600 ? 3 : 2);

  const NavCard = ({ title, icon, color, onPress, index }) => (
    <Animated.View entering={FadeInDown.delay(300 + index * 100).springify().damping(12)} style={{ width: cardWidth }}>
      <TouchableOpacity 
        style={[styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[color + '15', 'transparent']}
          style={styles.cardGradient}
        />
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
        >
          {/* Enhanced Header */}
          <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>MBS Morning</Text>
              <Text style={[styles.subGreeting, { color: colors.textMuted }]}>Fueling your spiritual journey</Text>
            </View>
            <TouchableOpacity 
                style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-sharp" size={22} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Devotional Card */}
          <Animated.View entering={FadeIn.delay(200)}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('DevotionalDetail', { item: verse })}>
              <VerseCard 
                text={verse?.title?.rendered || 'Seeking the Word...'} 
                reference="Daily Devotion"
                loading={loading}
              />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ministry Features</Text>
          </View>

          {/* Main Navigation Grid */}
          <View style={styles.grid}>
            <NavCard 
              title="Devotionals" 
              icon="book" 
              color="#D4AF37" 
              index={0}
              onPress={async () => {
                await showInterstitialIfTimePassed();
                navigation.navigate('Devotionals')
              }}
            />
            <NavCard 
              title="Holy Bible" 
              icon="library" 
              color="#A29BFE" 
              index={1}
              onPress={async () => {
                await showInterstitialIfTimePassed();
                navigation.navigate('Bible')
              }}
            />
            <NavCard 
              title="Hymnbook" 
              icon="musical-notes" 
              color="#4ECDC4" 
              index={2}
              onPress={async () => {
                await showInterstitialIfTimePassed();
                navigation.navigate('Hymnbook')
              }}
            />
            <NavCard 
              title="Prayer Feed" 
              icon="chatbubbles" 
              color="#FF7675" 
              index={3}
              onPress={async () => {
                await showInterstitialIfTimePassed();
                navigation.navigate('Prayers')
              }}
            />
            <NavCard 
              title="Request" 
              icon="mail-open" 
              color="#00CEC9" 
              index={4}
              onPress={() => navigation.navigate('PrayerRequest')}
            />
            <NavCard 
              title="Store" 
              icon="cart" 
              color="#FAB1A0" 
              index={5}
              onPress={() => navigation.navigate('Store')}
            />
          </View>

          {/* Premium Check-in Section */}
          <Animated.View entering={FadeInDown.delay(1000).springify()}>
            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: colors.primary }]}
              onPress={async () => {
                const user = await getCurrentUser();
                if (user) {
                  await markCheckIn();
                  await showInterstitialIfTimePassed();
                  navigation.navigate('Reflection');
                } else {
                  navigation.navigate('Login', { message: 'Start your spiritual streak today!' });
                }
              }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.checkInContent}>
                  <Ionicons name="sparkles" size={24} color="#FFF" />
                  <Text style={styles.checkInText}>Today's Reflection</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 110 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10
  },
  greeting: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subGreeting: { fontSize: 16, opacity: 0.6, marginTop: 2 },
  settingsBtn: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  
  sectionDivider: { marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },

  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    gap: 16
  },
  navCard: {
    height: 130,
    borderRadius: 28,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  checkInButton: {
    marginTop: 32,
    padding: 24,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  checkInContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  checkInText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  }
});
