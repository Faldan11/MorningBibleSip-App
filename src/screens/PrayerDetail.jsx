import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { awardXP } from '../services/appwrite';

export default function PrayerDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { item } = route.params;
  const [sound, setSound] = React.useState(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [amenCount, setAmenCount] = React.useState(item.amen_count || 0);
  const [hasAmen, setHasAmen] = React.useState(false);

  // Try to find an audio URL in the post content or metadata
  const audioUrl = item.audio_url || 
    item.content.rendered.match(/src="([^"]+\.mp3)"/)?.[1];

  async function playSound() {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    if (!audioUrl) return;

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true }
    );
    setSound(newSound);
    setIsPlaying(true);
  }

  const handleAmen = async () => {
     if (hasAmen) return;
     
     setHasAmen(true);
     setAmenCount(prev => prev + 1);

     try {
        const res = await fetch('https://morningbiblesip.com/wp-json/mbs/v1/amen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: item.id })
        });
        
        if (res.ok) {
            await awardXP(50); // Significant XP for communal prayer
        }
     } catch (e) {
        console.error('Amen sync failed:', e);
     }
  };

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

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

      <View style={styles.interactionRow}>
        {audioUrl ? (
          <TouchableOpacity onPress={playSound} style={[styles.interactionBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#FFF" />
            <Text style={styles.btnText}>{isPlaying ? "Pause" : "Listen & Pray"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.interactionBtn, { backgroundColor: colors.border + '50' }]}>
            <Ionicons name="hand-right-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.btnText, { color: colors.textMuted }]}>Spiritual Reading</Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleAmen} 
          disabled={hasAmen}
          style={[styles.interactionBtn, { backgroundColor: hasAmen ? '#2ecc7120' : colors.card, borderColor: hasAmen ? '#2ecc71' : colors.border, borderWidth: 1 }]}
        >
          <Ionicons name={hasAmen ? "checkmark-circle" : "heart"} size={22} color={hasAmen ? "#2ecc71" : colors.primary} />
          <Text style={[styles.btnText, { color: hasAmen ? "#2ecc71" : colors.text }]}>
             {hasAmen ? "Amen!" : `Amen (${amenCount})`}
          </Text>
        </TouchableOpacity>
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
  interactionRow: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  interactionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 13 }
});
