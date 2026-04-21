import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useThemeColors } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Helper to decode basic HTML entities and clean text
const cleanBibleText = (text) => {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .trim();
};

export default function Bible() {
  const colors = useThemeColors();
  const [translation, setTranslation] = useState('NIV'); 
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('book'); // 'book', 'chapter', 'translation'

  // Fetch Books whenever translation changes
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://bolls.life/get-books/${translation}/`);
        if (res.data) {
          // Group books into Old and New Testament
          const ot = res.data.filter(b => b.bookid <= 39);
          const nt = res.data.filter(b => b.bookid > 39);
          
          setBooks([
            { title: 'Old Testament', data: ot },
            { title: 'New Testament', data: nt }
          ]);

          if (!selectedBook) {
            const defaultBook = res.data.find(b => b.name === 'John') || res.data[0];
            setSelectedBook(defaultBook);
          }
        }
      } catch (error) {
        console.error('Failed to fetch books:', error);
      }
      setLoading(false);
    };
    fetchBooks();
  }, [translation]);

  // Fetch Chapter Text whenever book, chapter, or translation changes
  useEffect(() => {
    const fetchChapterText = async () => {
      if (!selectedBook) return;
      setLoading(true);
      try {
        const res = await axios.get(`https://bolls.life/get-text/${translation}/${selectedBook.bookid}/${chapter}/`);
        setVerses(res.data || []);
      } catch (error) {
        console.error('Failed to fetch chapter text:', error);
        setVerses([]);
      }
      setLoading(false);
    };
    
    fetchChapterText();
  }, [selectedBook, chapter, translation]);

  const renderVerse = ({ item, index }) => {
    const pureText = cleanBibleText(item.text);
    return (
      <Animated.View entering={FadeInDown.delay(index * 20).springify()}>
        <View style={styles.verseRow}>
          <Text style={[styles.verseNumber, { color: colors.primary }]}>{item.verse}</Text>
          <Text style={[styles.verseText, { color: colors.text }]}>{pureText}</Text>
        </View>
      </Animated.View>
    );
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setChapter(1);
    setModalVisible(false);
  };

  const renderModalContent = () => {
    if (modalType === 'translation') {
      return (
        <View style={styles.modalGrid}>
          {['NIV', 'MSG', 'AMP', 'NKJV'].map(trans => (
             <TouchableOpacity 
               key={trans}
               style={[styles.modalItem, translation === trans && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
               onPress={() => { setTranslation(trans); setModalVisible(false); }}
             >
               <Text style={[styles.modalItemText, { color: colors.text }]}>{trans}</Text>
             </TouchableOpacity>
          ))}
        </View>
      );
    }
    
    if (modalType === 'book') {
      return (
        <SectionList
          sections={books}
          keyExtractor={(item) => item.bookid.toString()}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.modalItem, selectedBook?.bookid === item.bookid && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => handleSelectBook(item)}
            >
              <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
              {selectedBook?.bookid === item.bookid && <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{marginLeft: 'auto'}}/>}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      );
    }

    if (modalType === 'chapter' && selectedBook) {
      const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
      return (
        <ScrollView contentContainerStyle={styles.chapterGrid}>
          {chapters.map(ch => (
             <TouchableOpacity 
               key={ch}
               style={[styles.chapterItem, { backgroundColor: colors.card, borderColor: colors.border }, chapter === ch && { backgroundColor: colors.primary, borderColor: colors.primary }]}
               onPress={() => { setChapter(ch); setModalVisible(false); }}
             >
               <Text style={[styles.chapterText, { color: chapter === ch ? '#FFF' : colors.text }]}>{ch}</Text>
             </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Holy Bible</Text>
          <TouchableOpacity onPress={() => setModalVisible(true) || setModalType('translation')} style={[styles.transBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.transText, { color: colors.primary }]}>{translation}</Text>
            <Ionicons name="swap-vertical" size={14} color={colors.primary} style={{ marginLeft: 4 }}/>
          </TouchableOpacity>
        </View>

        <View style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setModalVisible(true) || setModalType('book')}
          >
            <Text style={[styles.navBtnText, { color: colors.text }]} numberOfLines={1}>
              {selectedBook ? selectedBook.name : 'Select Book'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border, flex: 0.5 }]}
            onPress={() => setModalVisible(true) || setModalType('chapter')}
          >
            <Text style={[styles.navBtnText, { color: colors.text }]}>Ch. {chapter}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Fetching the Word...</Text>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(item) => `verse-${item.pk}`}
          renderItem={renderVerse}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40 }}>No text available for this chapter.</Text>
          }
        />
      )}

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalType === 'book' ? 'Select Book' : modalType === 'chapter' ? 'Select Chapter' : 'Select Translation'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {renderModalContent()}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  transBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  transText: { fontSize: 14, fontWeight: 'bold' },
  navigation: { flexDirection: 'row', gap: 12 },
  navBtn: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1,
  },
  navBtnText: { fontSize: 15, fontWeight: '600' },
  listContent: { padding: 20, paddingBottom: 100 },
  verseRow: { flexDirection: 'row', marginBottom: 24, paddingRight: 10 },
  verseNumber: { fontSize: 14, fontWeight: '800', width: 30, marginTop: 4 },
  verseText: { flex: 1, fontSize: 18, lineHeight: 28 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  modalBody: { flex: 1 },
  sectionHeader: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginVertical: 12, backgroundColor: 'transparent' },
  modalGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  modalItem: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.02)' },
  modalItemText: { fontSize: 17, fontWeight: '600' },
  chapterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 40 },
  chapterItem: { width: 55, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  chapterText: { fontSize: 16, fontWeight: '700' }
});
