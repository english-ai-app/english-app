import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const logoImage = require('../assets/images/logo/hello.png');
const googleImage = require('../assets/images/logo/google.webp');

type WelcomeScreenProps = {
  onEmailLogin?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEmailLogin,
  onLogin,
  onRegister,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const isTiny = height < 640;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.content,
          isCompact && styles.contentCompact,
          isTiny && styles.contentTiny,
        ]}
      >
        <View
          style={[
            styles.hero,
            isCompact && styles.heroCompact,
            isTiny && styles.heroTiny,
          ]}
        >
          <Image
            source={logoImage}
            resizeMode="contain"
            style={[
              styles.logo,
              isCompact && styles.logoCompact,
              isTiny && styles.logoTiny,
            ]}
          />
        </View>

        <View style={[styles.actions, isTiny && styles.actionsTiny]}>
          <TouchableOpacity
            style={[styles.socialButton, isTiny && styles.actionButtonTiny]}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconSlot}>
                <Image
                  source={googleImage}
                  resizeMode="contain"
                  style={styles.googleIcon}
                />
              </View>
              <Text style={styles.socialText}>Tiếp tục với Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, isTiny && styles.actionButtonTiny]}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconSlot}>
                <Icon name="logo-facebook" size={24} color="#1877f2" />
              </View>
              <Text style={styles.socialText}>Tiếp tục với Facebook</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emailButton, isTiny && styles.actionButtonTiny]}
            activeOpacity={0.88}
            onPress={onEmailLogin}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconSlot}>
                <Icon name="mail" size={20} color="#fff" />
              </View>
              <Text style={styles.emailText}>Đăng nhập với Email</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.dividerRow, isTiny && styles.dividerRowTiny]}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.mutedText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onRegister}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.mutedText}>
            Đã từng biết tiếp tục, bạn đồng ý với
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.linkSmall}>Điều khoản dịch vụ</Text>
          <Text style={styles.mutedText}> và </Text>
          <Text style={styles.linkSmall}>Chính sách bảo mật</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.hiddenLogin}
          onPress={onLogin}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fcff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
  },
  contentCompact: {
    paddingTop: 0,
    paddingBottom: 6,
  },
  contentTiny: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  hero: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -18,
    overflow: 'hidden',
  },
  heroCompact: {
    aspectRatio: 1,
  },
  heroTiny: {
    aspectRatio: 1,
    marginHorizontal: -16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoCompact: {
    width: '100%',
    height: '100%',
  },
  logoTiny: {
    width: '100%',
    height: '100%',
  },
  actions: {
    gap: 12,
  },
  actionsTiny: {
    gap: 10,
  },
  socialButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d9e8f7',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 8,
  },
  socialText: {
    color: '#172554',
    fontSize: 16,
    fontWeight: '900',
  },
  emailButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0f8bff',
    gap: 8,
  },
  actionButtonTiny: {
    height: 44,
  },
  buttonContent: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconSlot: {
    width: 28,
    alignItems: 'center',
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  emailText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerRowTiny: {
    marginVertical: 14,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d8e4f0',
  },
  dividerText: {
    color: '#8aa0b8',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  mutedText: {
    color: '#6b7c93',
    fontSize: 14,
    fontWeight: '700',
  },
  linkText: {
    color: '#087cff',
    fontSize: 14,
    fontWeight: '900',
  },
  linkSmall: {
    color: '#087cff',
    fontSize: 13,
    fontWeight: '800',
  },
  hiddenLogin: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default WelcomeScreen;
