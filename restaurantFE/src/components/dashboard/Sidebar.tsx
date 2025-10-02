import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text, Icon } from 'react-native-paper'; // Using Icon from react-native-paper
import { router, usePathname } from 'expo-router'; // Assuming expo-router is configured, added usePathname
import { useResponsive } from '@/hooks/useResponsive';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';

// Define the structure for a menu link
interface Link {
  name: string;
  route: string;
  icon: string; // Icon name string compatible with react-native-paper Icon
}

const Sidebar: React.FC = () => {
  const { isBranch } = useRestaurantIdentity();

  // Define the menu links exactly as seen in the image
  const links: Link[] = [
    {
      name: 'Dashboard',
      route: '/(protected)/dashboard',
      icon: 'view-dashboard-outline',
    },
    {
      name: 'Orders',
      route: '/(protected)/orders',
      icon: 'clipboard-text-outline',
    },
    {
      name: 'Menu',
      route: '/(protected)/menus',
      icon: 'silverware-fork-knife',
    },
    {
      name: 'Discount',
      route: '/(protected)/discounts',
      icon: 'label-percent-outline',
    },
    {
      name: 'Branch',
      route: '/(protected)/branches',
      icon: 'map-marker-outline',
    },
    { name: 'Tables', route: '/(protected)/tables', icon: 'table-chair' },
    {
      name: 'Administration',
      route: '/(protected)/admins',
      icon: 'account-tie-outline',
    },
    {
      name: 'Profile',
      route: '/(protected)/profile',
      icon: 'account-circle-outline',
    },
  ];

  const visibleLinks = isBranch
    ? links.filter((link) => !['Branch', 'Administration'].includes(link.name))
    : links;

  // State to manage the active link
  const [activeLink, setActiveLink] = useState<string>(
    '/(protected)/dashboard'
  ); // Default active to Tables, as per image

  // Get the current pathname using usePathname hook
  const currentPathname = usePathname();

  // Update active link based on current route
  useEffect(() => {
    // Use currentPathname from usePathname hook
    const foundLink = links.find((link) =>
      currentPathname.includes(link.route)
    );
    if (foundLink) {
      setActiveLink(foundLink.route);
    }
  }, [currentPathname]); // Re-run when the pathname changes

  const { isTablet } = useResponsive();

  return (
    <View
      style={[
        sidebarStyles.sidebar,
        isTablet ? sidebarStyles.sidebarTablet : sidebarStyles.sidebarMobile,
      ]}
    >
      {/* Menu Items */}
      <ScrollView style={sidebarStyles.menu}>
        {visibleLinks.map((item: Link) => (
          <TouchableOpacity
            key={item.name}
            style={[
              sidebarStyles.menuItem,
              activeLink === item.route && sidebarStyles.activeMenuItem, // Apply active style
            ]}
            onPress={() => {
              setActiveLink(item.route); // Set active link on press
              router.push(item.route as any); // Navigate to the route
            }}
          >
            <Icon
              source={item.icon} // Use 'source' prop for react-native-paper Icon
              size={24}
              color={activeLink === item.route ? '#3F522E' : '#555'} // Green for active, grey for inactive
            />
            {/* <Text
              style={[
                sidebarStyles.menuItemText,
                activeLink === item.route && sidebarStyles.activeMenuItemText, // Apply active text style
              ]}
            >
              {item.name}
            </Text> */}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Styles for the Sidebar
const sidebarStyles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#EFF4EB',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }),
  },
  sidebarMobile: {
    width: 100,
  },
  sidebarTablet: {
    width: 100,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50', // Green color for MINMIN logo
    marginBottom: 30,
    textAlign: 'center',
  },
  menu: {
    flex: 1, // Allows menu to take available space
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  activeMenuItem: {
    backgroundColor: '#e8f5e9', // Light green background for active item
  },
  activeMenuItemText: {
    fontWeight: 'bold',
    color: '#3F522E', // Green text for active item
  },
});

export default Sidebar;
