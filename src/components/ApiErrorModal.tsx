import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type ApiErrorModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

const ApiErrorModal: React.FC<ApiErrorModalProps> = ({
  visible,
  title = 'Có lỗi xảy ra',
  message,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon name="alert-circle-outline" size={22} color="#e23b3b" />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 35, 58, 0.32)',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    marginRight: 10,
  },
  title: {
    flex: 1,
    color: '#123866',
    fontSize: 17,
    fontWeight: '900',
  },
  message: {
    color: '#607590',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 16,
  },
  button: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f8bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default ApiErrorModal;
