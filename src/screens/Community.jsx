import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useThemeColors } from '../theme/ThemeContext';
import { getPosts, createPost, getCurrentUser } from '../services/appwrite';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../theme/AuthContext';

export default function Community() {
  const colors = useThemeColors();
  const [posts, setPosts] = useState([]);
  const [author, setAuthor] = useState('Guest');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    loadFilters();
    fetchPosts();
    if (user?.name) {
      setAuthor(user.name);
    }
  }, [user]);

  const loadFilters = async () => {
    try {
      const rp = await SecureStore.getItemAsync('reportedPosts');
      const bu = await SecureStore.getItemAsync('blockedUsers');
      if (rp) setReportedPosts(JSON.parse(rp));
      if (bu) setBlockedUsers(JSON.parse(bu));
    } catch(e) {}
  };

  const fetchPosts = async () => {
    const data = await getPosts();
    // Sort posts by date descending
    const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setPosts(sorted);
  };

  const handlePostOptions = (item) => {
    Alert.alert(
      'Post Options',
      'Choose an action for this post by ' + item.author,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report Content', 
          style: 'destructive',
          onPress: async () => {
            const updated = [...reportedPosts, item.id];
            setReportedPosts(updated);
            await SecureStore.setItemAsync('reportedPosts', JSON.stringify(updated));
            Alert.alert('Reported', 'Thank you. This post has been reported and hidden from your feed.');
          }
        },
        { 
          text: 'Block User', 
          style: 'destructive',
          onPress: async () => {
            const updated = [...blockedUsers, item.author];
            setBlockedUsers(updated);
            await SecureStore.setItemAsync('blockedUsers', JSON.stringify(updated));
            Alert.alert('Blocked', 'You will no longer see posts from ' + item.author);
          }
        }
      ]
    );
  };

  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await createPost(author, message.trim());
    setMessage('');
    await fetchPosts();
    setLoading(false);
    Keyboard.dismiss();
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.secondary + '10']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>Community</Text>
            
            <FlatList
              data={posts.filter(p => !reportedPosts.includes(p.id) && !blockedUsers.includes(p.author))}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 16, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              inverted={false}
              renderItem={({ item }) => (
                <View style={[styles.post, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.postHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.author, { color: colors.primary }]}>{item.author}</Text>
                      <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handlePostOptions(item)}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{item.message}</Text>
                </View>
              )}
            />

            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.primary + '20' }]}>
              <View style={styles.inputRow}>
                <TextInput
                  value={author}
                  onChangeText={setAuthor}
                  placeholder="Name"
                  placeholderTextColor={colors.textMuted}
                  editable={!user} // Only editable if not logged in
                  style={[styles.inputName, { color: colors.text, backgroundColor: colors.background }]}
                />
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Share a word of encouragement..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.inputMessage, { color: colors.text, backgroundColor: colors.background }]}
                  multiline
                />
                <TouchableOpacity 
                  onPress={submit} 
                  style={[styles.send, { backgroundColor: colors.primary }]}
                  disabled={loading}
                >
                  {loading ? (
                    <Ionicons name="sync" size={20} color="white" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, paddingBottom: 0 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  post: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  author: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 },
  time: { fontSize: 11, color: '#999' },
  inputWrapper: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputName: { padding: 12, borderRadius: 16, width: 80, fontSize: 13, fontWeight: '600' },
  inputMessage: { padding: 12, borderRadius: 16, flex: 1, fontSize: 14, maxHeight: 100 },
  send: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});