import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

const loadingImage = require('../assets/images/logo/welcome.png');

type LoadingScreenProps = {
  duration?: number;
  onFinish?: () => void;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  duration = 6000,
  onFinish,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      onFinish?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={loadingImage}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#dcf5ff',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 70,
    paddingBottom: 42,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1a94ff',
  },
});

export default LoadingScreen;
