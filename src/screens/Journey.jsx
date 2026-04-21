import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { getStreak } from '../services/appwrite';
import { LinearGradient } from 'expo-linear-gradient';

export default function Journey() {
  const colors = useThemeColors();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const s = await getStreak();
      setStreak(s);
    })();
  }, []);

  return (
    <LinearGradient
      colors={[colors.background, colors.secondary + '10']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Your Journey</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Current Streak</Text>
            <Text style={[styles.streakValue, { color: colors.primary }]}>{streak} Days</Text>
            <Text style={[styles.encouragement, { color: colors.text }]}>
              "Let us not become weary in doing good."
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  card: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  streakLabel: { fontSize: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  streakValue: { fontSize: 48, fontWeight: '800', marginBottom: 16 },
  encouragement: { fontSize: 16, fontStyle: 'italic', textAlign: 'center', opacity: 0.8 },
});