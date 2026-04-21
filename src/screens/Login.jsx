import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme/ThemeContext';
import { useAuth } from '../theme/AuthContext';
import { login, loginWithOAuth, recoverPassword } from '../services/appwrite';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

export default function Login() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { loginAuth, loginAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const scheme = 'morningbiblesip://';

  // Handle returning to the app from OAuth browser
  useEffect(() => {
    const handleDeepLink = async (event) => {
      if (event.url.includes('auth-callback')) {
        setOauthLoading(false);
        await loginAuth();
        setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 100);
      } else if (event.url.includes('auth-error')) {
        setOauthLoading(false);
        setError('Authentication was cancelled or failed.');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Login: Attempting login for', email);
      await login(email, password);
      console.log('Login: Appwrite login success, updating context...');
      await loginAuth();
      console.log('Login: Context updated.');
      setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 100);
    } catch (e) {
      console.error('Login Error:', e);
      // Show descriptive errors to help diagnose issues
      if (e.code === 401 || e.message?.includes('Invalid credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (e.message?.includes('platform') || e.message?.includes('Project not found') || e.message?.includes('network') || e.message?.includes('fetch')) {
        setError(`Connection Error: ${e.message}\n\nPlease check your Appwrite Project ID (faldan01) and ensure your App Package Name (com.morningbiblesip.app) is added as a platform in your Appwrite dashboard.`);
      } else {
        setError(e.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await recoverPassword(email);
      Alert.alert('Success', 'If this email is registered, a password reset link has been sent to it.');
    } catch(e) {
      setError(e.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setOauthLoading(true);
    setError('');
    try {
      const redirectUrl = await loginWithOAuth(provider);
      // Wait for user to complete OAuth in system browser
      const result = await WebBrowser.openAuthSessionAsync(
        redirectUrl,
        `${scheme}auth-callback`
      );
      
      if (result.type === 'success') {
        await loginAuth();
        setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 100);
      } else {
        setOauthLoading(false);
      }
    } catch (e) {
      setOauthLoading(false);
      setError(`${provider} authentication failed. Please try again.`);
    }
  };

  const handleGuestAccess = () => {
    console.log('Login: Continuing as guest...');
    loginAsGuest();
    setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 100);
  };

  return (
    <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.content}
        >
          <View style={styles.header}>
            <Ionicons name="wine-outline" size={80} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Refuel your spirit with Morning Bible Sip</Text>
          </View>

          <View style={styles.form}>
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

            <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading || oauthLoading}
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
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.oauthContainer}>
              <TouchableOpacity 
                style={[styles.oauthButton, oauthLoading && { opacity: 0.6 }]} 
                onPress={() => handleOAuth('google')}
                disabled={loading || oauthLoading}
              >
                {oauthLoading ? <ActivityIndicator size="small" color="#DB4437" /> : <Ionicons name="logo-google" size={24} color="#DB4437" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.oauthButton, oauthLoading && { opacity: 0.6 }]} 
                onPress={() => handleOAuth('facebook')}
                disabled={loading || oauthLoading}
              >
                {oauthLoading ? <ActivityIndicator size="small" color="#4267B2" /> : <Ionicons name="logo-facebook" size={24} color="#4267B2" />}
              </TouchableOpacity>
            </View>

            {/* Guest Access Button */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestAccess}
              disabled={loading || oauthLoading}
            >
              <Ionicons name="eye-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.guestText, { color: colors.textMuted }]}>Continue as Guest</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: colors.textMuted }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Register</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
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
  errorText: { color: '#FF4D4D', textAlign: 'center', marginBottom: 12, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#CCC' },
  dividerText: { marginHorizontal: 16, color: '#888', fontWeight: 'bold' },
  oauthContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  oauthButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  guestButton: { 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  guestText: { fontSize: 15, fontWeight: '500' },
});
