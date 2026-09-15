import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomNav, { BottomTabKey } from '../components/BottomNav';
import { AppScreenKey } from './HomeScreen';

const mascotImage = require('../assets/images/logo/hello.png');

type ProfileScreenProps = {
  onBack?: () => void;
  onLogout?: () => void;
  onOpenAddWord?: () => void;
  onNavigate?: (screen: AppScreenKey) => void;
};

type StatCardProps = {
  icon: string;
  color: string;
  backgroundColor: string;
  value: string;
  label: string;
  subLabel: string;
};

type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
};

const stats: StatCardProps[] = [
  {
    icon: 'flame',
    color: '#ff6b21',
    backgroundColor: '#fff0e8',
    value: '12',
    label: 'Streak',
    subLabel: 'ngày',
  },
  {
    icon: 'flash',
    color: '#159cff',
    backgroundColor: '#eaf6ff',
    value: '1,250',
    label: 'XP',
    subLabel: 'Tổng điểm',
  },
  {
    icon: 'trophy',
    color: '#f2a300',
    backgroundColor: '#fff7de',
    value: '8',
    label: 'Thành tích',
    subLabel: 'đã mở khóa',
  },
  {
    icon: 'ribbon',
    color: '#9257ef',
    backgroundColor: '#f1eaff',
    value: '12',
    label: 'Huy hiệu',
    subLabel: 'cá nhân',
  },
];

const achievements = [
  {
    icon: 'book',
    title: 'First Lesson',
    subtitle: 'Hoàn thành bài học đầu tiên',
    color: '#ffb92e',
  },
  {
    icon: 'calendar',
    title: '7-Day Streak',
    subtitle: 'Học liên tiếp 7 ngày',
    color: '#51c242',
  },
  {
    icon: 'camera',
    title: 'Photo Learner',
    subtitle: 'Học 10 từ qua hình ảnh',
    color: '#8a55f5',
  },
];

const accountRows: SettingRowProps[] = [
  { icon: 'person-outline', label: 'Thông tin cá nhân' },
  { icon: 'lock-closed-outline', label: 'Đổi mật khẩu' },
  { icon: 'mail-outline', label: 'Email', value: 'nguyenminh@gmail.com' },
  { icon: 'call-outline', label: 'Số điện thoại', value: 'Chưa liên kết' },
  { icon: 'shield-checkmark-outline', label: 'Liên kết tài khoản' },
];

const appRows: SettingRowProps[] = [
  { icon: 'globe-outline', label: 'Ngôn ngữ', value: 'Tiếng Việt' },
  { icon: 'notifications-outline', label: 'Thông báo' },
  { icon: 'moon-outline', label: 'Giao diện', value: 'Sáng' },
  { icon: 'download-outline', label: 'Tải dữ liệu' },
];

const supportRows: SettingRowProps[] = [
  { icon: 'help-circle-outline', label: 'Trung tâm trợ giúp' },
  { icon: 'chatbox-ellipses-outline', label: 'Phản hồi' },
  { icon: 'document-text-outline', label: 'Điều khoản dịch vụ' },
  { icon: 'shield-outline', label: 'Chính sách quyền riêng tư' },
];

