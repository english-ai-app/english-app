import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type HeaderBarProps = {
  streakDays?: number;
  xp?: number;
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
};

const HeaderBar: React.FC<HeaderBarProps> = ({
  streakDays = 12,
  xp = 1250,
  onProfilePress,
  onNotificationsPress,
}) => {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.profileButton}
        onPress={onProfilePress}
      >
        <Icon name="person" size={18} color="#fff" />
      </TouchableOpacity>

      <View style={styles.headerRight}>
        <View style={[styles.statPill, styles.streakPill]}>
          <Icon name="flame" size={16} color="#f97316" />
          <View>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>Ngày</Text>
          </View>
        </View>

        <View style={[styles.statPill, styles.xpPill]}>
          <Icon name="flash" size={16} color="#eab308" />
          <View>
            <Text style={styles.statValue}>{xp.toLocaleString('en-US')}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.notificationButton}
          onPress={onNotificationsPress}
        >
          <Icon name="notifications-outline" size={21} color="#334155" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60a5fa',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    height: 38,
    minWidth: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 11,
    backgroundColor: '#fff',
  },
  streakPill: {
    borderColor: '#fed7aa',
  },
  xpPill: {
    borderColor: '#fde68a',
  },
  statValue: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 14,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
});

export default HeaderBar;
