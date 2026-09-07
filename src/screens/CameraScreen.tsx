import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  DetectedLabel,
  detectObjectFromImage,
} from '../services/detectionService';

const meaningByLabel: Record<string, string> = {
  chair: 'cái ghế',
  laptop: 'máy tính xách tay',
  mouse: 'chuột máy tính',
  keyboard: 'bàn phím',
  'cell phone': 'điện thoại',
  remote: 'điều khiển',
  book: 'quyển sách',
  bottle: 'chai nước',
  cup: 'cái cốc',
  person: 'người',
  table: 'cái bàn',
  'dining table': 'bàn ăn',
};

const getMeaning = (label: string): string =>
  meaningByLabel[label.toLowerCase()] || 'từ vựng nhận diện từ ảnh';

const toPercent = (value: number): `${number}%` => {
  const clamped = Math.min(Math.max(value, 0), 1);
  return `${clamped * 100}%`;
};

type Size = {
  width: number;
  height: number;
};

type CameraScreenProps = {
  autoOpen?: boolean;
  onBack?: () => void;
};

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack }) => {
  const soundRef = useRef<Sound | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [previewSize, setPreviewSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState<DetectedLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [playingLabel, setPlayingLabel] = useState<string | null>(null);

  const selectedCount = selectedLabels.length;
  const boxedLabels = useMemo(
    () => labels.filter(item => item.boundingBox).slice(0, 12),
    [labels],
  );

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
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
  }, []);

  const detectFromAsset = useCallback(async (asset: Asset): Promise<void> => {
    if (!asset.uri || !asset.base64) {
      Alert.alert('Lỗi', 'Không lấy được dữ liệu ảnh');
      return;
    }

    setImageUri(asset.uri);
    setImageSize({
      width: asset.width || 1,
      height: asset.height || 1,
    });
    setLabels([]);
    setSelectedLabels([]);
    setLoading(true);

    try {
      const detectResult = await detectObjectFromImage({
        base64: asset.base64,
        type: asset.type,
        fileName: asset.fileName,
      });
      setLabels(detectResult.labels);
      setSelectedLabels(detectResult.labels.slice(0, 1).map(item => item.label));
    } catch (error: any) {
      console.log('DETECT_IMAGE_ERROR:', error);
      Alert.alert('Lỗi', error?.message || 'Không gửi được yêu cầu');
    } finally {
      setLoading(false);
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<void> => {
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
      quality: 0.5,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: true,
      saveToPhotos: false,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      const message = result.errorMessage || 'Không thể mở camera';
      Alert.alert('Lỗi', `${message} (${result.errorCode})`);
      return;
    }

    const asset = result.assets?.[0];

    if (!asset) {
      Alert.alert('Lỗi', 'Không lấy được dữ liệu ảnh');
      return;
    }

    await detectFromAsset(asset);
  }, [detectFromAsset, requestCameraPermission]);

  const pickImageFromLibrary = useCallback(async (): Promise<void> => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: true,
      selectionLimit: 1,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      const message = result.errorMessage || 'Không thể mở thư viện ảnh';
      Alert.alert('Lỗi', `${message} (${result.errorCode})`);
      return;
    }

    const asset = result.assets?.[0];

    if (!asset) {
      Alert.alert('Lỗi', 'Không lấy được dữ liệu ảnh');
      return;
    }

    await detectFromAsset(asset);
  }, [detectFromAsset]);

  const playPronunciation = useCallback((label: string): void => {
    const word = label.trim();
    if (!word) return;

    soundRef.current?.stop();
    soundRef.current?.release();
    soundRef.current = null;
    setPlayingLabel(label);

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
    const sound = new Sound(url, undefined, error => {
      if (error) {
        setPlayingLabel(null);
        Alert.alert('Lỗi âm thanh', 'Không phát được phát âm của từ này.');
        return;
      }

      soundRef.current = sound;
      sound.play(success => {
        sound.release();
        if (soundRef.current === sound) {
          soundRef.current = null;
        }
        setPlayingLabel(null);

        if (!success) {
          Alert.alert('Lỗi âm thanh', 'Phát âm bị gián đoạn.');
        }
      });
    });
  }, []);

  useEffect(() => {
    Sound.setCategory('Playback');

    return () => {
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;
    };
  }, []);

  const getDetectionBoxStyle = (
    box: NonNullable<DetectedLabel['boundingBox']>,
  ) => {
    if (!imageSize || !previewSize) {
      return {
        left: toPercent(box.x),
        top: toPercent(box.y),
        width: toPercent(box.width),
        height: toPercent(box.height),
      };
    }

    const imageRatio = imageSize.width / imageSize.height;
    const previewRatio = previewSize.width / previewSize.height;
    const renderedWidth =
      imageRatio > previewRatio
        ? previewSize.width
        : previewSize.height * imageRatio;
    const renderedHeight =
      imageRatio > previewRatio
        ? previewSize.width / imageRatio
        : previewSize.height;
    const offsetX = (previewSize.width - renderedWidth) / 2;
    const offsetY = (previewSize.height - renderedHeight) / 2;

    return {
      left: offsetX + box.x * renderedWidth,
      top: offsetY + box.y * renderedHeight,
      width: box.width * renderedWidth,
      height: box.height * renderedHeight,
    };
  };

  const toggleLabel = (label: string): void => {
    setSelectedLabels(current =>
      current.includes(label)
        ? current.filter(item => item !== label)
        : [...current, label],
    );
  };

  const saveSelected = (withRegister: boolean): void => {
    if (selectedCount === 0) {
      Alert.alert('Chưa chọn từ', 'Hãy chọn ít nhất một từ vựng.');
      return;
    }

    Alert.alert(
      withRegister ? 'Lưu và đăng ký' : 'Lưu từ vựng',
      'Bước sau sẽ nối với content/learning service để lưu thật.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Icon name="chevron-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả nhận diện</Text>
        <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
          <Icon name="camera-outline" size={22} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={styles.previewWrap}
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            setPreviewSize({ width, height });
          }}
        >
          {imageUri ? (
            <Image
              resizeMode="contain"
              source={{ uri: imageUri }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.emptyPreview}>
              <Icon name="scan-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyPreviewText}>Sẵn sàng nhận diện</Text>
            </View>
          )}

          {imageUri &&
            boxedLabels.map((item, index) => {
              const box = item.boundingBox;
              if (!box) return null;

              return (
                <View
                  key={`${item.label}-${index}`}
                  pointerEvents="none"
                  style={[styles.detectionBox, getDetectionBoxStyle(box)]}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.detectionLabel}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>Đang nhận diện...</Text>
            </View>
          )}
        </View>

        {labels.length === 0 && !loading ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.libraryButton}
              onPress={pickImageFromLibrary}
            >
              <Icon name="image" size={18} color="#0f8bff" />
              <Text style={styles.libraryButtonText}>Chọn ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Icon name="camera" size={18} color="#fff" />
              <Text style={styles.captureButtonText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.topicRow}>
              <Text style={styles.topicText}>Chọn chủ đề cho tất cả</Text>
              <TouchableOpacity style={styles.topicButton}>
                <Text style={styles.topicButtonText}>Chọn chủ đề</Text>
                <Icon name="chevron-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.wordsList}>
              {labels.map(item => {
                const selected = selectedLabels.includes(item.label);

                return (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={0.85}
                    style={[
                      styles.wordCard,
                      selected && styles.wordCardSelected,
                    ]}
                    onPress={() => toggleLabel(item.label)}
                  >
                    <View style={styles.radioWrap}>
                      <View
                        style={[
                          styles.radio,
                          selected && styles.radioSelected,
                        ]}
                      >
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </View>

                    <View style={styles.wordInfo}>
                      <Text style={styles.word}>{item.label}</Text>
                      <Text style={styles.meaning}>
                        /{item.label}/ - {getMeaning(item.label)}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.confidenceText}>
                          Độ tin cậy {Math.round(item.confidence * 100)}%
                        </Text>
                        <TouchableOpacity style={styles.smallTopicButton}>
                          <Text style={styles.smallTopicText}>Chọn chủ đề</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Phát âm ${item.label}`}
                      onPress={(event: GestureResponderEvent) => {
                        event.stopPropagation();
                        playPronunciation(item.label);
                      }}
                      style={[
                        styles.soundButton,
                        playingLabel === item.label && styles.soundButtonPlaying,
                      ]}
                    >
                      <Icon
                        name={
                          playingLabel === item.label
                            ? 'volume-high'
                            : 'volume-medium-outline'
                        }
                        size={20}
                        color={playingLabel === item.label ? '#fff' : '#0f8bff'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {labels.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => saveSelected(false)}
          >
            <Text style={styles.secondaryButtonText}>
              Lưu từ vựng ({selectedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => saveSelected(true)}
          >
            <Text style={styles.primaryButtonText}>Lưu và đăng ký</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 14,
    paddingBottom: 110,
  },
  previewWrap: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5edf5',
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPreviewText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
  },
  detectionBox: {
    position: 'absolute',
    minWidth: 44,
    minHeight: 28,
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  detectionLabel: {
    position: 'absolute',
    left: -2,
    top: -24,
    maxWidth: 112,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(37, 99, 235, 0.92)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  libraryButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#0f8bff',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  libraryButtonText: {
    color: '#0f8bff',
    fontSize: 16,
    fontWeight: '700',
  },
  captureButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#0f8bff',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topicText: {
    color: '#64748b',
    fontSize: 13,
  },
  topicButton: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 15,
    backgroundColor: '#0f8bff',
    paddingHorizontal: 12,
  },
  topicButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  wordsList: {
    gap: 10,
  },
  wordCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8e3ef',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  wordCardSelected: {
    borderColor: '#0f8bff',
    backgroundColor: '#f7fbff',
  },
  radioWrap: {
    width: 30,
    alignItems: 'flex-start',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#0f8bff',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f8bff',
  },
  wordInfo: {
    flex: 1,
    minWidth: 0,
  },
  word: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  meaning: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  confidenceText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  smallTopicButton: {
    borderRadius: 12,
    backgroundColor: '#0f8bff',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  smallTopicText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  soundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf7ff',
    marginLeft: 8,
  },
  soundButtonPlaying: {
    backgroundColor: '#0f8bff',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f8bff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066ff',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default CameraScreen;
