import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Modal, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { useThemeColors } from '../theme/ThemeContext';
import { useAuth } from '../theme/AuthContext';
import { getCurrentUser, getStreak, getVerseOfTheDay, getChallengeProgress, getTotalXP, logout } from '../services/appwrite';
import { checkPremiumStatus, purchasePremium } from '../services/ads'; // Removed AdBanner as it's at App level
import { getJourneyState } from '../services/journey';

const { width } = Dimensions.get('window');

// Premium Glass Card Component
const GlassCard = ({ children, style, colors }) => (
    <View style={[styles.glassCard, style]}>
        <LinearGradient
            colors={colors || ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.glassGradient}
        />
        {children}
    </View>
);

export default function Dashboard() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [journey, setJourney] = useState(getJourneyState(0));
  const [dailyVerse, setDailyVerse] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [journeyModalVisible, setJourneyModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proData, setProData] = useState({ 
    challenges: [], 
    tracks: [], 
    resources: [], 
    global_prayer_count: "0",
    morning_sip: null,
    trivia: null,
    prayer_feed: [],
    testimonies: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [selectedWisdom, setSelectedWisdom] = useState(null);
  const [triviaModalVisible, setTriviaModalVisible] = useState(false);
  const [triviaResult, setTriviaResult] = useState(null);
  const { logoutAuth } = useAuth();
  
  const streakAnim = useSharedValue(0);

  const fetchData = async () => {
    try {
      const [u, s, v, totalXp, premium] = await Promise.all([
        getCurrentUser(),
        getStreak(),
        getVerseOfTheDay(),
        getTotalXP(),
        checkPremiumStatus()
      ]);
      setUser(u);
      setStreak(s);
      setDailyVerse(v);
      setXp(totalXp);
      setJourney(getJourneyState(totalXp));
      setIsPremium(premium);
      
      streakAnim.value = withDelay(500, withSpring(s > 0 ? (s % 7) / 7 : 0, { damping: 10 }));

      const res = await fetch('https://morningbiblesip.com/wp-json/mbs/v1/app-dashboard');
      if (res.ok) {
        const data = await res.json();
        // Robustness: Ensure data structure is correct
        const incomingData = {
          challenges: Array.isArray(data.challenges) ? data.challenges : [],
          tracks: Array.isArray(data.tracks) ? data.tracks : [],
          resources: Array.isArray(data.resources) ? data.resources : [],
          global_prayer_count: data.global_prayer_count || "0",
          morning_sip: data.morning_sip || null,
          trivia: data.trivia || null,
          prayer_feed: Array.isArray(data.prayer_feed) ? data.prayer_feed : [],
          testimonies: Array.isArray(data.testimonies) ? data.testimonies : []
        };

        const challengesWithProgress = await Promise.all(
          incomingData.challenges.map(async (ch) => {
            if (!ch || !ch.id) return null;
            try {
              const prog = await getChallengeProgress(ch.id);
              return { ...ch, localProgress: prog };
            } catch (e) {
              return { ...ch, localProgress: { progress: 0 } };
            }
          })
        );
        incomingData.challenges = challengesWithProgress.filter(c => c !== null);
        setProData(incomingData);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: async () => await logoutAuth(), style: 'destructive' }
    ]);
  };

  const handleAiWisdom = (mood) => {
    const wisdomMap = {
      anxious: { verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", ref: "Philippians 4:6" },
      weak: { verse: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'", ref: "2 Corinthians 12:9" },
      confused: { verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", ref: "Proverbs 3:5-6" },
      thankful: { verse: "Give thanks to the Lord, for he is good; his love endures forever.", ref: "Psalm 107:1" }
    };
    setSelectedWisdom(wisdomMap[mood] || wisdomMap['thankful']);
  };

  const handleUnlockPro = async () => {
    try {
        const result = await purchasePremium();
        if (result.success) {
            Alert.alert('Hallelujah!', 'You are now a Pro Member. Enjoy an ad-free experience and all premium features!');
            onRefresh(); 
        }
    } catch (e) {
        Alert.alert('Error', 'Could not complete purchase.');
    }
  };

  const sanitizeContent = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
  };

  // Reusable Component for Stats
  const StatCard = ({ title, value, icon, color, index, onPress }) => (
    <Animated.View 
      entering={FadeInDown.delay(400 + index * 100).springify().damping(12)} 
      style={styles.statCardContainer}
    >
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8} 
        style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.statTextContainer}>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: colors.textMuted }]}>{title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Preparing your spiritual dashboard...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNav}>
             <View style={styles.brand}>
                <Ionicons name="sparkles" size={24} color={colors.primary} />
                <Text style={[styles.brandText, { color: colors.text }]}>MBS JOURNEY</Text>
             </View>
             <TouchableOpacity onPress={handleLogout} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="log-out-outline" size={20} color="#FF4D4D" />
             </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <TouchableOpacity style={styles.profileRow} onPress={() => setJourneyModalVisible(true)}>
                <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
                    <LinearGradient colors={[colors.primary, '#E6B800']} style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                    </LinearGradient>
                </View>
                <View style={styles.welcomeText}>
                    <Text style={[styles.greeting, { color: colors.textMuted }]}>
                      Level {journey.level.level}: {journey.level.name}
                    </Text>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {user?.name ? user.name.split(' ')[0] : 'Believer'}
                    </Text>
                    <View style={styles.xpProgressContainer}>
                      <View style={[styles.xpProgressBarBase, { backgroundColor: colors.border }]}>
                         <View style={[styles.xpProgressBarFill, { width: `${journey.progress * 100}%`, backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={styles.xpText}>{xp} XP</Text>
                    </View>
                </View>
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: isPremium ? '#D4AF3720' : colors.primary + '20' }]}>
                <Ionicons name={isPremium ? "star" : "ribbon"} size={14} color={isPremium ? "#D4AF37" : colors.primary} />
                <Text style={[styles.badgeText, { color: isPremium ? "#D4AF37" : colors.primary }]}>{isPremium ? 'PRO MEMBER' : 'FREE SEEKER'}</Text>
            </View>
        </Animated.View>

        {proData.morning_sip && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sipContainer}>
            <LinearGradient colors={['#3E362E', '#2A241F']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.sipCard}>
               <View style={styles.sipBadge}><Text style={styles.sipBadgeText}>MORNING SIP</Text></View>
               <Ionicons name="quote" size={30} color="#D4AF3750" style={styles.quoteIcon} />
               <Text style={styles.sipVerse}>{proData.morning_sip.verse}</Text>
               <Text style={styles.sipRef}>— {proData.morning_sip.ref}</Text>
               <View style={styles.sipDivider} />
               <Text style={styles.sipEncouragement}>{proData.morning_sip.encouragement}</Text>
               <TouchableOpacity style={styles.sipAction} onPress={() => navigation.navigate('PrayersTab')}>
                  <Text style={styles.sipActionText}>Today's Prayer</Text>
                  <Ionicons name="arrow-forward" size={16} color="#D4AF37" />
               </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={styles.statsGrid}>
          <StatCard title="Day Streak" value={streak} icon="flame" color="#FF6B6B" index={0} />
          <StatCard title="Maturity" value={journey.growth.name} icon="trending-up" color="#D4AF37" index={1} onPress={() => setJourneyModalVisible(true)} />
          <StatCard title="AI Wisdom" value="Ask" icon="sparkles" color="#A29BFE" index={2} onPress={() => setAiModalVisible(true)} />
          <StatCard title="Global Prayers" value={proData.global_prayer_count || "1.2M"} icon="earth" color="#4ECDC4" index={3} />
        </View>

        {proData.trivia && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bible Trivia</Text>
              <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>DAILY</Text></View>
            </View>
            <TouchableOpacity 
                style={[styles.highlightCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => setTriviaModalVisible(true)}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="help-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Quiz of the Day</Text>
                <Text style={[styles.featureSub, { color: colors.textMuted }]}>Grow in knowledge and grace.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {proData.testimonies.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Testimony Wall</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('TestimoniesTab')}>
                         <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>View All</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
                    {proData.testimonies.map((t, idx) => (
                    <GlassCard key={idx} style={styles.testimonyCard}>
                        <Ionicons name="chatbubbles" size={20} color="#D4AF37" />
                        <Text style={[styles.testimonyContent, { color: colors.text }]} numberOfLines={4}>"{sanitizeContent(t.content)}"</Text>
                        <Text style={styles.testimonyAuthor}>- {t.author}</Text>
                    </GlassCard>
                    ))}
                </ScrollView>
            </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Prayer Community</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommunityTab')}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Join Feed</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.feedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {Array.isArray(proData.prayer_feed) && proData.prayer_feed.length > 0 ? proData.prayer_feed.slice(0, 3).map((f, i) => (
              <View key={i} style={[styles.feedItem, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border + '50' }]}>
                <View style={styles.feedBullet} />
                <Text style={[styles.feedText, { color: colors.text }]}>
                  <Text style={{fontWeight: '700', color: colors.primary}}>{f?.author || 'Anonymous'}</Text>: "{sanitizeContent(f?.request)}"
                </Text>
              </View>
            )) : (
              <View style={styles.emptyFeed}>
                 <Ionicons name="heart-outline" size={30} color={colors.textMuted} />
                 <Text style={{color: colors.textMuted, marginTop: 10}}>Together in prayer.</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {proData.challenges.length > 0 && (
          <View style={[styles.section, { paddingBottom: 100 }]}>
             <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Pro Journey</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
                {proData.challenges.map(ch => (
                  <TouchableOpacity 
                    key={ch.id} 
                    activeOpacity={0.9} 
                    onPress={() => isPremium ? navigation.navigate('Journal') : handleUnlockPro()} 
                    style={[styles.challengeBox, { backgroundColor: colors.card, borderColor: isPremium ? colors.primary + '30' : colors.border, borderWidth: 1 }]}
                  >
                    <View style={styles.challengeIconRow}>
                       <Ionicons name={isPremium ? "map-outline" : "lock-closed-outline"} size={22} color={isPremium ? colors.primary : colors.textMuted} />
                       {!isPremium && <View style={styles.proSmallBadge}><Text style={styles.proSmallText}>PRO</Text></View>}
                    </View>
                    <Text style={[styles.challengeName, { color: colors.text }]} numberOfLines={2}>{sanitizeContent(ch.title)}</Text>
                    <View style={styles.challengeFooter}>
                        <Text style={[styles.challengeStatus, { color: isPremium ? colors.primary : colors.textMuted }]}>{isPremium ? 'Track Progress' : 'Locked Feature'}</Text>
                        {isPremium && <Ionicons name="arrow-forward-circle" size={18} color={colors.primary} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Modals for interactivity */}
      <Modal visible={aiModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
             <TouchableOpacity style={styles.modalClose} onPress={() => { setAiModalVisible(false); setSelectedWisdom(null); }}>
               <Ionicons name="close-circle" size={32} color={colors.textMuted} />
             </TouchableOpacity>
             {!selectedWisdom ? (
               <View style={{ width: '100%', alignItems: 'center' }}>
                 <Text style={[styles.modalHead, { color: colors.text }]}>Wisdom Guide</Text>
                 <Text style={[styles.modalSub, { color: colors.textMuted }]}>In what area do you seek guidance?</Text>
                 <View style={styles.tagCloud}>
                   {['Anxious', 'Weak', 'Confused', 'Thankful'].map(m => (
                     <TouchableOpacity key={m} style={[styles.tag, { borderColor: colors.primary }]} onPress={() => handleAiWisdom(m.toLowerCase())}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>{m}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
             ) : (
               <Animated.View entering={FadeInDown} style={styles.wisdomView}>
                 <Text style={styles.wisdomQuote}>"{selectedWisdom.verse}"</Text>
                 <Text style={[styles.wisdomSource, { color: colors.primary }]}>— {selectedWisdom.ref}</Text>
                 <TouchableOpacity style={[styles.amenBtn, { backgroundColor: colors.primary }]} onPress={() => setAiModalVisible(false)}>
                   <Text style={styles.amenBtnText}>Amen</Text>
                 </TouchableOpacity>
               </Animated.View>
             )}
          </View>
        </View>
      </Modal>

      {/* Trivia Modal */}
      <Modal visible={triviaModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalHead, { color: colors.text }]}>Bible Trivia</Text>
              {triviaResult ? (
                 <View style={{ alignItems: 'center' }}>
                    <Ionicons name="ribbon" size={60} color={colors.primary} />
                    <Text style={[styles.resultMsg, { color: colors.text }]}>{triviaResult}</Text>
                    <TouchableOpacity style={[styles.amenBtn, { backgroundColor: colors.primary, marginTop: 20 }]} onPress={() => { setTriviaModalVisible(false); setTriviaResult(null); }}>
                       <Text style={styles.amenBtnText}>Close</Text>
                    </TouchableOpacity>
                 </View>
              ) : (
                 <View style={{ width: '100%' }}>
                    <Text style={[styles.ques, { color: colors.text }]}>{proData.trivia?.question}</Text>
                    {Array.isArray(proData.trivia?.options) && proData.trivia.options.map(opt => (
                       <TouchableOpacity key={opt} style={[styles.opt, { borderColor: colors.border }]} onPress={async () => {
                           const correct = opt === proData.trivia.answer;
                           if (correct) {
                               const newXp = await awardXP(30);
                               if (newXp) {
                                 setXp(newXp);
                                 setJourney(getJourneyState(newXp));
                               }
                               setTriviaResult('Excellent! That is correct. +30 XP');
                           } else {
                               setTriviaResult('Grace! The correct answer was ' + proData.trivia.answer);
                           }
                       }}>
                          <Text style={[styles.optText, { color: colors.text }]}>{opt}</Text>
                       </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => setTriviaModalVisible(false)}>
                       <Text style={{ color: colors.textMuted }}>Close</Text>
                    </TouchableOpacity>
                 </View>
              )}
           </View>
        </View>
      </Modal>
      {/* Journey Detail Modal */}
      <Modal visible={journeyModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <View style={[styles.modalBox, { backgroundColor: colors.card, padding: 30 }]}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setJourneyModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={[styles.modalHead, { color: colors.text }]}>Spiritual Journey</Text>
              
              <View style={styles.journeyScroll}>
                <View style={styles.journeyCurrent}>
                   <View style={[styles.journeyIconLarge, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name={journey.level.icon} size={40} color={colors.primary} />
                   </View>
                   <Text style={[styles.journeyLevelName, { color: colors.text }]}>{journey.level.name}</Text>
                   <Text style={[styles.journeyLevelDesc, { color: colors.textMuted }]}>{journey.level.description}</Text>
                </View>

                <View style={styles.journeyDivider} />

                <View style={styles.journeyStateRow}>
                   <View style={styles.journeyStateItem}>
                      <Text style={[styles.stateLabel, { color: colors.textMuted }]}>FAITH STATE</Text>
                      <Text style={[styles.stateValue, { color: colors.primary }]}>{journey.faith.name}</Text>
                      <Text style={[styles.stateRef, { color: colors.textMuted }]}>{journey.faith.ref}</Text>
                   </View>
                   <View style={styles.journeyStateItem}>
                      <Text style={[styles.stateLabel, { color: colors.textMuted }]}>GROWTH STAGE</Text>
                      <Text style={[styles.stateValue, { color: colors.text }]}>{journey.growth.name}</Text>
                      <Text style={[styles.stateRef, { color: colors.textMuted }]}>Solidify</Text>
                   </View>
                </View>

                <View style={[styles.faithDetailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                   <Text style={[styles.faithDetailText, { color: colors.text }]}>
                      "{journey.faith.description}"
                   </Text>
                </View>

                <TouchableOpacity style={[styles.amenBtn, { backgroundColor: colors.primary, width: '100%', marginTop: 20 }]} onPress={() => setJourneyModalVisible(false)}>
                   <Text style={styles.amenBtnText}>Stay Focused</Text>
                </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 15, fontSize: 14, fontWeight: '500' },
  scrollContent: { padding: 20 },

  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30,
    paddingRight: 5
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  avatarContainer: { borderWidth: 2, padding: 3, borderRadius: 30 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  greeting: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { fontSize: 22, fontWeight: '800', marginTop: -2 },
  badge: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 5 },
  badgeText: { fontSize: 10, fontWeight: '900' },

  xpProgressContainer: { marginTop: 8, width: '90%' },
  xpProgressBarBase: { height: 4, width: '100%', borderRadius: 2, overflow: 'hidden' },
  xpProgressBarFill: { height: '100%', borderRadius: 2 },
  xpText: { fontSize: 9, fontWeight: '800', marginTop: 4, letterSpacing: 0.5, opacity: 0.6 },

  sipContainer: { marginBottom: 30 },
  sipCard: { padding: 30, borderRadius: 32, position: 'relative', overflow: 'hidden' },
  sipBadge: { backgroundColor: '#D4AF37', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  sipBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  quoteIcon: { position: 'absolute', top: 30, right: 30 },
  sipVerse: { color: '#FFF', fontSize: 20, fontWeight: '700', lineHeight: 30, fontStyle: 'italic' },
  sipRef: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginTop: 12, textAlign: 'right' },
  sipDivider: { height: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
  sipEncouragement: { color: '#BBB', fontSize: 14, lineHeight: 22, opacity: 0.9 },
  sipAction: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 25, alignSelf: 'flex-start' },
  sipActionText: { color: '#D4AF37', fontWeight: '800', fontSize: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15, marginBottom: 30 },
  statCardContainer: { width: '47.5%' },
  statCard: { padding: 20, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statTextContainer: { flex: 1, gap: 2 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statTitle: { fontSize: 11, fontWeight: '600', opacity: 0.8 },

  section: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  infoBadge: { backgroundColor: '#2ecc7120', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  infoBadgeText: { color: '#2ecc71', fontSize: 9, fontWeight: '900' },

  highlightCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 28, borderWidth: 1 },
  featureIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  featureContent: { flex: 1, marginLeft: 15 },
  featureTitle: { fontSize: 16, fontWeight: '700' },
  featureSub: { fontSize: 12, marginTop: 2 },

  shelf: { gap: 16, paddingRight: 20 },
  testimonyCard: { width: 240, minHeight: 180, padding: 25, borderRadius: 28, justifyContent: 'space-between' },
  glassCard: { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  glassGradient: { ...StyleSheet.absoluteFillObject },
  testimonyContent: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', opacity: 0.9 },
  testimonyAuthor: { fontSize: 12, color: '#D4AF37', fontWeight: '800', textAlign: 'right', marginTop: 10 },

  feedCard: { padding: 20, borderRadius: 28, borderWidth: 1 },
  feedItem: { paddingVertical: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  feedBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37', marginTop: 8 },
  feedText: { fontSize: 14, flex: 1, lineHeight: 22 },
  emptyFeed: { alignItems: 'center', padding: 20 },

  challengeBox: { width: 155, padding: 20, borderRadius: 28, gap: 12, elevation: 1 },
  challengeIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  proSmallBadge: { backgroundColor: '#D4AF37', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  proSmallText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  challengeName: { fontSize: 13, fontWeight: '700', lineHeight: 20, height: 40 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  challengeStatus: { fontSize: 10, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalBox: { width: '100%', padding: 40, borderRadius: 35, alignItems: 'center', position: 'relative' },
  modalClose: { position: 'absolute', top: 20, right: 20 },
  modalHead: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  modalSub: { fontSize: 14, marginBottom: 30 },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  tag: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 18, borderWidth: 2 },
  tagText: { fontWeight: '700', fontSize: 14 },
  wisdomView: { alignItems: 'center' },
  wisdomQuote: { fontSize: 20, fontWeight: '700', textAlign: 'center', fontStyle: 'italic', lineHeight: 32 },
  wisdomSource: { fontSize: 15, fontWeight: '800', marginTop: 20, marginBottom: 30 },
  amenBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20, elevation: 5 },
  amenBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  journeyScroll: { width: '100%', alignItems: 'center', marginTop: 10 },
  journeyCurrent: { alignItems: 'center', marginBottom: 20 },
  journeyIconLarge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  journeyLevelName: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  journeyLevelDesc: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  journeyDivider: { width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  journeyStateRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  journeyStateItem: { flex: 1, alignItems: 'center' },
  stateLabel: { fontSize: 9, fontWeight: '900', marginBottom: 4 },
  stateValue: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateRef: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  faithDetailBox: { padding: 20, borderRadius: 20, borderWidth: 1, width: '100%' },
  faithDetailText: { fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 22, opacity: 0.9 },

  ques: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 25, lineHeight: 28 },
  opt: { width: '100%', padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  optText: { fontWeight: '600', textAlign: 'center', fontSize: 15 },
  resultMsg: { fontSize: 20, fontWeight: '800', marginTop: 15, textAlign: 'center' }
});
