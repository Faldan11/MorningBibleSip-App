import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Store() {
  const colors = useThemeColors();

  return (
    <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.content}>
          <Ionicons name="cart-outline" size={120} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>MBS Store</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            We're building something special just for you! Our premium merchandise and resources will be arriving soon.
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>Coming Soon</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
