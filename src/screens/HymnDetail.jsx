import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function HymnDetail() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute();
  const { hymn } = route.params;

  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Clean lyrics if HTML
  const cleanLyrics = (text) => {
    if (!text) return '';
    return text
      .replace(/<[^>]+>/g, '') 
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8217;/g, "'")
      .trim();
  };

  const lyrics = cleanLyrics(hymn.lyrics);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    if (!hymn.audio_url) {
      Alert.alert('No Tone', 'An audio intro is not available for this hymn yet.');
      return;
    }

    try {
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

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: hymn.audio_url },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (e) {
      console.error('Playback error:', e);
      Alert.alert('Error', 'Could not play the audio intro.');
    }
  };

  const downloadPDF = async () => {
    if (!hymn.pdf_url) {
      Alert.alert('No PDF', 'A music sheet is not available for this hymn yet.');
      return;
    }

    setIsDownloading(true);
    try {
      const filename = `${hymn.title.replace(/\s+/g, '_')}_Music_Sheet.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        hymn.pdf_url,
        fileUri,
        {}
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF downloaded successfully to: ' + uri);
      }
    } catch (e) {
      console.error('Download error:', e);
      Alert.alert('Error', 'Could not download the PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${hymn.title}\n\n${lyrics}\n\nShared via Morning Bible Sip`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{hymn.title}</Text>
        <TouchableOpacity onPress={handleShare}>
           <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800)}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.authorLabel, { color: colors.textMuted }]}>Written by</Text>
            <Text style={[styles.authorName, { color: colors.text }]}>{hymn.author}</Text>
          </View>
        </Animated.View>

        <View style={styles.actionsRow}>
           <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
             onPress={playSound}
           >
             <LinearGradient colors={['rgba(255,255,255,0.2)', 'transparent']} style={StyleSheet.absoluteFill} />
             <Ionicons name={isPlaying ? "pause" : "musical-note"} size={20} color="#FFF" />
             <Text style={styles.actionText}>{isPlaying ? 'Pause Intro' : 'Play Intro'}</Text>
           </TouchableOpacity>

           <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} 
             onPress={downloadPDF}
             disabled={isDownloading}
           >
             {isDownloading ? (
               <ActivityIndicator size="small" color={colors.primary} />
             ) : (
               <>
                 <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                 <Text style={[styles.actionText, { color: colors.text }]}>Sheet Music</Text>
               </>
             )}
           </TouchableOpacity>
        </View>

        <Animated.View entering={FadeIn.delay(400)}>
          <View style={[styles.lyricsBox, { backgroundColor: colors.card + '50' }]}>
            <Text style={[styles.lyricsText, { color: colors.text }]}>{lyrics}</Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
             <Text style={{ color: colors.textMuted, fontSize: 12 }}>© Morning Bible Sip Hymnary Collection</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20 
  },
  backBtn: { marginRight: 15 },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800',
    flex: 1,
    marginRight: 10
  },
  content: { padding: 20, paddingBottom: 100 },
  infoCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 25,
    alignItems: 'center'
  },
  authorLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  authorName: { fontSize: 18, fontWeight: '700' },
  actionsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 30 
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    gap: 10,
    overflow: 'hidden'
  },
  actionText: { fontWeight: '700', fontSize: 14 },
  lyricsBox: {
    padding: 30,
    borderRadius: 32,
    minHeight: 300
  },
  lyricsText: {
    fontSize: 19,
    lineHeight: 34,
    textAlign: 'center',
    fontWeight: '500'
  },
  footer: {
      marginTop: 40,
      alignItems: 'center',
      opacity: 0.5
  }
});
