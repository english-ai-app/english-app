import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type LoginScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const TEST_EMAIL = 'admin@gmail.com';
const TEST_PASSWORD = 'Test1234';

const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLogin,
  onRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleLogin = () => {
    const nextErrors = {
      email: email.trim()
        ? isValidEmail(email)
          ? ''
          : 'Email không đúng định dạng'
        : 'Vui lòng nhập email',
      password: password ? '' : 'Vui lòng nhập mật khẩu',
    };

    if (
      !nextErrors.email &&
      !nextErrors.password &&
      (email.trim().toLowerCase() !== TEST_EMAIL || password !== TEST_PASSWORD)
    ) {
      nextErrors.password = 'Email hoặc mật khẩu không đúng';
    }

    setErrors(nextErrors);

    if (!nextErrors.email && !nextErrors.password) {
      onLogin?.();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="chevron-back" size={24} color="#0f63ff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục hành trình.</Text>
        </View>

        <View style={styles.form}>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          <View style={styles.inputWrap}>
            <Icon name="mail-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onBlur={() => {
                  if (email.trim() && !isValidEmail(email)) {
                    setErrors(current => ({
                      ...current,
                      email: 'Email không đúng định dạng',
                    }));
                  }
                }}
                onChangeText={value => {
                  setEmail(value);
                  if (errors.email) {
                    setErrors(current => ({ ...current, email: '' }));
                  }
                }}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#9db1c9"
                style={styles.input}
              />
            </View>
          </View>

          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          <View style={styles.inputWrap}>
            <Icon name="lock-closed-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={value => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors(current => ({ ...current, password: '' }));
                  }
                }}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#9db1c9"
                style={styles.input}
              />
            </View>
            <TouchableOpacity onPress={() => setPasswordVisible(current => !current)}>
              <Icon
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color="#5f7fa5"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.optionRow}>
            <TouchableOpacity
              style={styles.rememberWrap}
              onPress={() => setRememberMe(current => !current)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Icon name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={styles.optionText}>Ghi nhớ đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialStack}>
          <TouchableOpacity style={styles.socialButton}>
            <Icon name="logo-google" size={22} color="#ea4335" />
            <Text style={styles.socialText}>Tiếp tục với Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Icon name="logo-facebook" size={24} color="#1877f2" />
            <Text style={styles.socialText}>Tiếp tục với Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.mutedText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onRegister}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  header: {
    marginTop: 54,
    marginBottom: 24,
  },
  title: {
    color: '#0757d8',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#5d728f',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  form: {
    gap: 12,
  },
  errorText: {
    color: '#e23b3b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: -7,
  },
  inputWrap: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cde4fa',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
  },
  inputBody: {
    flex: 1,
    marginLeft: 12,
  },
  inputLabel: {
    color: '#6b87a8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  input: {
    color: '#173b70',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    marginBottom: 8,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8db9e8',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    borderColor: '#0f8bff',
    backgroundColor: '#0f8bff',
  },
  optionText: {
    color: '#5d728f',
    fontSize: 13,
    fontWeight: '700',
  },
  forgotText: {
    color: '#0f63ff',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f8bff',
    marginTop: 2,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d8e4f0',
  },
  dividerText: {
    color: '#8aa0b8',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 14,
  },
  socialStack: {
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
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
});

export default LoginScreen;
