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
  registerUser,
  resendEmailOtp,
  verifyEmailOtp,
} from '../services/authService';

type RegisterScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onLogin,
  onRegister,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const isTiny = height < 640;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const hasMinLength = password.length >= 8;
  const hasRequiredTypes = /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  const shouldShowPasswordRules = passwordTouched || submitted;

  const getRuleIcon = (isValid: boolean) => {
    if (!shouldShowPasswordRules) {
      return { name: 'checkmark-circle' as const, color: '#c8d6e6' };
    }

    return isValid
      ? { name: 'checkmark-circle' as const, color: '#0f8bff' }
      : { name: 'close-circle' as const, color: '#e23b3b' };
  };

  const handleRegister = async () => {
    setSubmitted(true);
    setPasswordTouched(true);
    setOtpError('');
    setApiError('');

    const nextErrors = {
      fullName: fullName.trim() ? '' : 'Vui lòng nhập họ và tên',
      email: email.trim()
        ? isValidEmail(email)
          ? ''
          : 'Email không đúng định dạng'
        : 'Vui lòng nhập email',
      password: password ? '' : 'Vui lòng nhập mật khẩu',
      confirmPassword: confirmPassword ? '' : 'Vui lòng nhập lại mật khẩu',
    };

    if (confirmPassword && confirmPassword !== password) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    setErrors(nextErrors);

    if (
      !nextErrors.fullName &&
      !nextErrors.email &&
      !nextErrors.password &&
      !nextErrors.confirmPassword &&
      hasMinLength &&
      hasRequiredTypes
    ) {
      try {
        setLoading(true);
        const response = await registerUser({
          fullName,
          email,
          password,
        });

        if (response.otpRequired) {
          setOtpEmail(response.email);
          setOtpExpiresAt(response.otpExpiresAt);
          setOtpVisible(true);
          return;
        }

        onRegister?.();
      } catch (error) {
        setApiError(getApiErrorMessage(error, 'Không thể đăng ký tài khoản'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setLoading(true);
      setOtpError('');
      await verifyEmailOtp(otpEmail || email, otp);
      setOtpVisible(false);
      onRegister?.();
    } catch (error) {
      setOtpError(getApiErrorMessage(error, 'Ma OTP khong hop le'));
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
    } catch (error) {
      setOtpError(getApiErrorMessage(error, 'Khong the gui lai OTP'));
    } finally {
      setLoading(false);
    }
  };

  const minLengthRule = getRuleIcon(hasMinLength);
  const requiredTypesRule = getRuleIcon(hasRequiredTypes);

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
          <Text style={[styles.title, isTiny && styles.titleTiny]}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu hành trình</Text>
          <Text style={styles.subtitle}>học tiếng Anh cùng LinguaGo</Text>
        </View>

        <View style={[styles.form, isTiny && styles.formTiny]}>
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          <View style={[styles.inputWrap, isTiny && styles.inputWrapTiny]}>
            <Icon name="person-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                value={fullName}
                onChangeText={value => {
                  setFullName(value);
                  if (errors.fullName) {
                    setErrors(current => ({ ...current, fullName: '' }));
                  }
                }}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor="#9db1c9"
                style={styles.input}
              />
            </View>
          </View>

          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          <View style={[styles.inputWrap, isTiny && styles.inputWrapTiny]}>
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
          <View style={[styles.inputWrap, isTiny && styles.inputWrapTiny]}>
            <Icon name="lock-closed-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                secureTextEntry={!passwordVisible}
                value={password}
                onBlur={() => setPasswordTouched(true)}
                onChangeText={value => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors(current => ({ ...current, password: '' }));
                  }
                }}
                placeholder="Tạo mật khẩu"
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

          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}
          <View style={[styles.inputWrap, isTiny && styles.inputWrapTiny]}>
            <Icon name="lock-closed-outline" size={18} color="#4776a8" />
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <TextInput
                secureTextEntry={!confirmVisible}
                value={confirmPassword}
                onBlur={() => {
                  if (confirmPassword && confirmPassword !== password) {
                    setErrors(current => ({
                      ...current,
                      confirmPassword: 'Mật khẩu nhập lại không khớp',
                    }));
                  }
                }}
                onChangeText={value => {
                  setConfirmPassword(value);
                  if (errors.confirmPassword) {
                    setErrors(current => ({ ...current, confirmPassword: '' }));
                  }
                }}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#9db1c9"
                style={styles.input}
              />
            </View>
            <TouchableOpacity onPress={() => setConfirmVisible(current => !current)}>
              <Icon
                name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color="#5f7fa5"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.rules, isTiny && styles.rulesTiny]}>
          <View style={styles.ruleRow}>
            <Icon name={minLengthRule.name} size={16} color={minLengthRule.color} />
            <Text
              style={[
                styles.ruleText,
                shouldShowPasswordRules && !hasMinLength && styles.ruleTextError,
                shouldShowPasswordRules && hasMinLength && styles.ruleTextValid,
              ]}
            >
              Mật khẩu phải có ít nhất 8 ký tự
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Icon name={requiredTypesRule.name} size={16} color={requiredTypesRule.color} />
            <Text
              style={[
                styles.ruleText,
                shouldShowPasswordRules && !hasRequiredTypes && styles.ruleTextError,
                shouldShowPasswordRules && hasRequiredTypes && styles.ruleTextValid,
              ]}
            >
              Bao gồm chữ hoa, chữ thường và số
            </Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={loading}
          style={[
            styles.primaryButton,
            isTiny && styles.primaryButtonTiny,
            loading && styles.primaryButtonDisabled,
          ]}
          onPress={handleRegister}
        >
          <Text style={styles.primaryText}>Đăng ký</Text>
        </TouchableOpacity>

        <View style={[styles.bottomRow, isTiny && styles.bottomRowTiny]}>
          <Text style={styles.mutedText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={onLogin}>
            <Text style={styles.linkText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <EmailOtpModal
        visible={otpVisible}
        email={otpEmail || email}
        canResend
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
    marginTop: 34,
    marginBottom: 22,
  },
  headerCompact: {
    marginTop: 18,
    marginBottom: 16,
  },
  headerTiny: {
    marginTop: 6,
    marginBottom: 12,
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
    gap: 11,
  },
  formTiny: {
    gap: 8,
  },
  errorText: {
    color: '#e23b3b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: -6,
  },
  inputWrap: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cde4fa',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
  },
  inputWrapTiny: {
    minHeight: 50,
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
  rules: {
    gap: 7,
    marginTop: 17,
    marginBottom: 15,
  },
  rulesTiny: {
    gap: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    color: '#5d728f',
    fontSize: 13,
    fontWeight: '700',
  },
  ruleTextError: {
    color: '#e23b3b',
  },
  ruleTextValid: {
    color: '#0f6fdc',
  },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f8bff',
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

export default RegisterScreen;
