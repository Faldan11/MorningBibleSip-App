import { Platform } from 'react-native';
import * as IAP from 'react-native-iap';

const productSkus = Platform.select({
  android: ['premium_ads_free'],
  ios: ['com.morningbiblesip.premium'],
});

export const initIAP = async () => {
  try {
    await IAP.initConnection();
    if (Platform.OS === 'android') {
      await IAP.flushFailedPurchasesCachedAsPendingAndroid();
    }
    return true;
  } catch (err) {
    console.warn('IAP Init Error:', err.code, err.message);
    return false;
  }
};

export const getSubscriptions = async () => {
  try {
    const products = await IAP.getSubscriptions({ skus: productSkus });
    return products;
  } catch (err) {
    console.warn('IAP getSubscriptions Error:', err);
    return [];
  }
};

export const requestSubscription = async (sku, offerToken) => {
  try {
    let params;
    if (Platform.OS === 'ios') {
      params = { sku };
    } else {
      if (offerToken) {
        params = { sku, subscriptionOffers: [{ sku, offerToken }] };
      } else {
        // Fallback or older PBL requires skus array to prevent crash
        params = { skus: [sku] }; 
      }
    }
    const subscription = await IAP.requestSubscription(params);
    return subscription;
  } catch (err) {
    console.warn('IAP requestSubscription Error:', err);
    throw err;
  }
};

export const endIAP = async () => {
  try {
    await IAP.endConnection();
  } catch (err) {
    console.warn('IAP endConnection Error:', err);
  }
};

export const finishTransaction = async (purchase) => {
  try {
    return await IAP.finishTransaction({ purchase, isConsumable: false });
  } catch (err) {
    console.warn('IAP finishTransaction Error:', err);
  }
};
