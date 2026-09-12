import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomNav from '../components/BottomNav';
import type { AppScreenKey } from './HomeScreen';

type AddWordScreenProps = {
  onClose?: () => void;
  onNavigate?: (screen: AppScreenKey) => void;
};

const addOptions: Array<{
  title: string;
  subtitle: string;
  icon: string;
  target: AppScreenKey;
}> = [
  {
    title: 'Quét hình ảnh',
    subtitle: 'Nhận diện đồ vật xung quanh bạn qua camera',
    icon: 'camera-outline',
    target: 'camera',
  },
  {
    title: 'Từ điển',
    subtitle: 'Tra cứu nghĩa, phát âm và ví dụ chi tiết',
    icon: 'search-outline',
    target: 'dictionary',
  },
  {
    title: 'Dịch',
    subtitle: 'Dịch nhanh các câu văn hoặc đoạn văn ngắn',
    icon: 'language-outline',
    target: 'translate',
  },
  {
    title: 'Thêm thủ công',
    subtitle: 'Tự nhập từ vựng và ghi chú cá nhân',
    icon: 'add-outline',
    target: 'manualAdd',
  },
];

const AddWordScreen: React.FC<AddWordScreenProps> = ({
  onClose,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={styles.headerButton}
            onPress={onClose}
          >
            <Icon name="chevron-back" size={22} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm từ mới</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Thêm từ mới</Text>
          <Text style={styles.subtitle}>Mở rộng vốn từ vựng của bạn</Text>

          <Text style={styles.question}>
            Bạn muốn thêm từ để học bằng cách nào?
          </Text>

          <View style={styles.options}>
            {addOptions.map(option => (
              <TouchableOpacity
                key={option.title}
                activeOpacity={0.85}
                style={styles.optionCard}
                onPress={() => onNavigate?.(option.target)}
              >
                <View style={styles.optionIconWrap}>
                  <Icon name={option.icon} size={28} color="#0f6bff" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Icon name="arrow-forward" size={18} color="#c3c8cf" />
              </TouchableOpacity>
            ))}

            <View style={styles.hintCard}>
              <View style={styles.hintIconWrap}>
                <Icon
                  name="information-circle-outline"
                  size={24}
                  color="#0f6bff"
                />
              </View>
              <Text style={styles.hintText}>
                Từ bạn chọn sẽ được lưu vào{' '}
                <Text style={styles.hintLink}>Từ của bạn</Text>
              </Text>
            </View>
          </View>
        </ScrollView>

        <BottomNav
          activeTab="home"
          addActive
          onAddPress={() => onNavigate?.('addWord')}
          onTabPress={onNavigate}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 120,
  },
  title: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#8b949e',
    fontSize: 13,
    fontWeight: '600',
  },
  question: {
    alignSelf: 'center',
    maxWidth: 260,
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 28,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe7f1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  optionTitle: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  optionSubtitle: {
    color: '#7b8490',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  hintCard: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  hintIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef6ff',
    marginRight: 10,
  },
  hintText: {
    flex: 1,
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  hintLink: {
    color: '#0f6bff',
    fontWeight: '800',
  },
});

export default AddWordScreen;
