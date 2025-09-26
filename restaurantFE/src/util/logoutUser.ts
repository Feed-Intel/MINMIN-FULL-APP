import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function logoutUser() {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
  router.replace('/(auth)');
}
