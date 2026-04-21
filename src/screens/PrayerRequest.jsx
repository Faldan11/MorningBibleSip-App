import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { sendPrayerRequest } from '../services/wordpress';
import { AdBanner, checkPremiumStatus } from '../services/ads';

export default function PrayerRequest() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [request, setRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPremium, setIsPremium] = useState(true);

  React.useEffect(() => {
    checkPremiumStatus().then(setIsPremium);
  }, []);

  const handleSubmit = async () => {
    if (!name || !email || !request) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    try {
      await sendPrayerRequest(name, email, request);
      setSubmitting(false);
      Alert.alert(
        'Request Sent',
        'Your prayer request has been received. We are praying with you!',
        [{ text: 'OK', onPress: () => {
          setName('');
          setEmail('');
          setRequest('');
          navigation.goBack();
        }}]
      );
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', 'Could not send prayer request. Please try again later.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Prayer Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="heart" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          "For where two or three are gathered together in My name, I am there in the midst of them." - Matthew 18:20
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="yourname@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>Your Prayer Request</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            value={request}
            onChangeText={setRequest}
            multiline
            numberOfLines={6}
            placeholder="Tell us how we can pray for you..."
            placeholderTextColor={colors.textMuted}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Send Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 24, alignItems: 'center' },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  description: { textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 32, paddingHorizontal: 10 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 16 },
  textArea: { height: 150 },
  submitButton: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
