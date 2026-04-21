import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { getTestimonies } from '../services/wordpress';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function Testimonies() {
  const colors = useThemeColors();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    setLoading(true);
    const data = await getTestimonies(1);
    setTestimonies(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!name || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    // In a real app, this would POST to WP API
    // For now, we simulate success
    setTimeout(() => {
      setSubmitting(false);
      setModalVisible(false);
      setName('');
      setMessage('');
      Alert.alert('Success', 'Your testimony has been submitted for approval.');
    }, 1500);
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="quote" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
        <Text style={[styles.content, { color: colors.text }]}>
          {item.content.rendered.replace(/<[^>]+>/g, '')}
        </Text>
        <Text style={[styles.author, { color: colors.primary }]}>
          - {item.title.rendered}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Testimonies</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={testimonies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Submission Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Share Your Story</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Ex: John Doe"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.label, { color: colors.text }]}>Your Testimony</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                placeholder="What has the Lord done for you?"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Submit Testimony</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: 20 },
  card: { padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
  content: { fontSize: 16, lineHeight: 24, fontStyle: 'italic', marginBottom: 12 },
  author: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
