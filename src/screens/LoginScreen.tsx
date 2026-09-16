import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiErrorModal from '../components/ApiErrorModal';
import EmailOtpModal from '../components/EmailOtpModal';
import { getApiErrorMessage } from '../services/api/apiClient';
import {
  getEmailVerificationRequired,
  loginUser,
  resendEmailOtp,
  verifyEmailOtp,
} from '../services/authService';

type LoginScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLogin,
  onRegister,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const isTiny = height < 640;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpCanResend, setOtpCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    setOtpError('');
    setApiError('');
    const nextErrors = {
      email: email.trim()
        ? isValidEmail(email)
          ? ''
          : 'Email không đúng định dạng'
        : 'Vui lòng nhập email',
      password: password ? '' : 'Vui lòng nhập mật khẩu',
    };

    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    try {
      setLoading(true);
      await loginUser({ email, password });
      onLogin?.();
    } catch (error) {
      const verification = getEmailVerificationRequired(error);
      if (verification) {
        setOtpEmail(verification.email);
        setOtpExpiresAt(verification.otpExpiresAt);
        setOtpCanResend(verification.canResend);
        setOtpError(verification.message);
        setOtpVisible(true);
        return;
      }
      setApiError(getApiErrorMessage(error, 'Email hoặc mật khẩu không đúng'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setLoading(true);
      setOtpError('');
      await verifyEmailOtp(otpEmail || email, otp);
      setOtpVisible(false);
      onLogin?.();
    } catch (error) {
      const verification = getEmailVerificationRequired(error);
      if (verification) {
        setOtpCanResend(verification.canResend);
        setOtpExpiresAt(verification.otpExpiresAt);
      }
      setOtpError(getApiErrorMessage(error, 'Mã OTP không hợp lệ'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setOtpError('');
      const response = await resendEmailOtp(otpEmail || email);
      setOtpEmail(response.email);
      setOtpExpiresAt(response.otpExpiresAt);
      setOtpCanResend(false);
    } catch (error) {
      setOtpError(getApiErrorMessage(error, 'Không thể gửi lại OTP'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={[
          styles.content,
          isCompact && styles.contentCompact,
          isTiny && styles.contentTiny,
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, isTiny && styles.backButtonTiny]}
          onPress={onBack}
          disabled={loading}
        >
          <Icon name="chevron-back" size={24} color="#0f63ff" />
        </TouchableOpacity>

        <View
          style={[
            styles.header,
            isCompact && styles.headerCompact,
            isTiny && styles.headerTiny,
          ]}
        >
          <Text style={[styles.title, isTiny && styles.titleTiny]}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục hành trình.</Text>
        </View>

        <View style={[styles.form, isTiny && styles.formTiny]}>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          <View style={[styles.inputWrap, isTiny && styles.inputWrapTiny]}>
            <Icon name="mail-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                editable={!loading}
                keyboardType="email-address"
                value={email}
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
          <View style={[styles.inputWrap, isTiny && styles.inputWrapTiny]}>
            <Icon name="lock-closed-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                editable={!loading}
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
            <TouchableOpacity
              disabled={loading}
              onPress={() => setPasswordVisible(current => !current)}
            >
              <Icon
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color="#5f7fa5"
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.optionRow, isTiny && styles.optionRowTiny]}>
            <TouchableOpacity
              style={styles.rememberWrap}
              disabled={loading}
              onPress={() => setRememberMe(current => !current)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Icon name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={styles.optionText}>Ghi nhớ đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={loading}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            disabled={loading}
            style={[
              styles.primaryButton,
              isTiny && styles.primaryButtonTiny,
              loading && styles.primaryButtonDisabled,
            ]}
            onPress={handleLogin}
          >
            <Text style={styles.primaryText}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.dividerRow, isTiny && styles.dividerRowTiny]}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>hoặc</Text>
          <View style={styles.divider} />
        </View>

        <View style={[styles.socialStack, isTiny && styles.socialStackTiny]}>
          <TouchableOpacity
            disabled={loading}
            style={[styles.socialButton, isTiny && styles.socialButtonTiny]}
          >
            <Icon name="logo-google" size={22} color="#ea4335" />
            <Text style={styles.socialText}>Tiếp tục với Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={loading}
            style={[styles.socialButton, isTiny && styles.socialButtonTiny]}
          >
            <Icon name="logo-facebook" size={24} color="#1877f2" />
            <Text style={styles.socialText}>Tiếp tục với Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomRow, isTiny && styles.bottomRowTiny]}>
          <Text style={styles.mutedText}>Chưa có tài khoản? </Text>
          <TouchableOpacity disabled={loading} onPress={onRegister}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <EmailOtpModal
        visible={otpVisible}
        email={otpEmail || email}
        canResend={otpCanResend}
        expiresAt={otpExpiresAt}
        loading={loading}
        error={otpError}
        onClose={() => setOtpVisible(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
      <ApiErrorModal
        visible={Boolean(apiError)}
        message={apiError}
        onClose={() => setApiError('')}
      />
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
  contentCompact: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  contentTiny: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonTiny: {
    height: 36,
  },
  header: {
    marginTop: 54,
    marginBottom: 24,
  },
  headerCompact: {
    marginTop: 22,
    marginBottom: 18,
  },
  headerTiny: {
    marginTop: 10,
    marginBottom: 14,
  },
  title: {
    color: '#0757d8',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  titleTiny: {
    fontSize: 25,
    marginBottom: 6,
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
  formTiny: {
    gap: 9,
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
  inputWrapTiny: {
    minHeight: 52,
    paddingHorizontal: 12,
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
  optionRowTiny: {
    marginTop: 0,
    marginBottom: 4,
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
  primaryButtonTiny: {
    height: 48,
  },
  primaryButtonDisabled: {
    backgroundColor: '#a8cbed',
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
  dividerRowTiny: {
    marginVertical: 12,
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
  socialStackTiny: {
    gap: 10,
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
  socialButtonTiny: {
    height: 44,
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
  bottomRowTiny: {
    marginTop: 12,
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
