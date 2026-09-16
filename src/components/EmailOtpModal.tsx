import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type EmailOtpModalProps = {
  visible: boolean;
  email: string;
  canResend: boolean;
  expiresAt?: string | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResend: () => void;
};

const OTP_LENGTH = 6;

const getRemainingSeconds = (expiresAt?: string | null): number => {
  if (!expiresAt) return 0;

  const expiresTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresTime)) return 0;

  return Math.max(0, Math.ceil((expiresTime - Date.now()) / 1000));
};

const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] ?? '*'}***@${domain}`;

  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
};

const EmailOtpModal: React.FC<EmailOtpModalProps> = ({
  visible,
  email,
  canResend,
  expiresAt,
  loading = false,
  error,
  onClose,
  onVerify,
  onResend,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(expiresAt),
  );

  useEffect(() => {
    if (!visible) return;

    setOtp('');
    setRemainingSeconds(getRemainingSeconds(expiresAt));
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 180);

    return () => clearTimeout(focusTimer);
  }, [visible, email, expiresAt]);

  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(expiresAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, expiresAt]);

  const digits = useMemo(
    () => Array.from({ length: OTP_LENGTH }, (_, index) => otp[index] || ''),
    [otp],
  );
  const canSubmit = otp.length === OTP_LENGTH && !loading;
  const canUseResend = !loading && (canResend || remainingSeconds === 0);

  const handleChangeOtp = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Icon name="shield-checkmark-outline" size={20} color="#2563eb" />
              <Text style={styles.title}>Xác thực OTP</Text>
            </View>
            <TouchableOpacity
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              disabled={loading}
              onPress={onClose}
            >
              <Icon name="close" size={22} color="#8aa0b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Icon name="mail-unread-outline" size={30} color="#2563eb" />
            </View>
            <Text style={styles.description}>
              Mã OTP đã được gửi tới email {maskEmail(email)}. Vui lòng nhập mã để tiếp tục.
            </Text>

            <TouchableOpacity
              activeOpacity={1}
              style={styles.otpRow}
              onPress={() => inputRef.current?.focus()}
            >
              {digits.map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    index === otp.length && styles.otpBoxActive,
                    Boolean(digit) && styles.otpBoxFilled,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              ))}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={otp}
              editable={!loading}
              onChangeText={handleChangeOtp}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              caretHidden
              style={styles.hiddenInput}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.timerText}>
              Mã OTP còn hiệu lực trong {remainingSeconds} giây
            </Text>
            <TouchableOpacity disabled={!canUseResend} onPress={onResend}>
              <Text style={[styles.resendText, !canUseResend && styles.resendDisabled]}>
                Gửi lại mã OTP
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            disabled={!canSubmit}
            style={[styles.confirmButton, !canSubmit && styles.confirmDisabled]}
            onPress={() => onVerify(otp)}
          >
            <Text style={styles.confirmText}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 35, 58, 0.38)',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    paddingHorizontal: 18,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#172554',
    fontSize: 17,
    fontWeight: '900',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
  },
  iconWrap: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 33,
    backgroundColor: '#eef6ff',
    marginBottom: 18,
  },
  description: {
    color: '#4f6078',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },
  otpRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  otpBox: {
    width: 44,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d9e4f2',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  otpBoxActive: {
    borderColor: '#2f78ff',
  },
  otpBoxFilled: {
    borderColor: '#2f78ff',
    backgroundColor: '#f8fbff',
  },
  otpDigit: {
    color: '#1f2937',
    fontSize: 23,
    fontWeight: '900',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    color: '#e23b3b',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerText: {
    color: '#6b7c93',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: 8,
  },
  resendText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '900',
  },
  resendDisabled: {
    color: '#9db1c9',
  },
  confirmButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
    marginHorizontal: 18,
    marginBottom: 18,
  },
  confirmDisabled: {
    backgroundColor: '#a8cbed',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default EmailOtpModal;
