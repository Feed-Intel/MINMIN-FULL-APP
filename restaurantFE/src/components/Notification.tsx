import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import Notification from '@/assets/icons/Notification.svg';
import { Notification as NotificationType } from '@/lib/reduxStore/notificationSlice';
import { i18n as I18n } from '@/app/_layout';

export default function NotificationIcon({
  notification = [],
}: {
  notification: NotificationType[];
}) {
  const [visible, setVisible] = useState(false);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setVisible(true)}
      >
        <Notification height={24} color={'#2E19149E'} />
        {notification.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notification.length}</Text>
          </View>
        )}
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
              data={notification}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListFooterComponent={
                <TouchableOpacity style={styles.footer}>
                  <Text style={styles.footerText}>
                    {I18n.t('Common.see_more')}
                  </Text>
                </TouchableOpacity>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
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
