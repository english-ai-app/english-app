import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchCamera, Asset } from 'react-native-image-picker';

const CameraScreen: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('Chưa có kết quả');

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Quyền truy cập camera',
        message: 'Ứng dụng cần quyền camera để chụp ảnh nhận diện vật thể.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const takePhoto = async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        'Thiếu quyền camera',
        'Vui lòng cấp quyền camera trong cài đặt để tiếp tục.',
      );
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
      saveToPhotos: true,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      const code = result.errorCode;
      const message = result.errorMessage || 'Không thể mở camera';
      Alert.alert('Lỗi', `${message} (${code})`);
      return;
    }

    const asset: Asset | undefined = result.assets?.[0];

    if (!asset || !asset.uri) {
      Alert.alert('Lỗi', 'Không lấy được ảnh');
      return;
    }

    setImageUri(asset.uri);
    setResultText('Đang nhận diện...');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || 'photo.jpg',
    } as any);

    try {
      const response = await fetch('http://192.168.1.166:9000/api/detect', {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      let data: any = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText || 'Không nhận diện được' };
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Server trả về lỗi');
      }

      const labels = Array.isArray(data?.labels) ? data.labels : [];
      const label = typeof data?.label === 'string' ? data.label : '';
      const message = typeof data?.message === 'string' ? data.message : '';

      const finalResult =
        labels.length > 0
          ? labels.join(', ')
          : label || message || 'Không nhận diện được';
      setResultText(finalResult);
    } catch (error: any) {
      console.log('ERROR:', error);
      setResultText(error?.message || 'Không gửi được request');
      Alert.alert('Lỗi', error?.message || 'Không gửi được request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>English AI</Text>
        <Text style={styles.subtitle}>Chụp ảnh để nhận diện vật thể</Text>

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Chưa có ảnh</Text>
          </View>
        )}

        <Text style={styles.resultLabel}>Kết quả:</Text>
        <Text style={styles.resultText}>{resultText}</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={takePhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📸 Chụp ảnh</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7ff',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    backgroundColor: '#dfe7ff',
    marginBottom: 18,
  },
  placeholder: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    backgroundColor: '#dfe7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 16,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 20,
    minHeight: 28,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CameraScreen;
