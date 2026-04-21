import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import { getDevotionals } from '../services/wordpress';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function Devotionals() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [devotionals, setDevotionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDevotionals(true);
  }, []);

  const fetchDevotionals = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await getDevotionals(1);
      setDevotionals(data);
    } catch (e) {
      console.error('Fetch Devotionals Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderItem = ({ item, index }) => {
    // Attempt to extract featured image from embedded data
    const featuredMedia = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    
    // Strip simple HTML tags from excerpt
    const excerpt = item.excerpt?.rendered?.replace(/<[^>]+>/g, '') || '';
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <TouchableOpacity 
           style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}
           onPress={() => navigation.navigate('DevotionalDetail', { item })}
        >
          {featuredMedia && (
            <Image source={{ uri: featuredMedia }} style={styles.image} />
          )}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.title.rendered}
            </Text>
            <Text style={[styles.excerpt, { color: colors.textMuted }]} numberOfLines={3}>
              {excerpt}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Devotionals</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={devotionals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchDevotionals(false)}
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
    height: 180,
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
  }
});
