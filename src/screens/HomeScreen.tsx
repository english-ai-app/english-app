import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchCamera, Asset } from 'react-native-image-picker';

import HeaderBar from '../components/HeaderBar';
import ProgressCard from '../components/ProgressCard';
import PracticeCard from '../components/PracticeCard';
import FeatureCard from '../components/FeatureCard';
import DailyGoalCard from '../components/DailyGoalCard';
import StudyHistory from '../components/StudyHistory';
import AiAssistantCard from '../components/AiAssistantCard';
import BottomNav from '../components/BottomNav';

const HomeScreen: React.FC = () => {
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Quyền truy cập camera',
        message: 'Ứng dụng cần quyền camera để chụp ảnh nhận diện vật thể.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleCameraPress = async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        'Thiếu quyền camera',
        'Vui lòng cấp quyền camera trong cài đặt để sử dụng tính năng quét.',
      );
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
      saveToPhotos: true,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      Alert.alert('Lỗi camera', result.errorMessage || 'Không thể mở camera');
      return;
    }

    const asset: Asset | undefined = result.assets?.[0];

    if (!asset || !asset.uri) {
      Alert.alert('Lỗi', 'Không lấy được ảnh');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || 'object.jpg',
    } as any);

    try {
      const response = await fetch('http://192.168.1.166:9000/api/detect', {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      let data: any = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText || 'Không nhận diện được' };
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Server trả về lỗi');
      }

      const labels = Array.isArray(data?.labels) ? data.labels : [];
      const label = typeof data?.label === 'string' ? data.label : '';
      const message = typeof data?.message === 'string' ? data.message : '';
      const finalText =
        labels.length > 0
          ? labels.join(', ')
          : label || message || 'Không nhận diện được';

      Alert.alert('Kết quả', finalText);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không gọi được backend');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HeaderBar />
          <ProgressCard />
          <PracticeCard />

          <View style={styles.featureGrid}>
            <FeatureCard
              icon="◉"
              title="Quét Vật Thể"
              subtitle="Chụp & Học từ mới"
              bgColor="#f2f5f7"
              iconBg="#1ca8ff"
            />
            <FeatureCard
              icon="🏆"
              title="Thách Đấu"
              subtitle="Kiểm thử XP"
              bgColor="#f8f5eb"
              iconBg="#f5c94a"
            />
            <FeatureCard
              icon="📘"
              title="Thư Viện"
              subtitle="Từ vựng của bạn"
              bgColor="#eefaf1"
              iconBg="#4ade80"
            />
            <FeatureCard
              icon="⚡"
              title="Thần Tốc"
              subtitle="Ôn tập nhanh"
              bgColor="#fdf1f2"
              iconBg="#f87171"
            />
          </View>

          <DailyGoalCard />
          <StudyHistory />
          <AiAssistantCard />
        </ScrollView>

        <BottomNav onCameraPress={handleCameraPress} />
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 120,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
});

export default HomeScreen;
