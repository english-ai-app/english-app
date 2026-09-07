import React, { useState } from 'react';
import HomeScreen, { AppScreenKey } from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import SimpleFeatureScreen from './src/screens/SimpleFeatureScreen';
import { BottomTabKey } from './src/components/BottomNav';

const screenConfig: Record<
  Exclude<AppScreenKey, 'home' | 'camera'>,
  {
    title: string;
    subtitle: string;
    icon: string;
    activeTab?: BottomTabKey;
  }
> = {
  review: {
    title: 'Ôn tập',
    subtitle: 'Các bài ôn tập và bộ từ vựng cần củng cố sẽ hiển thị tại đây.',
    icon: '📚',
    activeTab: 'review',
  },
  course: {
    title: 'Khóa học',
    subtitle: 'Nơi chứa các khóa học, lộ trình và bài học theo từng chủ đề.',
    icon: '🎓',
    activeTab: 'course',
  },
  community: {
    title: 'Cộng đồng',
    subtitle: 'Khu vực thử thách, bảng xếp hạng và hoạt động học cùng bạn bè.',
    icon: '🤝',
    activeTab: 'community',
  },
  profile: {
    title: 'Hồ sơ',
    subtitle: 'Theo dõi tiến độ, mục tiêu và thông tin học tập cá nhân của bạn.',
    icon: '👤',
  },
  notifications: {
    title: 'Thông báo',
    subtitle: 'Các nhắc nhở học tập, streak và cập nhật mới sẽ nằm ở đây.',
    icon: '🔔',
  },
  challenge: {
    title: 'Thử thách',
    subtitle: 'Các thử thách XP và nhiệm vụ luyện tập sẽ được mở tại đây.',
    icon: '🏆',
    activeTab: 'community',
  },
  library: {
    title: 'Thư viện',
    subtitle: 'Danh sách từ vựng đã lưu và các chủ đề học tập của bạn.',
    icon: '📘',
    activeTab: 'review',
  },
  quickReview: {
    title: 'Thần tốc',
    subtitle: 'Chế độ ôn tập nhanh cho những từ cần ghi nhớ ngay hôm nay.',
    icon: '⚡',
    activeTab: 'review',
  },
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreenKey>('home');

  if (screen === 'camera') {
    return <CameraScreen autoOpen onBack={() => setScreen('home')} />;
  }

  if (screen !== 'home') {
    const config = screenConfig[screen];

    return (
      <SimpleFeatureScreen
        title={config.title}
        subtitle={config.subtitle}
        icon={config.icon}
        activeTab={config.activeTab}
        onBack={() => setScreen('home')}
        onOpenCamera={() => setScreen('camera')}
        onNavigate={setScreen}
      />
    );
  }

  return (
    <HomeScreen
      onOpenCamera={() => setScreen('camera')}
      onNavigate={setScreen}
    />
  );
};

export default App;
