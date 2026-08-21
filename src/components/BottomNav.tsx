import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type BottomNavProps = {
  onCameraPress?: () => void;
};

const tabs = [
  {
    label: 'Trang chủ',
    icon: 'home-outline',
    activeIcon: 'home',
    active: true,
  },
  {
    label: 'Ôn tập',
    icon: 'book-outline',
    activeIcon: 'book',
    active: false,
  },
  {
    label: 'Cộng đồng',
    icon: 'star-outline',
    activeIcon: 'star',
    active: false,
  },
  {
    label: 'Hồ sơ',
    icon: 'person-outline',
    activeIcon: 'person',
    active: false,
  },
];

const BottomNav: React.FC<BottomNavProps> = ({ onCameraPress }) => {
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <View style={styles.navWrap}>
      <View style={styles.tabRow}>
        {leftTabs.map(tab => (
          <TouchableOpacity
            key={tab.label}
            style={styles.tabItem}
            onPress={() => console.log(`Navigating to ${tab.label}`)}
          >
            <View style={[styles.iconCircle, tab.active && styles.iconActive]}>
              <Icon
                name={tab.active ? tab.activeIcon : tab.icon}
                size={20}
                style={[styles.iconText, tab.active && styles.iconTextActive]}
              />
            </View>
            <Text style={[styles.label, tab.active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCameraPress}
          style={styles.cameraItem}
        >
          <View style={styles.cameraCircle}>
            <Icon name="camera" size={20} style={styles.cameraIcon} />
          </View>
          <Text style={styles.label}>Quét</Text>
        </TouchableOpacity>

        {rightTabs.map(tab => (
          <TouchableOpacity
            key={tab.label}
            style={styles.tabItem}
            onPress={() => console.log(`Navigating to ${tab.label}`)}
          >
            <View style={[styles.iconCircle, tab.active && styles.iconActive]}>
              <Icon
                name={tab.active ? tab.activeIcon : tab.icon}
                size={20}
                style={[styles.iconText, tab.active && styles.iconTextActive]}
              />
            </View>
            <Text style={[styles.label, tab.active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#f3f4f6',
  },
  iconActive: {
    backgroundColor: '#1ca8ff',
  },
  iconText: {
    fontSize: 18,
    color: '#374151',
  },
  iconTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
  },
  labelActive: {
    color: '#1ca8ff',
    fontWeight: '700',
  },
  cameraItem: {
    alignItems: 'center',
    flex: 1,
  },
  cameraCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1ca8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#1ca8ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
});

export default BottomNav;
