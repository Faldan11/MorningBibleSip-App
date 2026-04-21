import { ID, Query } from 'react-native-appwrite';
import * as SecureStore from 'expo-secure-store';
import { account, databases } from '../lib/appwrite';
import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra || {};

const appwriteDatabaseId = extra.appwriteDatabaseId;
const appwriteVersesCollectionId = extra.appwriteVersesCollectionId;
const appwritePostsCollectionId = extra.appwritePostsCollectionId;
const appwriteJournalCollectionId = extra.appwriteJournalCollectionId;
const appwriteStreakCollectionId = 'user_streaks';

// --- Auth Operations ---

const WP_SYNC_BASE = 'https://morningbiblesip.com/wp-json/mbs/v1';
const MBS_APP_SECRET = 'morning_bible_sip_default_secret_2026';

/**
 * Sync user data to WordPress for unified auth
 */
async function syncUserToWordPress(email, name, isPremium = false) {
    try {
        console.log('Syncing user to WordPress...', email);
        const response = await fetch(`${WP_SYNC_BASE}/user/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-MBS-App-Secret': MBS_APP_SECRET
            },
            body: JSON.stringify({ email, name, is_premium: isPremium })
        });
        const result = await response.json();
        console.log('WordPress sync result:', result);
        return result;
    } catch (e) {
        console.error('Failed to sync to WordPress:', e);
        return null;
    }
}

/**
 * Register a new user and automatically log them in.
 */
export async function register(email, password, name) {
  try {
    console.log('Appwrite: Registering user...', { email, name });
    const user = await account.create(ID.unique(), email, password, name);
    console.log('Appwrite: Registration success. Attempting login...');
    const session = await login(email, password);
    
    // Sync to WordPress immediately after registration
    await syncUserToWordPress(email, name);
    
    return session;
  } catch (e) {
    console.error('Appwrite: Registration error:', e.message);
    if (e.message.includes('Project not found')) {
      console.warn('HELP: Check if your PROJECT_ID "faldan01" is correct in app.json and exists in your Appwrite Cloud console.');
    }
    if (e.message.includes('platform')) {
      console.warn('HELP: You must add "com.morningbiblesip.app" as an Android Platform in your Appwrite project dashboard.');
    }
    throw e;
  }
}

/**
 * Attempt Google or Facebook OAuth Login
 */
export async function loginWithOAuth(providerStr) {
  try {
    console.log(`Appwrite: Attempting ${providerStr} OAuth...`);
    // Use the scheme defined in app.json for deep linking
    const scheme = 'morningbiblesip://';
    const successUrl = `${scheme}auth-callback`;
    const failureUrl = `${scheme}auth-error`;
    
    // In React Native, createOAuth2Session returns the URL to open
    const redirectUrl = await account.createOAuth2Session(providerStr, successUrl, failureUrl);
    return redirectUrl;
  } catch (e) {
    console.error(`Appwrite: ${providerStr} OAuth error:`, e.message);
    throw e;
  }
}

/**
 * Log in a user with email and password.
 */
export async function login(email, password) {
  try {
    // Check if a session already exists
    try {
      const currentSession = await account.getSession('current');
      if (currentSession) {
        console.log('Appwrite: Active session found, logging out before new login...');
        await account.deleteSession('current');
      }
    } catch (sessionError) {
      // No active session, proceed to login
    }

    console.log('Appwrite: Attempting login for', email);
    const session = await account.createEmailPasswordSession(email, password);
    
    // Sync to WordPress to ensure they exist/recover status
    const user = await account.get();
    if (user) {
        const premium = await SecureStore.getItemAsync('premium_purchased');
        await syncUserToWordPress(user.email, user.name, premium === 'true');
    }
    
    console.log('Appwrite: Login success!');
    return session;
  } catch (e) {
    console.error('Appwrite: Login error:', e.message);
    throw e;
  }
}

/**
 * Send password recovery email
 */
export async function recoverPassword(email) {
  try {
    const scheme = 'morningbiblesip://';
    // Deep link or Web link. The URL must be added to Appwrite dashboard settings under "Platforms" -> Web.
    // For React Native apps, a web intermediary link is usually preferred if deep link fails.
    const resetUrl = 'https://morningbiblesip.com/reset-password'; 
    await account.createRecovery(email, resetUrl);
    return true;
  } catch (e) {
    console.error('Password recovery error:', e.message);
    throw e;
  }
}


/**
 * Log the current user out.
 */
export async function logout() {
  try {
    await account.deleteSession('current');
    return true;
  } catch (e) {
    console.error('Logout error:', e);
    return false;
  }
}

/**
 * Get the currently logged-in user details.
 */
export async function getCurrentUser() {
  try {
    return await account.get();
  } catch (e) {
    return null;
  }
}

/**
 * Award XP to the user and sync to Appwrite
 */
export async function awardXP(amount) {
  try {
    const user = await account.get();
    const currentPrefs = user.prefs || {};
    const currentXP = parseInt(currentPrefs.total_xp || 0);
    const newXP = currentXP + amount;
    
    await account.updatePrefs({
      ...currentPrefs,
      total_xp: newXP
    });
    
    console.log(`XP Awarded: +${amount}. Total: ${newXP}`);
    return newXP;
  } catch (e) {
    console.error('Failed to award XP:', e);
    return null;
  }
}

/**
 * Get total XP
 */
export async function getTotalXP() {
  try {
    const user = await account.get();
    return parseInt(user.prefs?.total_xp || 0);
  } catch (e) {
    return 0;
  }
}

// --- Data Operations ---

export async function getVerseOfTheDay() {
  try {
    if (!appwriteDatabaseId || !appwriteVersesCollectionId) throw new Error('Missing Appwrite config');
    const res = await databases.listDocuments(appwriteDatabaseId, appwriteVersesCollectionId, {
      queries: [],
    });
    const first = res?.documents?.[0];
    if (first) {
      return { text: first.text, reference: first.reference };
    }
  } catch (e) {
    // Fallback verse
  }
  return {
    text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
    reference: 'Proverbs 3:5',
  };
}

// Helpers for anonymous session and simple data operations
async function ensureAnonymousSession() {
  try {
    const session = await account.getSession('current');
    if (session) return session;
  } catch (e) {
    // no session
  }
  try {
    return await account.createAnonymousSession();
  } catch (e) {
    return null;
  }
}

// Local fallbacks using SecureStore
async function getLocalJSON(key, defaultValue) {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}
async function setLocalJSON(key, value) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {}
}

// Community posts
export async function getPosts() {
  try {
    if (!appwriteDatabaseId || !appwritePostsCollectionId) throw new Error('Missing config');
    await ensureAnonymousSession();
    const res = await databases.listDocuments(appwriteDatabaseId, appwritePostsCollectionId, {
      queries: [],
    });
    return res?.documents?.map((d) => ({ id: d.$id, author: d.author, message: d.message, createdAt: d.$createdAt })) || [];
  } catch (e) {
    const local = await getLocalJSON('posts', []);
    return local;
  }
}

export async function createPost(author, message) {
  const post = { id: Date.now().toString(), author, message, createdAt: new Date().toISOString() };
  try {
    if (!appwriteDatabaseId || !appwritePostsCollectionId) throw new Error('Missing config');
    await ensureAnonymousSession();
    await databases.createDocument(appwriteDatabaseId, appwritePostsCollectionId, ID.unique(), { author, message });
    return true;
  } catch (e) {
    const current = await getLocalJSON('posts', []);
    current.unshift(post);
    await setLocalJSON('posts', current);
    return true;
  }
}

// Journal
export async function listJournalEntries() {
  const key = 'journalEntries';
  try {
    if (!appwriteDatabaseId || !(appwriteJournalCollectionId || appwritePostsCollectionId)) throw new Error('Missing config');
    const collectionId = appwriteJournalCollectionId || appwritePostsCollectionId;
    await ensureAnonymousSession();
    const res = await databases.listDocuments(appwriteDatabaseId, collectionId, { queries: [] });
    return (
      res?.documents?.map((d) => ({ id: d.$id, text: d.text || d.message, createdAt: d.$createdAt })) || []
    );
  } catch (e) {
    return await getLocalJSON(key, []);
  }
}

export async function createJournalEntry(text) {
  const entry = { id: Date.now().toString(), text, createdAt: new Date().toISOString() };
  try {
    if (!appwriteDatabaseId || !(appwriteJournalCollectionId || appwritePostsCollectionId)) throw new Error('Missing config');
    const collectionId = appwriteJournalCollectionId || appwritePostsCollectionId;
    await ensureAnonymousSession();
    // For posts collection, we store as { message }; for journal, { text, createdAt }
    const doc = collectionId === appwritePostsCollectionId ? { message: text } : { text, createdAt: entry.createdAt };
    await databases.createDocument(appwriteDatabaseId, collectionId, ID.unique(), doc);
    return true;
  } catch (e) {
    const current = await getLocalJSON('journalEntries', []);
    current.unshift(entry);
    await setLocalJSON('journalEntries', current);
    return true;
  }
}

// Streak tracking (daily check-in)
export async function markCheckIn() {
  try {
    const user = await getCurrentUser();
    if (!user) return await getStreak();

    const today = new Date().toDateString();
    let currentStreakCount = 0;
    let docId = null;

    // 1. Fetch from Appwrite
    const res = await databases.listDocuments(appwriteDatabaseId, appwriteStreakCollectionId, [
      Query.equal("userId", user.$id)
    ]);

    if (res.documents.length > 0) {
      const doc = res.documents[0];
      docId = doc.$id;
      if (doc.lastCheckIn === today) return doc.count;
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      currentStreakCount = doc.lastCheckIn === yesterday ? doc.count : 0;
    }

    const nextCount = currentStreakCount + 1;
    const streakData = { userId: user.$id, count: nextCount, lastCheckIn: today };

    // 2. Update/Create in Appwrite
    if (docId) {
      await databases.updateDocument(appwriteDatabaseId, appwriteStreakCollectionId, docId, streakData);
    } else {
      await databases.createDocument(appwriteDatabaseId, appwriteStreakCollectionId, ID.unique(), streakData);
    }

    // 3. Keep Local backup
    await setLocalJSON('streak', { last: today, count: nextCount });
    return nextCount;
  } catch (e) {
    console.error('Appwrite Streak Sync Error:', e);
    // Silent failover to local
    const today = new Date().toDateString();
    const data = (await getLocalJSON('streak', { last: null, count: 0 })) || { last: null, count: 0 };
    if (data.last === today) return data.count;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const nextCount = data.last === yesterday ? data.count + 1 : 1;
    await setLocalJSON('streak', { last: today, count: nextCount });
    return nextCount;
  }
}

export async function getStreak() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const res = await databases.listDocuments(appwriteDatabaseId, appwriteStreakCollectionId, [
        Query.equal("userId", user.$id)
      ]);
      if (res.documents.length > 0) {
        const count = res.documents[0].count;
        await setLocalJSON('streak', { last: res.documents[0].lastCheckIn, count });
        return count;
      }
    }
  } catch (e) {
    console.warn('Could not fetch cloud streak, using local.');
  }
  const data = await getLocalJSON('streak', { last: null, count: 0 });
  return data.count || 0;
}

// --- Challenge Local Tracking ---
export async function getChallengeProgress(challengeId) {
  return await getLocalJSON(`challenge_${challengeId}`, { progress: 0, lastCheckIn: null });
}

export async function markChallengeCheckIn(challengeId, maxTarget) {
  const today = new Date().toDateString();
  const data = await getChallengeProgress(challengeId);
  
  if (data.lastCheckIn === today) {
    return { success: false, message: 'Already completed today', data };
  }
  
  const updatedProgress = Math.min(data.progress + 1, maxTarget);
  const updated = { progress: updatedProgress, lastCheckIn: today };
  
  await setLocalJSON(`challenge_${challengeId}`, updated);
  return { success: true, data: updated };
}