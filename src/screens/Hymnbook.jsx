import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import { getHymns } from '../services/wordpress';
import bootstrapHymns from '../assets/data/hymns_bootstrap.json';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Hymnbook() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [hymns, setHymns] = useState([]);
  const [filteredHymns, setFilteredHymns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchHymns = async () => {
    setLoading(true);
    try {
      const wpData = await getHymns(1);
      if (wpData && wpData.length > 0) {
        // Transform WP data
        const formatted = wpData.map(h => ({
           id: h.id,
           title: h.title.rendered,
           lyrics: h.content.rendered, // lyrics
           author: h.meta?.author || 'Classic',
           pdf_url: h.meta?.pdf_url || null,
           audio_url: h.meta?.audio_url || null
        }));
        setHymns(formatted);
      } else {
        // Fallback to bootstrap data
        setHymns(bootstrapHymns);
      }
    } catch (e) {
      console.error('Fetch hymns error:', e);
      setHymns(bootstrapHymns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHymns();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredHymns(hymns);
    } else {
      const term = search.toLowerCase();
      const filtered = hymns.filter(h => 
        h.title.toLowerCase().includes(term) || 
        h.author.toLowerCase().includes(term)
      );
      setFilteredHymns(filtered);
    }
  }, [search, hymns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHymns();
    setRefreshing(false);
  }, []);

  const renderHymnItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={[styles.hymnCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('HymnDetail', { hymn: item })}
      >
        <View style={[styles.numberCircle, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <View style={styles.hymnInfo}>
          <Text style={[styles.hymnTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.hymnAuthor, { color: colors.textMuted }]}>{item.author}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hymnbook</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput 
          style={[styles.searchInput, { color: colors.text }]} 
          version="Hymn title or author..."
          placeholder="Search hymns..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: 10 }}>Loading your hymns...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHymns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHymnItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={60} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 10 }}>No hymns found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20 
  },
  backBtn: { marginRight: 15 },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800' 
  },
  searchContainer: {
    margin: 20,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  list: { padding: 20, paddingBottom: 100 },
  hymnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  numberText: { fontWeight: 'bold', fontSize: 14 },
  hymnInfo: { flex: 1 },
  hymnTitle: { fontSize: 16, fontWeight: '700' },
  hymnAuthor: { fontSize: 12, marginTop: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }
});
