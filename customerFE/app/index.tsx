import { useEffect, useState } from 'react';
import { Redirect, Slot } from 'expo-router';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { setLocation } from '@/lib/reduxStore/locationSlice';
import { useDispatch } from 'react-redux';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { useAuth } from '@/context/auth';

export default function OnboardingPage() {
  const isConnected = useNetworkStatus();
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    // Hide splash screen after 3 seconds (adjust as needed)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3000 milliseconds = 3 seconds

    return () => clearTimeout(timer); // Cleanup the timer
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      dispatch(setLocation({ latitude, longitude }));
    } catch (error) {
      // console.error("Error getting location:", error);
      // Handle location error as needed
    }
  };

  useEffect(() => {
    getLocation();
  }, [isConnected]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('@/assets/images/splash-screen.png')} // Replace with your image path
          style={styles.splashImage}
          resizeMode="cover" // Cover the whole screen
        />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={{ backgroundColor: '#ff4444', padding: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>
          No internet connection
        </Text>
      </View>
    );
  }

  if (!Boolean(user?.id)) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(protected)/feed" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Or your desired background color
  },
  splashImage: {
    flex: 1,
    width: '100%',
  },
});
