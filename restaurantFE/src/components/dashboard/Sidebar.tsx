import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router, usePathname } from 'expo-router';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '@/hooks/useResponsive';
import { i18n as I18n } from '@/app/_layout';

// Define the structure for a menu link
interface Link {
  name: string;
  route: string;
  icon: string; // Icon name string compatible with react-native-paper Icon
}

const Sidebar: React.FC = () => {
  const { isBranch } = useRestaurantIdentity();
  const { isTablet } = useResponsive(); // or whatever your hook provides

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
    { name: 'Loyalty', route: '/(protected)/loyalty', icon: 'star-outline' },
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
    ? links.filter(
        (link) =>
          !['Branch', 'Administration', 'Loyalty', 'Profile'].includes(
            link.name
          )
      )
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

  // NOTE: isTablet is not used for width anymore, replaced by 'isOpen' prop for explicit control
  // const { isTablet } = useResponsive();

  // Calculate sidebar width based on isOpen prop
  const sidebarWidthStyle = isTablet
    ? sidebarStyles.sidebarOpen // e.g., wider style for open
    : sidebarStyles.sidebarClosed; // e.g., narrower style for closed

  return (
    <View
      style={[
        sidebarStyles.sidebar,
        sidebarWidthStyle, // Apply the width based on isOpen
      ]}
    >
      {/* Menu Items */}
      <ScrollView style={sidebarStyles.menu}>
        {visibleLinks.map((item: Link) => (
          <TouchableOpacity
            key={item.name}
            style={[
              sidebarStyles.menuItem,
              // Adjust padding/layout when sidebar is closed for better alignment
              !isTablet && sidebarStyles.menuItemClosed,
              activeLink === item.route && sidebarStyles.activeMenuItem, // Apply active style
            ]}
            onPress={() => {
              setActiveLink(item.route); // Set active link on press
              router.push(item.route as any); // Navigate to the route
            }}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={activeLink === item.route ? '#3F522E' : '#555'}
            />
            {isTablet && (
              <Text
                style={[
                  sidebarStyles.menuItemText,
                  activeLink === item.route && sidebarStyles.activeMenuItemText,
                ]}
              >
                {I18n.t(`Sidebar.${item.name}`)}
              </Text>
            )}
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
    // Adjust padding to accommodate both states, or use conditional padding
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    // ... platform specific shadows
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
  // New styles for open/closed state widths
  sidebarOpen: {
    width: 200, // Example width when open/expanded
  },
  sidebarClosed: {
    width: 80, // Example width when closed/collapsed, enough for just the icon
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
  // Style adjustment for closed state to center the icon horizontally
  menuItemClosed: {
    justifyContent: 'center',
    paddingHorizontal: 5, // Reduce horizontal padding in closed state
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
