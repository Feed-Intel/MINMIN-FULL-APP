import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Divider,
  Snackbar,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  useGetTenantProfile,
  useTopMenuItems,
  useUpdateTenantProfile,
  useUpdateTenantProfileImage,
} from '@/services/mutation/tenantMutation';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { base64ToBlob, buildImageUrl } from '@/util/imageUtils';
import { logoutUser } from '@/util/logoutUser';
import LanguageSelector from '@/components/LanguageSelector';
import PostGallery from '@/components/PostGallery';
import AddPostModal from '@/components/UploadPostImage';
import CustomerFeedback from '@/components/CustomerFeedback';
import { i18n as I18n } from '@/app/_layout';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';

const LANGUAGE_STORAGE_KEY = 'restaurant-language-preference';
const PRIVACY_POLICY_URL = 'https://stg.api.feed-intel.com/privacy/';
const TERMS_URL = 'https://stg.api.feed-intel.com/terms/';

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  try {
    return new Intl.NumberFormat().format(value);
  } catch {
    return `${value}`;
  }
};

type AccountSetting = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
};

type TopMenuItem = {
  id?: string;
  name?: string;
  image?: string | null;
  count?: number;
};

const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 960;
  const queryClient = useQueryClient();

  const restaurant = useAppSelector((state) => state.auth.restaurant);
  const tenantId = restaurant?.id;
  const userEmail = restaurant?.email;
  const branchName = restaurant?.branch;
  const { isBranch } = useRestaurantIdentity();
  const { data: tenant, isLoading } = useGetTenantProfile(tenantId);
  const { data: topMenuItems, isLoading: isLoadingTopItems } =
    useTopMenuItems();

  const { mutate: updateProfile, isPending: isSavingProfile } =
    useUpdateTenantProfile();
  const { mutate: updateProfileImage, isPending: isUploadingImage } =
    useUpdateTenantProfileImage();

  const [localImage, setLocalImage] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [profile, setProfile] = useState('');
  const [maxDiscount, setMaxDiscount] = useState<number | null>(null);
  const [chapaPaymentApiKey, setChapaPaymentApiKey] = useState('');
  const [chapaPaymentPublicKey, setChapaPaymentPublicKey] = useState('');
  const [taxPercentage, setTaxPercentage] = useState<number | null>(null);
  const [serviceChargePercentage, setServiceChargePercentage] = useState<
    number | null
  >(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'am'>('en');
  const [activeTab, setActiveTab] = useState<string>(
    I18n.t('profile.tab_business_detail')
  );
  const [addPost, setAddPost] = useState<boolean>(false);

  useEffect(() => {
    if (isBranch) {
      router.replace('/(protected)/dashboard');
    }
  }, [isBranch]);

  useEffect(() => {
    if (tenant) {
      setRestaurantName(tenant.restaurant_name ?? '');
      setProfile(tenant.profile ?? '');
      setLocalImage(tenant.image ?? null);
      setMaxDiscount(
        tenant.max_discount_limit === undefined
          ? null
          : Number(tenant.max_discount_limit)
      );
      setChapaPaymentApiKey(tenant.CHAPA_API_KEY ?? '');
      setChapaPaymentPublicKey(tenant.CHAPA_PUBLIC_KEY ?? '');
      setTaxPercentage(
        tenant.tax === undefined ? null : Number(tenant.tax ?? 0)
      );
      setServiceChargePercentage(
        tenant.service_charge === undefined
          ? null
          : Number(tenant.service_charge ?? 0)
      );
    }
  }, [tenant]);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((value) => {
      if (value === 'en' || value === 'am') {
        setSelectedLanguage(value);
      }
    });
  }, []);

  const profileImageSource = useMemo(() => {
    if (localImage) {
      return { uri: localImage };
    }

    const remote = buildImageUrl(tenant?.image);
    if (remote) {
      return { uri: remote };
    }

    return require('@/assets/images/avatar.jpg');
  }, [localImage, tenant?.image]);

  const topItems: TopMenuItem[] = useMemo(() => {
    if (!topMenuItems || !Array.isArray(topMenuItems)) {
      return [];
    }
    return topMenuItems;
  }, [topMenuItems]);

  const quickStats = useMemo(
    () => [
      {
        key: 'discount',
        label: I18n.t('profile.stat_max_discount_label'),
        value:
          maxDiscount === null || Number.isNaN(maxDiscount)
            ? '--'
            : `${maxDiscount}%`,
        icon: 'tag-outline',
      },
      {
        key: 'tax',
        label: I18n.t('profile.stat_tax_label'),
        value:
          taxPercentage === null || Number.isNaN(taxPercentage)
            ? '--'
            : `${taxPercentage}%`,
        icon: 'chart-pie',
      },
      {
        key: 'service',
        label: I18n.t('profile.stat_service_charge_label'),
        value:
          serviceChargePercentage === null ||
          Number.isNaN(serviceChargePercentage)
            ? '--'
            : `${serviceChargePercentage}%`,
        icon: 'credit-card-outline',
      },
    ],
    [maxDiscount, taxPercentage, serviceChargePercentage]
  );

  const openExternalLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length || !tenantId) {
      return;
    }

    const asset = result.assets[0];
    setLocalImage(asset.uri);

    const formData = new FormData();
    const mimeType = asset.mimeType || asset.type || 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    const fileName = asset.fileName || `profile.${extension}`;

    formData.append('id', tenantId);

    if (Platform.OS === 'web') {
      const blob = base64ToBlob(asset.uri, mimeType);
      formData.append('image', new File([blob], fileName, { type: mimeType }));
    } else {
      formData.append('image', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    updateProfileImage(formData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenantProfile'] });
        setSnackbarMessage(I18n.t('profile.snackbar_profile_pic_updated'));
      },
      onError: () => {
        setSnackbarMessage(
          I18n.t('profile.snackbar_profile_pic_update_failed')
        );
      },
    });
  };

  const handleUpdateProfile = () => {
    if (!tenantId) {
      return;
    }

    updateProfile(
      {
        id: tenantId,
        restaurant_name: restaurantName,
        profile,
        max_discount_limit: maxDiscount ?? undefined,
        CHAPA_API_KEY: chapaPaymentApiKey,
        CHAPA_PUBLIC_KEY: chapaPaymentPublicKey,
        tax: taxPercentage ?? undefined,
        service_charge: serviceChargePercentage ?? undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tenantProfile'] });
          setSnackbarMessage(I18n.t('profile.snackbar_profile_saved'));
        },
        onError: () => {
          setSnackbarMessage(I18n.t('profile.snackbar_profile_save_failed'));
        },
      }
    );
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const accountSettings: AccountSetting[] = [
    {
      key: 'language',
      label: I18n.t('profile.setting_language'),
      icon: 'translate',
      onPress: () => setShowLanguageModal(true),
    },
    {
      key: 'support',
      label: I18n.t('profile.setting_support'),
      icon: 'lifebuoy',
      onPress: () => {},
    },
    {
      key: 'privacy',
      label: I18n.t('profile.setting_privacy_policy'),
      icon: 'shield-check-outline',
      onPress: () => openExternalLink(PRIVACY_POLICY_URL),
    },
    {
      key: 'terms',
      label: I18n.t('profile.setting_terms_conditions'),
      icon: 'file-document-outline',
      onPress: () => openExternalLink(TERMS_URL),
    },
    {
      key: 'logout',
      label: I18n.t('profile.setting_logout'),
      icon: 'logout',
      destructive: true,
      showChevron: false,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title={I18n.t('profile.header_title')}
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !tenant ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            <Card style={[styles.sectionCard, styles.profileCard]}>
              <Card.Content
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={[
                    styles.profileRow,
                    isCompact && styles.profileRowCompact,
                  ]}
                >
                  <View style={styles.profileImageColumn}>
                    <TouchableOpacity
                      onPress={pickImage}
                      style={styles.profileImageButton}
                      disabled={isUploadingImage}
                    >
                      <Image
                        source={profileImageSource}
                        style={styles.profileImage}
                      />
                      <View style={styles.editIcon}>
                        <MaterialIcons name="edit" size={18} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                    <Button
                      mode="outlined"
                      onPress={pickImage}
                      style={styles.changePhotoButton}
                      loading={isUploadingImage}
                      disabled={isUploadingImage}
                    >
                      {I18n.t('profile.change_photo_button')}
                    </Button>
                  </View>

                  <View
                    style={[
                      styles.profileDetails,
                      isCompact && styles.profileDetailsCompact,
                    ]}
                  >
                    <Text style={styles.profileName} numberOfLines={1}>
                      {restaurantName ||
                        tenant?.restaurant_name ||
                        I18n.t('profile.default_restaurant_name')}
                    </Text>
                    {userEmail ? (
                      <Text style={styles.profileMeta}>{userEmail}</Text>
                    ) : null}
                    {branchName ? (
                      <Text style={styles.profileMeta}>
                        {I18n.t('profile.branch_label', { branchName })}
                      </Text>
                    ) : null}
                    {profile ? (
                      <Text style={styles.profileDescription}>{profile}</Text>
                    ) : null}

                    <View style={styles.statsRow}>
                      {quickStats.map((stat) => (
                        <View key={stat.key} style={styles.statPill}>
                          <MaterialCommunityIcons
                            name={stat.icon as any}
                            size={18}
                            color="#91B275"
                          />
                          <View style={styles.statCopy}>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                {activeTab == I18n.t('profile.tab_posts') && (
                  <Button
                    icon="plus"
                    style={{
                      backgroundColor: '#91B275',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      alignSelf: 'center',
                    }}
                    labelStyle={{
                      color: '#fff',
                    }}
                    onPress={() => setAddPost(true)}
                  >
                    {I18n.t('profile.add_posts_button')}
                  </Button>
                )}
              </Card.Content>
            </Card>
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <View style={styles.tabGroup}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === I18n.t('profile.tab_business_detail') &&
                      styles.activeTab,
                  ]}
                  onPress={() =>
                    setActiveTab(I18n.t('profile.tab_business_detail'))
                  }
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === I18n.t('profile.tab_business_detail') &&
                        styles.activeTabLabel,
                    ]}
                  >
                    {I18n.t('profile.tab_business_detail')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === I18n.t('profile.tab_posts') &&
                      styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(I18n.t('profile.tab_posts'))}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === I18n.t('profile.tab_posts') &&
                        styles.activeTabLabel,
                    ]}
                  >
                    {I18n.t('profile.tab_posts')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === I18n.t('profile.tab_customer_feedback') &&
                      styles.activeTab,
                  ]}
                  onPress={() =>
                    setActiveTab(I18n.t('profile.tab_customer_feedback'))
                  }
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === I18n.t('profile.tab_customer_feedback') &&
                        styles.activeTabLabel,
                    ]}
                  >
                    {I18n.t('profile.tab_customer_feedback')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{activeTab}</Text>
                  <Ionicons
                    name="storefront-outline"
                    size={22}
                    color="#91B275"
                  />
                </View>
                {activeTab == I18n.t('profile.tab_business_detail') && (
                  <View style={styles.inputGroup}>
                    <TextInput
                      placeholder={I18n.t(
                        'profile.input_placeholder_restaurant_name'
                      )}
                      value={restaurantName}
                      onChangeText={setRestaurantName}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder={I18n.t(
                        'profile.input_placeholder_profile_description'
                      )}
                      value={profile}
                      onChangeText={setProfile}
                      multiline
                      numberOfLines={4}
                      style={[styles.input, styles.textArea]}
                    />
                  </View>
                )}
              </Card.Content>
            </Card>
            {activeTab == I18n.t('profile.tab_business_detail') && (
              <>
                <Card style={styles.sectionCard}>
                  <Card.Content>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {I18n.t('profile.section_title_financial_payments')}
                      </Text>
                      <Ionicons
                        name="wallet-outline"
                        size={22}
                        color="#91B275"
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <TextInput
                        placeholder={I18n.t(
                          'profile.input_placeholder_chapa_api_key'
                        )}
                        value={chapaPaymentApiKey}
                        onChangeText={setChapaPaymentApiKey}
                        style={styles.input}
                      />
                      <TextInput
                        placeholder={I18n.t(
                          'profile.input_placeholder_chapa_public_key'
                        )}
                        value={chapaPaymentPublicKey}
                        onChangeText={setChapaPaymentPublicKey}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <TextInput
                        placeholder={I18n.t(
                          'profile.input_placeholder_tax_percentage'
                        )}
                        value={taxPercentage?.toString() ?? ''}
                        onChangeText={(text) => {
                          if (
                            (text.match(/^[0-9\S]+$/) &&
                              Number(text) <= 100 &&
                              Number(text) >= 0) ||
                            text === ''
                          ) {
                            setTaxPercentage(text ? Number(text) : null);
                          }
                        }}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                      <TextInput
                        placeholder={I18n.t(
                          'profile.input_placeholder_service_charge_percentage'
                        )}
                        value={serviceChargePercentage?.toString() ?? ''}
                        onChangeText={(text) => {
                          if (
                            (text.match(/^[0-9\S]+$/) &&
                              Number(text) <= 100 &&
                              Number(text) >= 0) ||
                            text === ''
                          ) {
                            setServiceChargePercentage(
                              text ? Number(text) : null
                            );
                          }
                        }}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>

                    <TextInput
                      placeholder={I18n.t(
                        'profile.input_placeholder_max_discount'
                      )}
                      value={maxDiscount?.toString() ?? ''}
                      onChangeText={(text) => {
                        if (
                          (text.match(/^[0-9\S]+$/) &&
                            Number(text) <= 100 &&
                            Number(text) >= 0) ||
                          text === ''
                        ) {
                          setMaxDiscount(text ? Number(text) : null);
                        }
                      }}
                      keyboardType="numeric"
                      style={styles.input}
                    />

                    <Button
                      mode="contained"
                      onPress={handleUpdateProfile}
                      style={styles.saveButton}
                      contentStyle={styles.saveButtonContent}
                      loading={isSavingProfile}
                      disabled={isSavingProfile}
                    >
                      {I18n.t('profile.save_changes_button')}
                    </Button>
                  </Card.Content>
                </Card>

                <Card style={styles.sectionCard}>
                  <Card.Content>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {I18n.t('profile.section_title_top_items')}
                      </Text>
                      <Ionicons
                        name="trending-up-outline"
                        size={22}
                        color="#91B275"
                      />
                    </View>

                    {isLoadingTopItems ? (
                      <ActivityIndicator size="small" />
                    ) : topItems.length ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.topItemsRow}
                      >
                        {topItems.map((item) => (
                          <View
                            key={item.id || item.name}
                            style={styles.topItemCard}
                          >
                            {item.image ? (
                              <Image
                                source={{
                                  uri: buildImageUrl(item.image) ?? item.image,
                                }}
                                style={styles.topItemImage}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.topItemImage,
                                  styles.topItemPlaceholder,
                                ]}
                              >
                                <Ionicons
                                  name="fast-food-outline"
                                  size={26}
                                  color="#91B275"
                                />
                              </View>
                            )}
                            <Text style={styles.topItemName} numberOfLines={1}>
                              {item.name ||
                                I18n.t('profile.top_item_default_name')}
                            </Text>
                            <Text style={styles.topItemMeta}>
                              {I18n.t('profile.top_item_orders_meta', {
                                count: parseInt(formatNumber(item.count)),
                              })}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.emptyStateText}>
                        {I18n.t('profile.top_items_empty_state')}
                      </Text>
                    )}
                  </Card.Content>
                </Card>

                <Card style={styles.sectionCard}>
                  <Card.Content>
                    <Text style={styles.sectionTitle}>
                      {I18n.t('profile.section_title_account_settings')}
                    </Text>
                    <Divider style={styles.settingsDivider} />
                    {accountSettings.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.settingRow}
                        onPress={item.onPress}
                      >
                        <View style={styles.settingLeft}>
                          <MaterialCommunityIcons
                            name={item.icon as any}
                            size={22}
                            color={item.destructive ? '#D64323' : '#2E3A24'}
                          />
                          <Text
                            style={[
                              styles.settingLabel,
                              item.destructive && styles.destructiveSetting,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>

                        {item.key === 'language' ? (
                          <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>
                              {selectedLanguage === 'en'
                                ? I18n.t('profile.language_english')
                                : I18n.t('profile.language_amharic')}
                            </Text>
                            <MaterialIcons
                              name="keyboard-arrow-right"
                              size={24}
                              color="#9AA79A"
                            />
                          </View>
                        ) : item.showChevron === false ? null : (
                          <MaterialIcons
                            name="keyboard-arrow-right"
                            size={24}
                            color="#9AA79A"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </Card.Content>
                </Card>
              </>
            )}
            {activeTab == I18n.t('profile.tab_posts') && (
              <PostGallery onAddPost={() => setAddPost(true)} />
            )}
            {activeTab == I18n.t('profile.tab_customer_feedback') && (
              <CustomerFeedback />
            )}
          </>
        )}
      </ScrollView>
      <LanguageSelector
        showLanguageModal={showLanguageModal}
        setShowLanguageModal={setShowLanguageModal}
      />
      <AddPostModal visible={addPost} onDismiss={() => setAddPost(false)} />
      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFF4EB',
  },
  header: {
    backgroundColor: '#EFF4EB',
    borderBottomColor: '#D9E5D5',
    borderBottomWidth: 1,
    elevation: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2E3A24',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: '#D2DEC400',
    shadowColor: '#00000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'web' ? 0 : 0.08,
    shadowRadius: 10,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  profileCard: {
    paddingVertical: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  profileRowCompact: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  profileImageColumn: {
    alignItems: 'center',
  },
  profileImageButton: {
    position: 'relative',
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#EE8429',
    borderRadius: 12,
    padding: 4,
  },
  changePhotoButton: {
    marginTop: 12,
    borderRadius: 20,
  },
  profileDetails: {
    flex: 1,
    gap: 8,
  },
  profileDetailsCompact: {
    alignItems: 'center',
    textAlign: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E3A24',
  },
  profileMeta: {
    fontSize: 14,
    color: '#5A6E49',
  },
  profileDescription: {
    fontSize: 14,
    color: '#4B4F44',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F8EF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  statCopy: {
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#5A6E49',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A24',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A24',
  },
  inputGroup: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  input: {
    flex: 1,
    minWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#C7D3C1',
    borderRadius: 10,
    fontSize: 16,
    color: '#2E3A24',
    backgroundColor: '#91B27517',
  },
  textArea: {
    minHeight: 110,
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#91B275',
  },
  saveButtonContent: {
    height: 52,
  },
  topItemsRow: {
    gap: 16,
  },
  topItemCard: {
    width: 140,
    borderRadius: 12,
    backgroundColor: '#F8FBF5',
    padding: 12,
    gap: 10,
    alignItems: 'center',
  },
  topItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E8F2E0',
  },
  topItemPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E3A24',
  },
  topItemMeta: {
    fontSize: 12,
    color: '#5A6E49',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#68795B',
  },
  settingsDivider: {
    marginVertical: 12,
    backgroundColor: '#E4EDE0',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2E3A24',
  },
  destructiveSetting: {
    color: '#D64323',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#5A6E49',
  },
  tabContainer: {
    borderColor: '#5E6E4933',
    borderBottomWidth: 1,
  },
  tabGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderRadius: 6,
    padding: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#96B76E',
  },
  tabLabel: {
    color: '#8D8D8D',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#96B76E',
  },
  snackbar: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#3F522E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A24',
    marginBottom: 16,
  },
  dialog: {
    borderRadius: 12,
    backgroundColor: '#EFF4EB',
    width: 500,
    alignSelf: 'center',
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EDE0',
    marginBottom: 12,
  },
  languageOptionActive: {
    backgroundColor: '#F3F8EF',
    borderColor: '#91B275',
  },
  languageOptionLabel: {
    fontSize: 16,
    color: '#2E3A24',
  },
  languageOptionLabelActive: {
    color: '#3F522E',
    fontWeight: '600',
  },
  modalCloseButton: {
    alignSelf: 'center',
    marginTop: 4,
  },
});

export default ProfileScreen;
