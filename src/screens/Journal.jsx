import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { listJournalEntries, createJournalEntry } from '../services/appwrite';
import { LinearGradient } from 'expo-linear-gradient';

export default function Journal() {
  const colors = useThemeColors();
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    (async () => {
      const data = await listJournalEntries();
      setEntries(data);
    })();
  }, []);

  const save = async () => {
    if (!text.trim()) return;
    await createJournalEntry(text.trim());
    setText('');
    const data = await listJournalEntries();
    setEntries(data);
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.secondary + '10']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Journal</Text>

          <View style={styles.inputContainer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write your prayer request..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              multiline
            />
            <TouchableOpacity style={[styles.save, { backgroundColor: colors.primary }]} onPress={save}>
              <Text style={styles.saveText}>Save Entry</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            style={{ marginTop: 24 }}
            data={entries}
            keyExtractor={(item) => item.id || item.$id}
            renderItem={({ item }) => (
              <View style={[styles.entry, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{item.text}</Text>
                <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>
                  {new Date(item.createdAt || item.$createdAt).toLocaleString()}
                </Text>
              </View>
            )}
            contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  inputContainer: { gap: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  save: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  saveText: { color: 'white', fontWeight: '700', fontSize: 16 },
  entry: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
});