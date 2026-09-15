import React, { useState } from 'react';
import HomeScreen, { AppScreenKey } from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import SimpleFeatureScreen from './src/screens/SimpleFeatureScreen';
import AddWordScreen from './src/screens/AddWordScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { BottomTabKey } from './src/components/BottomNav';

const screenConfig: Record<
  Exclude<AppScreenKey, 'home' | 'addWord' | 'camera'>,
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
    activeTab: undefined,
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
  dictionary: {
    title: 'Từ điển',
    subtitle: 'Tra cứu nghĩa, phát âm và ví dụ chi tiết cho từ vựng bạn muốn học.',
    icon: '🔎',
    activeTab: 'review',
  },
  translate: {
    title: 'Dịch',
    subtitle: 'Dịch nhanh câu văn hoặc đoạn văn ngắn để thêm vào bộ từ của bạn.',
    icon: '🌐',
    activeTab: 'review',
  },
  manualAdd: {
    title: 'Thêm thủ công',
    subtitle: 'Tự nhập từ vựng, nghĩa và ghi chú cá nhân theo cách bạn muốn.',
    icon: '＋',
    activeTab: 'review',
  },
};

type AuthScreenKey = 'welcome' | 'login' | 'register' | 'loading' | 'app';

const App: React.FC = () => {
  const [authScreen, setAuthScreen] = useState<AuthScreenKey>('welcome');
  const [screen, setScreen] = useState<AppScreenKey>('home');

  if (authScreen === 'welcome') {
    return (
      <WelcomeScreen
        onEmailLogin={() => setAuthScreen('login')}
        onLogin={() => setAuthScreen('loading')}
        onRegister={() => setAuthScreen('register')}
      />
    );
  }

  if (authScreen === 'login') {
    return (
      <LoginScreen
        onBack={() => setAuthScreen('welcome')}
        onLogin={() => setAuthScreen('loading')}
        onRegister={() => setAuthScreen('register')}
      />
    );
  }

  if (authScreen === 'register') {
    return (
      <RegisterScreen
        onBack={() => setAuthScreen('welcome')}
        onLogin={() => setAuthScreen('login')}
        onRegister={() => setAuthScreen('loading')}
      />
    );
  }

  if (authScreen === 'loading') {
    return <LoadingScreen onFinish={() => setAuthScreen('app')} />;
  }

  if (screen === 'camera') {
    return <CameraScreen autoOpen onBack={() => setScreen('home')} />;
  }

  if (screen === 'addWord') {
    return (
      <AddWordScreen
        onClose={() => setScreen('home')}
        onNavigate={setScreen}
      />
    );
  }

  if (screen === 'profile') {
    return (
      <ProfileScreen
        onBack={() => setScreen('home')}
        onOpenAddWord={() => setScreen('addWord')}
        onNavigate={setScreen}
        onLogout={() => {
          setScreen('home');
          setAuthScreen('login');
        }}
      />
    );
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
        onOpenAddWord={() => setScreen('addWord')}
        onNavigate={setScreen}
      />
    );
  }

  return (
    <HomeScreen
      onOpenCamera={() => setScreen('camera')}
      onOpenAddWord={() => setScreen('addWord')}
      onNavigate={setScreen}
    />
  );
};

export default App;