const StatCard: React.FC<StatCardProps> = ({
  icon,
  color,
  backgroundColor,
  value,
  label,
  subLabel,
}) => (
  <View style={[styles.statCard, { backgroundColor }]}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statSubLabel}>{subLabel}</Text>
  </View>
);

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, value }) => (
  <TouchableOpacity activeOpacity={0.82} style={styles.settingRow}>
    <View style={styles.settingLeft}>
      <Icon name={icon} size={20} color="#5b6d85" />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <View style={styles.settingRight}>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      <Icon name="chevron-forward" size={18} color="#a6b3c3" />
    </View>
  </TouchableOpacity>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onLogout,
  onOpenAddWord,
  onNavigate,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const handleTabPress = (tab: BottomTabKey) => {
    onNavigate?.(tab);
  };

  if (showSettings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screenContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.settingsContent}
          >
            <View style={styles.settingsHeader}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.roundButton}
                onPress={() => setShowSettings(false)}
              >
                <Icon name="chevron-back" size={22} color="#0f2747" />
              </TouchableOpacity>
              <Text style={styles.settingsTitle}>Cài đặt</Text>
              <View style={styles.roundButtonGhost} />
            </View>

            <Text style={styles.sectionTitle}>Tài khoản</Text>
            <View style={styles.settingCard}>
              {accountRows.map(row => (
                <SettingRow key={row.label} {...row} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Ứng dụng</Text>
            <View style={styles.settingCard}>
              {appRows.map(row => (
                <SettingRow key={row.label} {...row} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Hỗ trợ</Text>
            <View style={styles.settingCard}>
              {supportRows.map(row => (
                <SettingRow key={row.label} {...row} />
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.logoutButton}
              onPress={onLogout}
            >
              <Icon name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
          </ScrollView>

          <BottomNav
            activeTab={null}
            onAddPress={onOpenAddWord}
            onTabPress={handleTabPress}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.profileContent}
        >
          <View style={styles.hero}>
            <View style={styles.heroHeader}>
              <TouchableOpacity activeOpacity={0.82} onPress={onBack}>
                <Text style={styles.name}>Nguyễn Minh</Text>
                <Text style={styles.tagline}>Keep learning, keep growing! ✨</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
              >
                <Icon name="settings-outline" size={22} color="#1c3658" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Image source={mascotImage} resizeMode="cover" style={styles.avatar} />
              </View>
              <TouchableOpacity activeOpacity={0.86} style={styles.cameraButton}>
                <Icon name="camera" size={17} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileBody}>
            <Text style={styles.profileName}>Nguyễn Minh</Text>
            <Text style={styles.username}>@nguyenminh</Text>

            <View style={styles.bioPill}>
              <Text style={styles.bioText}>Học tiếng Anh mỗi ngày, khám phá thế giới 🌎</Text>
              <Icon name="pencil" size={15} color="#47627e" />
            </View>

            <View style={styles.followRow}>
              <View style={styles.followItem}>
                <Text style={styles.followValue}>128</Text>
                <Text style={styles.followLabel}>Người theo dõi</Text>
              </View>
              <View style={styles.followDivider} />
              <View style={styles.followItem}>
                <Text style={styles.followValue}>56</Text>
                <Text style={styles.followLabel}>Đang theo dõi</Text>
              </View>
            </View>

            <View style={styles.statGrid}>
              {stats.map(item => (
                <StatCard key={item.label} {...item} />
              ))}
            </View>

            <View style={styles.journeyCard}>
              <View style={styles.journeyTop}>
                <View style={styles.journeyTitleWrap}>
                  <View style={styles.crownBadge}>
                    <Icon name="ribbon" size={18} color="#f4ad13" />
                  </View>
                  <Text style={styles.journeyTitle}>Hành trình của bạn</Text>
                </View>
                <Text style={styles.levelText}>Lv. 5</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.progressText}>1,250 / 2,000 XP</Text>
            </View>

            <Text style={styles.quoteText}>
              “Mỗi ngày học một chút, bạn đang tiến gần hơn đến phiên bản tốt hơn của chính mình!”
            </Text>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Thành tích gần đây</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.achievementRow}>
              {achievements.map(item => (
                <View key={item.title} style={styles.achievementCard}>
                  <View style={[styles.achievementBadge, { backgroundColor: item.color }]}>
                    <Icon name={item.icon} size={24} color="#fff" />
                  </View>
                  <Text style={styles.achievementTitle}>{item.title}</Text>
                  <Text style={styles.achievementSubtitle}>{item.subtitle}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Mục tiêu học tập</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.86} style={styles.goalCard}>
              <View style={styles.goalIcon}>
                <Icon name="locate" size={28} color="#168bff" />
              </View>
              <View style={styles.goalCopy}>
                <Text style={styles.goalTitle}>Giao tiếp tự tin hơn</Text>
                <Text style={styles.goalSubtitle}>
                  Luyện tập nói tiếng Anh hằng ngày và mở rộng vốn từ vựng.
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#8ea0b7" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNav
          activeTab={null}
          onAddPress={onOpenAddWord}
          onTabPress={handleTabPress}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  screenContainer: {
    flex: 1,
  },
  profileContent: {
    paddingBottom: 122,
  },
  hero: {
    height: 210,
    paddingHorizontal: 22,
    paddingTop: 22,
    backgroundColor: '#dff4ff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    color: '#112341',
    fontSize: 22,
    fontWeight: '900',
  },
  tagline: {
    color: '#6f8298',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#d5e8f6',
  },
  avatarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -54,
    alignItems: 'center',
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 4,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#8fd0ff',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 62,
  },
  cameraButton: {
    position: 'absolute',
    right: '34%',
    bottom: 9,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b9cff',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileBody: {
    paddingHorizontal: 20,
    paddingTop: 62,
  },
  profileName: {
    color: '#12213b',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  username: {
    color: '#71839b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  bioPill: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: '#f7fbff',
    borderWidth: 1,
    borderColor: '#e3eef8',
  },
  bioText: {
    flex: 1,
    color: '#29415f',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
  },
  followRow: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followItem: {
    flex: 1,
    alignItems: 'center',
  },
  followValue: {
    color: '#132743',
    fontSize: 18,
    fontWeight: '900',
  },
  followLabel: {
    color: '#74869d',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  followDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e0ebf5',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  statValue: {
    color: '#10233f',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 7,
  },
  statLabel: {
    color: '#1f3450',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  statSubLabel: {
    color: '#7b8da3',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  journeyCard: {
    marginTop: 18,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3edf8',
  },
  journeyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journeyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crownBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5da',
  },
  journeyTitle: {
    color: '#142844',
    fontSize: 14,
    fontWeight: '900',
  },
  levelText: {
    color: '#168bff',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e8f1fa',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    width: '62%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#178dff',
  },
  progressText: {
    color: '#637991',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'right',
  },
  quoteText: {
    color: '#65778f',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#12213d',
    fontSize: 17,
    fontWeight: '900',
  },
  sectionLink: {
    color: '#158bff',
    fontSize: 12,
    fontWeight: '800',
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 10,
  },
  achievementCard: {
    flex: 1,
    minHeight: 128,
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5eef8',
  },
  achievementBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    color: '#172945',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  achievementSubtitle: {
    color: '#71839a',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 2,
    textAlign: 'center',
  },
  goalCard: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3edf8',
  },
  goalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf6ff',
    marginRight: 12,
  },
  goalCopy: {
    flex: 1,
  },
  goalTitle: {
    color: '#142844',
    fontSize: 14,
    fontWeight: '900',
  },
  goalSubtitle: {
    color: '#6d7f95',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 3,
  },
  settingsContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 122,
  },
  settingsHeader: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0ebf5',
  },
  roundButtonGhost: {
    width: 42,
    height: 42,
  },
  settingsTitle: {
    color: '#13233e',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#152642',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10,
  },
  settingCard: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2edf7',
  },
  settingRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6eef7',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    color: '#2b3f58',
    fontSize: 14,
    fontWeight: '700',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    color: '#77879a',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#ff4f5f',
    marginTop: 22,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  versionText: {
    color: '#9aa8b9',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18,
  },
});

export default ProfileScreen;
