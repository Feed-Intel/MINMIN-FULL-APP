import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Slot } from 'expo-router';
import { Surface } from 'react-native-paper';
import Sidebar from '@/components/dashboard/Sidebar';
import { router } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWebSockets } from '@/hooks/useWebSockets';
import { useDispatch, useSelector } from 'react-redux';
import { setRestaurant } from '@/lib/reduxStore/authSlice';
import Logo from '@/assets/icons/Logo.svg';
import NotificationIcon from '@/components/Notification';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { RootState } from '@/lib/reduxStore/store';
import ProfileIcon from '@/components/ProfileIcon';
import TimeProvider from '@/context/time';
import { i18n } from '@/app/_layout';

export default function ProtectedLayout() {
  const dispatch = useDispatch();
  const notifications = useAppSelector(
    (state: RootState) => state.notifications.items
  );
  const currentLocale = useSelector(
    (state: RootState) => state.language.locale
  );

  useWebSockets();

  async function checkAuth() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      router.replace('/(auth)');
    } else {
      const decodedToken = jwtDecode<JwtPayload>(refreshToken);
      if (Date.now() >= Number(decodedToken.exp) * 1000) {
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('accessToken');
        router.replace('/(auth)');
        return;
      }

      const decodedPayload = jwtDecode<
        {
          tenant: string;
          user_type: string;
          email: string;
          branch?: string;
        } & JwtPayload
      >(refreshToken);

      dispatch(
        setRestaurant({
          id: decodedPayload.tenant,
          user_type: decodedPayload.user_type,
          email: decodedPayload.email,
          branch: decodedPayload.branch,
        })
      );
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentLocale) {
      i18n.locale = currentLocale;
    }
  }, [currentLocale]);

  return (
    <TimeProvider>
      <Surface style={styles.container}>
        <View
          style={{
            paddingHorizontal: 30,
            borderBottomColor: '#5A6E4933',
            borderBottomWidth: 1.5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => router.replace('/(protected)/dashboard')}
          >
            <Logo height={60} color={'#91B275'} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationIcon notification={notifications} />
            <ProfileIcon />
          </View>
        </View>
        <View style={styles.horizontal}>
          <Sidebar />
          <View style={styles.stackContainer}>
            <Slot />
          </View>
        </View>
      </Surface>
    </TimeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#EFF4EB',
    height: '100%',
    width: '100%',
  },
  horizontal: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EFF4EB',
  },
  stackContainer: {
    flex: 1,
    backgroundColor: '#EFF4EB',
  },
});
