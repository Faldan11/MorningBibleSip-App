import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import { getPrayers } from '../services/wordpress';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Ionicons } from '@expo/vector-icons';

export default function Prayers() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    setLoading(true);
    const data = await getPrayers(1);
    setPrayers(data);
    setLoading(false);
  };

  const renderItem = ({ item, index }) => {
    const featuredMedia = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const excerpt = item.excerpt?.rendered?.replace(/<[^>]+>/g, '') || '';
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <TouchableOpacity 
           style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}
           onPress={() => navigation.navigate('PrayerDetail', { item })}
        >
          {featuredMedia && (
            <Image source={{ uri: featuredMedia }} style={styles.image} />
          )}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.title.rendered}
            </Text>
              <View style={styles.footerRow}>
                <Text style={[styles.excerpt, { color: colors.textMuted }]} numberOfLines={3}>
                  {excerpt}
                </Text>
                <View style={[styles.amenBadge, { backgroundColor: colors.primary + '15' }]}>
                   <Ionicons name="heart" size={12} color={colors.primary} />
                   <Text style={[styles.amenLabel, { color: colors.primary }]}>{item.amen_count || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Prayers</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={prayers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#eee'
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12
  },
  amenBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  amenLabel: {
    fontSize: 11,
    fontWeight: '800'
  }
});
