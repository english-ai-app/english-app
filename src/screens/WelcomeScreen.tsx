import React from 'react';
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

const logoImage = require('../assets/images/logo/hello.png');

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Image source={logoImage} resizeMode="contain" style={styles.logo} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
            <Icon name="logo-google" size={22} color="#ea4335" />
            <Text style={styles.socialText}>Tiếp tục với Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
            <Icon name="logo-facebook" size={24} color="#1877f2" />
            <Text style={styles.socialText}>Tiếp tục với Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            activeOpacity={0.88}
            onPress={onEmailLogin}
          >
            <Icon name="mail" size={20} color="#fff" />
            <Text style={styles.emailText}>Đăng nhập với Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
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
    paddingBottom: 24,
  },
  hero: {
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '112%',
    height: 340,
  },
  actions: {
    gap: 12,
  },
  socialButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d9e8f7',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 12,
  },
  socialText: {
    color: '#172554',
    fontSize: 15,
    fontWeight: '900',
  },
  emailButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f8bff',
    gap: 12,
  },
  emailText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
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
    fontSize: 13,
    fontWeight: '700',
  },
  linkText: {
    color: '#087cff',
    fontSize: 13,
    fontWeight: '900',
  },
  linkSmall: {
    color: '#087cff',
    fontSize: 12,
    fontWeight: '800',
  },
  hiddenLogin: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default WelcomeScreen;
