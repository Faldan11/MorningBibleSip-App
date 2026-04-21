import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { purchasePremium, checkPremiumStatus, fetchSubscriptionDetails } from '../services/ads';

export default function PremiumPurchase() {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState('$1.99');
  const [offerToken, setOfferToken] = useState(null);

  useEffect(() => {
    const checkPremium = async () => {
      const premiumStatus = await checkPremiumStatus();
      setIsPremium(premiumStatus);
      
      if (!premiumStatus) {
        const details = await fetchSubscriptionDetails();
        if (details) {
          setSubscriptionPrice(details.price);
          setOfferToken(details.offerToken);
        }
      }
    };
    
    checkPremium();
  }, []);

  const handlePurchasePremium = async () => {
    if (isPremium) {
      Alert.alert('Premium Active', 'You already have premium access!');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await purchasePremium(offerToken);
      if (result.success) {
        setIsPremium(true);
        Alert.alert(
          'Purchase Successful',
          'Thank you for upgrading to Premium! You now enjoy an ad-free experience.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Purchase Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <View style={styles.premiumBanner}>
        <Text style={[styles.premiumText, { color: colors.primary }]}>
          Premium Active - Ad Free
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.upgradeBox, { backgroundColor: colors.primary }]}
      onPress={handlePurchasePremium}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View>
          <Text style={styles.upgradeTitle}>Remove Ads - Go Premium</Text>
          <Text style={styles.upgradePrice}>{subscriptionPrice}/month</Text>
          <Text style={styles.upgradeText}>Enjoy your Bible experience without interruptions</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  premiumBanner: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 10,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeBox: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  upgradePrice: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});