import { useAppSelector } from '@/lib/reduxStore/hooks';
import { useGetTenantProfile } from '@/services/mutation/tenantMutation';
import { RelativePathString, router } from 'expo-router';
import { buildImageUrl } from '@/util/imageUtils';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import TermsAndCondition from '@/assets/icons/terms_and_condition.svg';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { logoutUser } from '@/util/logoutUser';
import LanguageSelector from './LanguageSelector';

export default function ProfileIcon() {
  const [visible, setVisible] = useState(false);
  const restaurant = useAppSelector((state) => state.auth.restaurant);
  const tenantId = restaurant?.id;
  const { data: tenant, isLoading } = useGetTenantProfile(tenantId);
  const profileImageSource = useMemo(() => {
    const remote = buildImageUrl(tenant?.image);
    if (remote) {
      return { uri: remote };
    }
    return require('@/assets/images/avatar.jpg');
  }, [tenant?.image]);

  const handleLogout = async () => {
    await logoutUser();
  };
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const accountSettings = [
    {
      id: 2,
      label: 'Language',
      icon: 'language',
      action: () => {
        setShowLanguageModal(true);
        setVisible(false);
      },
    },
    { id: 3, label: 'Help and Support Setting', icon: 'help-outline' },
    {
      id: 4,
      label: 'Privacy Policy',
      icon: 'shield-outline',
      action: () =>
        Platform.OS === 'web'
          ? window.open('https://alpha.feed-intel.com/privacy/', '_blank')
          : router.push({
              pathname:
                '/(protected)/profile/WebPageView' as RelativePathString,
              params: {
                title: 'Privacy Policy',
                url: 'https://alpha.feed-intel.com/privacy/',
              },
            }),
    },
    {
      id: 5,
      label: 'Terms and Conditions',
      icon: 'description',
      action: () =>
        Platform.OS === 'web'
          ? window.open('https://alpha.feed-intel.com/terms/', '_blank')
          : router.push({
              pathname:
                '/(protected)/profile/WebPageView' as RelativePathString,
              params: {
                title: 'Terms and Conditions Setting',
                url: 'https://alpha.feed-intel.com/terms/',
              },
            }),
    },
    {
      id: 6,
      label: 'Log Out',
      icon: 'logout',
      action: handleLogout,
    },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      <View style={styles.menuContainer}>
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={item.action}
        >
          <View style={styles.menuItemContent}>
            {item.icon == 'description' && (
              <TermsAndCondition width={24} height={24} fill={'#2E18149E'} />
            )}
            {item.icon != 'shield-outline' && item.icon != 'description' && (
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color="#2E18149E"
              />
            )}
            {item.icon == 'shield-outline' && (
              <TouchableOpacity
                onPress={() =>
                  Platform.OS === 'web'
                    ? window.open(
                        'https://alpha.feed-intel.com/privacy/',
                        '_blank'
                      )
                    : router.push({
                        pathname:
                          '/(protected)/profile/WebPageView' as RelativePathString,
                        params: {
                          title: 'Terms and Conditions',
                          url: 'https://alpha.feed-intel.com/privacy/',
                        },
                      })
                }
              >
                <Ionicons name={item.icon as any} size={24} color="#2E18149E" />
              </TouchableOpacity>
            )}
            <Text style={styles.menuItemText}>{item.label}</Text>
          </View>
          {item.id !== 6 && (
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color="#b2b2b2"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setVisible(true)}
      >
        <Image source={profileImageSource} style={styles.profileImage} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable
            style={styles.dropdown}
            onPress={(e) => e.stopPropagation()}
          >
            <FlatList
              data={accountSettings}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              ListHeaderComponent={
                <View style={styles.profileHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setVisible(false);
                      router.push('/(protected)/profile');
                    }}
                    style={styles.profileImageContainer}
                  >
                    <Image
                      source={profileImageSource}
                      style={styles.profileImageLarge}
                    />
                    <View style={styles.editIcon}>
                      <MaterialIcons name="edit" size={20} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.restaurantName}>
                    {tenant?.restaurant_name || 'Restaurant name'}
                  </Text>
                </View>
              }
              ListHeaderComponentStyle={{
                justifyContent: 'center',
              }}
              // ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Pressable>
        </Pressable>
      </Modal>
      <LanguageSelector
        showLanguageModal={showLanguageModal}
        setShowLanguageModal={setShowLanguageModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#EE8429',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  dropdown: {
    width: 300,
    maxHeight: 400,
    backgroundColor: 'white',
    marginTop: 60,
    marginRight: 10,
    borderRadius: 12,
    padding: 10,
    elevation: 5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2d3436',
  },
  notificationItem: {
    paddingVertical: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#444',
  },
  time: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  restaurantName: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  footer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#91B275',
    fontWeight: '600',
  },
});
