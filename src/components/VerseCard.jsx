import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VerseCard({ text, reference, loading }) {
  const colors = useThemeColors();
  
  if (loading) {
      return (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', height: 160 }]}>
              <ActivityIndicator color={colors.primary} />
          </View>
      );
  }

  return (
    <LinearGradient
      colors={[colors.card, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: colors.border }]}
    >
      <Ionicons name="bookmark" size={24} color={colors.primary + '40'} style={styles.icon} />
      <Text style={[styles.text, { color: colors.text }]}>"{text}"</Text>
      <View style={[styles.separator, { backgroundColor: colors.primary + '30' }]} />
      <Text style={[styles.ref, { color: colors.primary }]}>{reference}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden'
  },
  icon: { position: 'absolute', top: 20, right: 25 },
  text: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.2
  },
  separator: {
    height: 3,
    width: 60,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 5,
  },
  ref: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});