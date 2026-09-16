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
    icon: 'book-outline',
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
    icon: 'create-outline',
    target: 'manualAdd',
  },
];

const AddWordScreen: React.FC<AddWordScreenProps> = ({ onNavigate }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Thêm từ mới</Text>
          <Text style={styles.subtitle}>
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
                <Icon name="chevron-forward" size={22} color="#8aa2c7" />
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
                Từ bạn chọn sẽ được lưu vào Từ của tôi và có thể xuất hiện trong các bài ôn tập.
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
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },
  title: {
    color: '#172554',
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#5d728f',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 26,
  },
  options: {
    gap: 13,
  },
  optionCard: {
    minHeight: 106,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0ebf6',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf6ff',
    marginRight: 18,
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  optionTitle: {
    color: '#172554',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 7,
  },
  optionSubtitle: {
    color: '#6b7c93',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  hintCard: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: '#eaf6ff',
    paddingHorizontal: 16,
    paddingVertical: 17,
    marginTop: 18,
  },
  hintIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hintText: {
    flex: 1,
    color: '#526783',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
  },
});

export default AddWordScreen;
