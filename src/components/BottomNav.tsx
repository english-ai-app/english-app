import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export type BottomTabKey = 'home' | 'review' | 'course' | 'community';

type BottomNavProps = {
  activeTab?: BottomTabKey | null;
  addActive?: boolean;
  onAddPress?: () => void;
  onTabPress?: (tab: BottomTabKey) => void;
};

const tabs = [
  {
    key: 'home',
    label: 'Trang chủ',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    key: 'review',
    label: 'Ôn tập',
    icon: 'book-outline',
    activeIcon: 'book',
  },
  {
    key: 'course',
    label: 'Khóa học',
    icon: 'school-outline',
    activeIcon: 'school',
  },
  {
    key: 'community',
    label: 'Cộng đồng',
    icon: 'people-outline',
    activeIcon: 'people',
  },
] as const;

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'home',
  addActive = false,
  onAddPress,
  onTabPress,
}) => {
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  const renderTab = (tab: (typeof tabs)[number]) => {
    const active = !addActive && activeTab === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        style={styles.tabItem}
        onPress={() => onTabPress?.(tab.key)}
      >
        <View style={[styles.iconCircle, active && styles.iconActive]}>
          <Icon
            name={active ? tab.activeIcon : tab.icon}
            size={20}
            style={[styles.iconText, active && styles.iconTextActive]}
          />
        </View>
        <Text style={[styles.label, active && styles.labelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.navWrap}>
      <View style={styles.tabRow}>
        {leftTabs.map(renderTab)}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onAddPress}
          style={styles.tabItem}
        >
          <View style={[styles.iconCircle, addActive && styles.iconActive]}>
            <Icon
              name={addActive ? 'add' : 'add-outline'}
              size={20}
              style={[styles.iconText, addActive && styles.iconTextActive]}
            />
          </View>
          <Text style={[styles.label, addActive && styles.labelActive]}>
            Thêm
          </Text>
        </TouchableOpacity>

        {rightTabs.map(renderTab)}
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
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#6b7280',
    fontSize: 11,
  },
  labelActive: {
    color: '#1ca8ff',
    fontWeight: '700',
  },
});

export default BottomNav;
