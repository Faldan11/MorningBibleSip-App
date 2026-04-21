import { TestIds } from 'react-native-google-mobile-ads';

/**
 * AdsManager handles the Ad Unit IDs for the application.
 * Set IS_STORE_BUILD to true before submitting to the Google Play Store (AAB).
 * Set IS_STORE_BUILD to false for APK testing / Local development.
 */
const IS_STORE_BUILD = true; 

const AdsManager = {
    bannerAdUnitId: IS_STORE_BUILD ? 'ca-app-pub-9224681585676816/1236884643' : TestIds.BANNER,
    interstitialAdUnitId: IS_STORE_BUILD ? 'ca-app-pub-9224681585676816/6194516093' : TestIds.INTERSTITIAL,
    rewardedAdUnitId: IS_STORE_BUILD ? 'ca-app-pub-9224681585676816/8549201532' : TestIds.REWARDED,
    
    // Unity Ads can be mediated via AdMob. 
    // They will resolve to these same Unit IDs if configured in the AdMob dashboard.
    
    // Test App IDs (configured in app.json):
    // Android: ca-app-pub-3940256099942544~3347511713
    // iOS: ca-app-pub-3940256099942544~1458002511
};

export default AdsManager;
