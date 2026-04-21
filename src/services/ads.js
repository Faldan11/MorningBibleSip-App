import React from 'react';
import { View, Text, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import mobileAds, { BannerAd, BannerAdSize, InterstitialAd, AdEventType, TestIds, AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import AdsManager from './AdsManager';

const INTERSTITIAL_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
let interstitial = null;

export async function initializeAds() {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
      const { status } = await AdsConsent.showForm();
      console.log('Consent status after form:', status);
    }
    await mobileAds().initialize();
    console.log('Ads initialized with consent handled');
    return true;
  } catch (error) {
    console.error('Error initializing ads:', error);
    return false;
  }
}

export function AdBanner({ style }) {
  const [isPremium, setIsPremium] = React.useState(true); // Default to true to prevent ad flash

  React.useEffect(() => {
    checkPremiumStatus().then(setIsPremium);
  }, []);

  if (isPremium) return null;

  return (
    <View style={[style, { 
      alignItems: 'center', 
      paddingTop: 10,
      paddingBottom: 25, // SAFETY BUFFER: Prevents accidental clicks on phone controls
      backgroundColor: '#f9f9f9', 
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      minHeight: 110, // Increased to account for buffer
    }]}>
      <BannerAd
        unitId={AdsManager.bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.warn('Banner Ad failed to load:', error);
        }}
        onAdLoaded={() => {
          console.log('Banner Ad successfully loaded.');
        }}
      />
      <Text style={{ fontSize: 9, color: '#aaa', marginTop: 4, fontWeight: '700' }}>ADVERTISEMENT</Text>
    </View>
  );
}

// Function to handle showing interstitial with temporal logic
export async function showInterstitialIfTimePassed() {
  const isPremium = await checkPremiumStatus();
  if (isPremium) return false;

  const now = Date.now();
  const lastShown = await SecureStore.getItemAsync('LAST_INTERSTITIAL_SHOWN');
  const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;

  if (now - lastShownTime > INTERSTITIAL_INTERVAL) {
    console.log('Interstital ad logic triggered. Time since last ad:', (now - lastShownTime) / 1000, 'seconds');
    
    // Initialize or re-create interstitial if needed
    if (!interstitial) {
      interstitial = InterstitialAd.createForAdRequest(AdsManager.interstitialAdUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });
    }

    return new Promise((resolve) => {
      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
        SecureStore.setItemAsync('LAST_INTERSTITIAL_SHOWN', now.toString());
        unsubscribeLoaded();
        resolve(true);
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('Interstitial Ad Error:', error);
        unsubscribeError();
        resolve(false);
      });

      interstitial.load();
    });
  }

  return false;
}

import { initIAP, requestSubscription, getSubscriptions, finishTransaction } from './InAppPurchase';

// ... (previous code for initializeAds, AdBanner, showInterstitialIfTimePassed remain same)

// Premium subscription functionality
export async function fetchSubscriptionDetails() {
  try {
    const initialized = await initIAP();
    if (!initialized) return { price: '$1.99', offerToken: null };

    const subs = await getSubscriptions();
    if (subs && subs.length > 0) {
      const sub = subs[0];
      // Android Play Billing Library 5+
      if (sub.subscriptionOfferDetails && sub.subscriptionOfferDetails.length > 0) {
        const offer = sub.subscriptionOfferDetails[0];
        const phases = offer.pricingPhases?.pricingPhaseList;
        if (phases && phases.length > 0) {
          return {
            price: phases[0].formattedPrice,
            offerToken: offer.offerToken
          };
        }
      }
      // iOS or older Android
      if (sub.localizedPrice) {
        return { price: sub.localizedPrice, offerToken: null };
      }
    }
    return { price: '$1.99', offerToken: null };
  } catch (error) {
    console.warn('Error fetching sub details:', error);
    return { price: '$1.99', offerToken: null };
  }
}

export async function purchasePremium(offerToken = null) {
  try {
    const initialized = await initIAP();
    if (!initialized) throw new Error('Could not initialize Google Play Billing');

    const sku = Platform.OS === 'ios' ? 'com.morningbiblesip.premium' : 'premium_ads_free';
    console.log('Requesting purchase for SKU:', sku);
    
    // For subscriptions, we use requestSubscription
    const purchase = await requestSubscription(sku, offerToken);
    console.log('Purchase successful, finishing transaction...');
    
    await finishTransaction(purchase);
    await SecureStore.setItemAsync('premium_purchased', 'true');

    // SYNC TO WORDPRESS: Ensure the user is marked as Pro on the site too
    try {
        const userRaw = await SecureStore.getItemAsync('user_data'); // If we store user data locally
        const uEmail = userRaw ? JSON.parse(userRaw).email : null; // Fallback or use getCurrentUser if available
        
        // Better: Fetch current user from Appwrite
        const { account } = require('../lib/appwrite');
        const user = await account.get();
        if (user) {
            const WP_SYNC_BASE = 'https://morningbiblesip.com/wp-json/mbs/v1';
            const MBS_APP_SECRET = 'morning_bible_sip_default_secret_2026';
            await fetch(`${WP_SYNC_BASE}/user/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-MBS-App-Secret': MBS_APP_SECRET },
                body: JSON.stringify({ email: user.email, name: user.name, is_premium: true })
            });
            console.log('Premium synced to WordPress.');
        }
    } catch (e) {
        console.warn('WP Sync after purchase failed, but local premium is active.');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error purchasing premium:', error);
    return { success: false, error: error.message || 'Failed to process payment. Please try again.' };
  }
}

export async function restorePurchases() {
  try {
    const initialized = await initIAP();
    if (!initialized) return { hasPremium: false };

    // In a real app, you would check IAP.getAvailablePurchases()
    // For now, we rely on SecureStore if already set, or you can implement re-verification logic
    const premium = await SecureStore.getItemAsync('premium_purchased');
    return { hasPremium: premium === 'true' };
  } catch (error) {
    return { hasPremium: false, error: 'Failed to restore purchases' };
  }
}

export async function checkPremiumStatus() {
  try {
    const premium = await SecureStore.getItemAsync('premium_purchased');
    return premium === 'true';
  } catch (error) {
    return false;
  }
}

export const SUBSCRIPTION_ID = 'premium_ads_free';
export const SUBSCRIPTION_PRICE = '$1.99';

export default {
  initializeAds,
  AdBanner,
  showInterstitialIfTimePassed,
  purchasePremium,
  restorePurchases,
  checkPremiumStatus,
  fetchSubscriptionDetails,
  SUBSCRIPTION_ID,
  SUBSCRIPTION_PRICE,
};