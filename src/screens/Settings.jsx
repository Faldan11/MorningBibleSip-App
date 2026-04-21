import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, ScrollView, Linking, Platform } from 'react-native';
import { useTheme, useThemeColors } from '../theme/ThemeContext';
import { useAuth } from '../theme/AuthContext';
import { purchasePremium, restorePurchases, checkPremiumStatus, SUBSCRIPTION_PRICE } from '../services/ads';
import { getCurrentUser, logout } from '../services/appwrite';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { isGuest, logoutAuth } = useAuth();
  
  const [user, setUser] = useState(null);
  const [daily, setDaily] = useState(false);
  const [alertTime, setAlertTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [isPremium, setIsPremium] = useState(false);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true);

  const appVersion = Constants?.expoConfig?.version || '1.0.0';

  useEffect(() => {
    (async () => {
      try {
        // 1. Check permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }

        // 2. Load preferences
        const savedDaily = await SecureStore.getItemAsync('mbs_daily_alert');
        const savedTime = await SecureStore.getItemAsync('mbs_alert_time');
        
        setDaily(savedDaily === 'true');
        if (savedTime) setAlertTime(new Date(savedTime));

        // 3. Status checks
        const premiumStatus = await checkPremiumStatus();
        setIsPremium(premiumStatus);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.warn('Err loading settings:', e);
      } finally {
        setIsConfiguring(false);
      }
    })();
  }, []);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will reset your local streak, journals, and ad timers. Your account will remain active. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('streak');
              await SecureStore.deleteItemAsync('posts');
              await SecureStore.deleteItemAsync('journalEntries');
              await SecureStore.deleteItemAsync('LAST_INTERSTITIAL_SHOWN');
              await SecureStore.deleteItemAsync('reportedPosts');
              await SecureStore.deleteItemAsync('blockedUsers');
              Alert.alert('Cache Cleared', 'App data has been refreshed.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          }
        }
      ]
    );
  };

  const scheduleDaily = async (value, customTime = null) => {
    const timeToUse = customTime || alertTime;
    setDaily(value);
    
    // Save preference
    await SecureStore.setItemAsync('mbs_daily_alert', value.toString());
    await SecureStore.setItemAsync('mbs_alert_time', timeToUse.toISOString());

    if (value) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
            setDaily(false);
            await SecureStore.setItemAsync('mbs_daily_alert', 'false');
            Alert.alert('Permission Denied', 'Please enable notifications in settings.');
            return;
        }
      }
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Morning Bible Sip ✝️",
          body: "Your daily spiritual refreshment is ready. Open for today's verse!",
        },
        trigger: {
          hour: timeToUse.getHours(),
          minute: timeToUse.getMinutes(),
          repeats: true,
        },
      });
      
      if (!customTime) {
         Alert.alert('Alerts Active', `We'll remind you at ${timeToUse.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} daily.`);
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setAlertTime(selectedDate);
      if (daily) {
        scheduleDaily(true, selectedDate);
      } else {
        SecureStore.setItemAsync('mbs_alert_time', selectedDate.toISOString());
      }
    }
  };

  const handlePurchase = async () => {
    setIsLoadingPurchase(true);
    try {
      const result = await purchasePremium();
      if (result.success) {
        setIsPremium(true);
        Alert.alert('Success', 'Premium features unlocked!');
      } else {
        Alert.alert('Purchase Failed', result.error);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoadingPurchase(false);
    }
  };

  const handleRestore = async () => {
    setIsLoadingRestore(true);
    try {
      const result = await restorePurchases();
      if (result.hasPremium) {
        setIsPremium(true);
        Alert.alert('Restored', 'Your premium features have been restored.');
      } else {
        Alert.alert('No Purchase Found', 'We could not find any previous premium purchases.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsLoadingRestore(false);
    }
  };

  const Section = ({ title, icon, children }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );

  if (isConfiguring) {
    return (
      <View style={[styles.loadingFull, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.secondary + '05']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
               <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Guest User Banner */}
          {isGuest && (
            <View style={[styles.guestBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
              <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.guestBannerTitle, { color: colors.text }]}>Guest Mode</Text>
                <Text style={[styles.smallMuted, { color: colors.textMuted, marginBottom: 0 }]}>Sync your progress with an account.</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} style={[styles.guestRegisterBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Join</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Premium Panel */}
          <LinearGradient 
            colors={isPremium ? ['#3E362E', '#2A241F'] : [colors.card, colors.card]} 
            style={[styles.premiumBox, { borderColor: isPremium ? '#D4AF37' : colors.border }]}
          >
            <View style={styles.premiumHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.premiumTitle, { color: isPremium ? '#FFF' : colors.text }]}>MBS Premium</Text>
                <Text style={[styles.premiumSub, { color: isPremium ? '#D4AF37' : colors.textMuted }]}>
                  {isPremium ? '★ PRO FEATURES ACTIVE' : `Unlock ad-free experience & extras`}
                </Text>
              </View>
              <Ionicons name="ribbon" size={40} color={isPremium ? '#D4AF37' : colors.border} />
            </View>

            {!isPremium && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handlePurchase} disabled={isLoadingPurchase}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   {isLoadingPurchase ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.actionButtonText}>Upgrade for {SUBSCRIPTION_PRICE}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                   )}
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={isLoadingRestore}>
              <Text style={[styles.restoreText, { color: isPremium ? '#D4AF37' : colors.primary }]}>
                {isLoadingRestore ? 'Checking Store...' : 'Restore Purchase'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Preferences Section */}
          <Section title="Preferences" icon="options-outline">
            <View style={styles.row}>
              <View style={styles.rowLabelGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Daily Verse Alerts</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>Daily spiritual reminder</Text>
              </View>
              <Switch value={daily} onValueChange={scheduleDaily} trackColor={{ true: colors.primary }} />
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            
            <TouchableOpacity style={styles.row} onPress={() => setShowTimePicker(true)}>
               <View style={styles.rowLabelGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Reminder Time</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>Choose when you sip</Text>
              </View>
              <View style={[styles.timeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {alertTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            
            <View style={styles.row}>
               <View style={styles.rowLabelGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>Easier on the eyes</Text>
              </View>
              <Switch value={theme === 'dark'} onValueChange={(v) => setTheme(v ? 'dark' : 'light')} trackColor={{ true: colors.primary }} />
            </View>
          </Section>

          {/* Account Section */}
          <Section title="Account" icon="person-outline">
            {!user ? (
               <View style={styles.authContainer}>
                  <Text style={[styles.authMessage, { color: colors.textMuted }]}>Join the community to save your journey and sync with our site.</Text>
                  <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  </TouchableOpacity>
               </View>
            ) : (
               <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                  <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text>
                  <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
                    <TouchableOpacity 
                      style={styles.flexBtn} 
                      onPress={async () => {
                        setIsLoggingOut(true);
                        await logoutAuth();
                        setIsLoggingOut(false);
                      }}
                      disabled={isLoggingOut}
                    >
                      <Text style={[styles.logoutText, { color: colors.text }]}>
                        {isLoggingOut ? 'Leaving...' : 'Sign Out'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.flexBtn} onPress={() => Alert.alert('Delete Account', 'Please contact support@morningbiblesip.com to permanently delete your data.')}>
                      <Text style={{ color: '#FF4757', fontWeight: '700' }}>Delete Data</Text>
                    </TouchableOpacity>
                  </View>
               </View>
            )}
          </Section>

          {/* Support Section */}
          <Section title="Support" icon="help-circle-outline">
            <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://morningbiblesip.com/support')}>
              <Text style={[styles.label, { color: colors.text }]}>Contact Support</Text>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.row} onPress={handleClearCache}>
              <Text style={[styles.label, { color: colors.text, color: '#FF4757' }]}>Reset App Data</Text>
              <Ionicons name="refresh-outline" size={20} color="#FF4757" />
            </TouchableOpacity>
          </Section>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>Morning Bible Sip v{appVersion}</Text>
            <Text style={[styles.subVersionText, { color: colors.primary }]}>Premium Ministry Edition</Text>
          </View>
          
          {showTimePicker && (
            <DateTimePicker
              value={alertTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onTimeChange}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 60 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800' },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  guestBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16 },
  guestBannerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  guestRegisterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },

  premiumBox: { padding: 24, borderRadius: 32, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  premiumTitle: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  premiumSub: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  actionButton: { paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  restoreBtn: { alignItems: 'center', marginTop: 15 },
  restoreText: { fontWeight: '700', fontSize: 13 },

  sectionContainer: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 4, marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 },
  section: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  rowLabelGroup: { gap: 2 },
  rowSub: { fontSize: 12, fontWeight: '500' },
  separator: { height: 1 },
  label: { fontSize: 16, fontWeight: '700' },
  
  timeBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  timeText: { fontSize: 15, fontWeight: '700' },

  authContainer: { padding: 20 },
  authMessage: { fontSize: 14, marginBottom: 20, lineHeight: 22 },
  loginBtn: { paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  
  userInfo: { padding: 24 },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 20 },
  flexBtn: { paddingVertical: 8 },
  logoutText: { fontWeight: '700' },

  footer: { alignItems: 'center', marginTop: 40 },
  versionText: { fontSize: 13, fontWeight: '600' },
  subVersionText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 }
});
