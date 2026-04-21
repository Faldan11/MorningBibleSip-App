import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getReflection } from '../services/wordpress';
import { AdBanner, checkPremiumStatus } from '../services/ads';

export default function Reflection() {
  const colors = useThemeColors();
  const [reflection, setReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(true);

  const fetchReflection = async () => {
    try {
      const data = await getReflection();
      setReflection(data);
    } catch (error) {
      console.error('Error loading reflection:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReflection();
    checkPremiumStatus().then(setIsPremium);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReflection();
  };

  const cleanHTML = (html) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8217;/g, "'")
      .replace(/&#8211;/g, "-")
      .trim();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.secondary + '10']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          <Text style={[styles.title, { color: colors.text }]}>Today's Reflection</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.postTitle, { color: colors.primary }]}>
              {reflection?.title?.rendered || 'Pondering God\'s Word'}
            </Text>
            <Text style={[styles.text, { color: colors.text }]}>
              {reflection ? cleanHTML(reflection.content.rendered) : 'No reflection posted for today yet. Take a moment to pray and wait on the Lord.'}
            </Text>
          </View>
          
          {!reflection && (
             <View style={styles.hintBox}>
                <Text style={[styles.hintText, { color: colors.textMuted }]}>
                  Tip: Reflections are updated daily from the Morning Bible Sip dashboard.
                </Text>
             </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, gap: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  postTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  text: { fontSize: 16, lineHeight: 28, fontWeight: '500' },
  hintBox: { alignItems: 'center', marginTop: 12 },
  hintText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' }
});