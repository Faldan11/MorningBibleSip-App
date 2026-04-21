import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme/ThemeContext';
import { useAuth } from '../theme/AuthContext';
import { register, loginWithOAuth } from '../services/appwrite';
import * as WebBrowser from 'expo-web-browser';

export default function Register() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { loginAuth } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scheme = 'morningbiblesip://';

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(email, password, name);
      await loginAuth();
      setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 100);
    } catch (e) {
      console.error('Registration Error Details:', e);
      // Handle Appwrite error codes
      if (e.code === 409) {
        setError('This email is already registered. Try logging in.');
      } else if (e.code === 400) {
        setError('Invalid details provided. Please check your email or password.');
      } else {
        setError(e.message || 'Could not create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const redirectUrl = await loginWithOAuth(provider);
      const result = await WebBrowser.openAuthSessionAsync(
        redirectUrl,
        `${scheme}auth-callback`
      );
      
      if (result.type === 'success') {
        await loginAuth();
        setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 100);
      }
    } catch (e) {
      setError('OAuth authentication failed.');
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.content}
        >
          <View style={styles.header}>
            <Ionicons name="person-add-outline" size={80} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Join the Ministry</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Grow in faith with us every day</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: colors.border + '20' }]}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.border + '20' }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.border + '20' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Register Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>
            <View style={styles.oauthContainer}>
              <TouchableOpacity style={styles.oauthButton} onPress={() => handleOAuth('google')}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.oauthButton} onPress={() => handleOAuth('facebook')}>
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={{ color: colors.textMuted }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 32 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, marginTop: 8, opacity: 0.7, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 16, 
    marginBottom: 16, 
    paddingHorizontal: 16,
    height: 60
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  button: { 
    height: 60, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 16,
    overflow: 'hidden'
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#FF4D4D', textAlign: 'center', marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#CCC' },
  dividerText: { marginHorizontal: 16, color: '#888', fontWeight: 'bold' },
  oauthContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  oauthButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
});
