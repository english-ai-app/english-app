import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

import HeaderBar from '../components/HeaderBar';
import ProgressCard from '../components/ProgressCard';
import PracticeCard from '../components/PracticeCard';
import FeatureCard from '../components/FeatureCard';
import DailyGoalCard from '../components/DailyGoalCard';
import StudyHistory from '../components/StudyHistory';
import AiAssistantCard from '../components/AiAssistantCard';
import BottomNav, { BottomTabKey } from '../components/BottomNav';

export type AppScreenKey =
  | BottomTabKey
  | 'camera'
  | 'profile'
  | 'notifications'
  | 'challenge'
  | 'library'
  | 'quickReview';

type HomeScreenProps = {
  onOpenCamera?: () => void;
  onNavigate?: (screen: AppScreenKey) => void;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenCamera, onNavigate }) => {
  const openCamera = (): void => {
    if (onOpenCamera) {
      onOpenCamera();
      return;
    }

    onNavigate?.('camera');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HeaderBar
            onProfilePress={() => onNavigate?.('profile')}
            onNotificationsPress={() => onNavigate?.('notifications')}
          />
          <ProgressCard />
          <PracticeCard />

          <View style={styles.featureGrid}>
            <FeatureCard
              icon="◎"
              title="Quét vật thể"
              subtitle="Chụp và học từ mới"
              bgColor="#f2f5f7"
              iconBg="#1ca8ff"
              onPress={openCamera}
            />
            <FeatureCard
              icon="🏆"
              title="Thử thách"
              subtitle="Kiểm thử XP"
              bgColor="#f8f5eb"
              iconBg="#f5c94a"
              onPress={() => onNavigate?.('challenge')}
            />
            <FeatureCard
              icon="📘"
              title="Thư viện"
              subtitle="Từ vựng của bạn"
              bgColor="#eefaf1"
              iconBg="#4ade80"
              onPress={() => onNavigate?.('library')}
            />
            <FeatureCard
              icon="⚡"
              title="Thần tốc"
              subtitle="Ôn tập nhanh"
              bgColor="#fdf1f2"
              iconBg="#f87171"
              onPress={() => onNavigate?.('quickReview')}
            />
          </View>

          <DailyGoalCard />
          <StudyHistory />
          <AiAssistantCard />
        </ScrollView>

        <BottomNav
          activeTab="home"
          onCameraPress={openCamera}
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
