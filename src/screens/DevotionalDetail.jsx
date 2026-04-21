import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function DevotionalDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { item } = route.params;

  // Inject some CSS to make the WordPress HTML look native and match the theme
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: ${colors.text};
            background-color: ${colors.background};
            padding: 20px;
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
          }
          h1, h2, h3, h4 { color: ${colors.text}; margin-top: 1.5em; }
          img { max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; }
          a { color: ${colors.primary}; text-decoration: none; }
          blockquote { 
            border-left: 4px solid ${colors.primary};
            margin: 0;
            padding-left: 16px;
            font-style: italic;
            color: ${colors.textMuted};
          }
        </style>
      </head>
      <body>
        <h1 style="margin-top:0">${item.title.rendered}</h1>
        ${item.content.rendered}
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title.rendered}
        </Text>
      </View>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12
  },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  backButton: {
    padding: 4,
  }
});
