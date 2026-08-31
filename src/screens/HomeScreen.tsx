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
import { detectObjectFromImage } from '../services/detectionService';

import HeaderBar from '../components/HeaderBar';
import ProgressCard from '../components/ProgressCard';
import PracticeCard from '../components/PracticeCard';
import FeatureCard from '../components/FeatureCard';
import DailyGoalCard from '../components/DailyGoalCard';
import StudyHistory from '../components/StudyHistory';
import AiAssistantCard from '../components/AiAssistantCard';
import BottomNav from '../components/BottomNav';

type HomeScreenProps = {
  onOpenCamera?: () => void;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenCamera }) => {
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
    if (onOpenCamera) {
      onOpenCamera();
      return;
    }

    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        'Thiếu quyền camera',
        'Vui lòng cấp quyền camera trong cài đặt để sử dụng tính năng quét.',
      );
      return;
    }

    let result;

    try {
      result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.5,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
        saveToPhotos: false,
      });
    } catch (error: any) {
      Alert.alert('Lỗi camera', error?.message || 'Không mở được camera');
      return;
    }

    if (result.didCancel) return;

    if (result.errorCode) {
      const message = result.errorMessage || 'Không thể mở camera';
      Alert.alert('Lỗi camera', `${message} (${result.errorCode})`);
      return;
    }

    const asset: Asset | undefined = result.assets?.[0];

    if (!asset || !asset.uri) {
      Alert.alert('Lỗi', 'Không lấy được ảnh');
      return;
    }

    if (!asset.base64) {
      Alert.alert('Lỗi', 'Không lấy được dữ liệu ảnh base64');
      return;
    }

    try {
      const detectResult = await detectObjectFromImage({
        base64: asset.base64,
        type: asset.type,
        fileName: asset.fileName,
      });
      const finalText =
        detectResult.labels.length > 0
          ? detectResult.labels
              .map(item => `${item.label} (${Math.round(item.confidence * 100)}%)`)
              .join(', ')
          : 'Không nhận diện được vật thể';

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
              icon="◎"
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
