import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { launchCamera, Asset } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  DetectedLabel,
  detectObjectFromImage,
} from '../services/detectionService';

const meaningByLabel: Record<string, string> = {
  chair: 'cai ghe',
  laptop: 'may tinh xach tay',
  mouse: 'chuot may tinh',
  keyboard: 'ban phim',
  'cell phone': 'dien thoai',
  remote: 'dieu khien',
  book: 'quyen sach',
  bottle: 'chai nuoc',
  cup: 'cai coc',
  person: 'nguoi',
  table: 'cai ban',
  'dining table': 'ban an',
};

const getMeaning = (label: string): string =>
  meaningByLabel[label.toLowerCase()] || 'tu vung nhan dien tu anh';

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

const CameraScreen: React.FC<CameraScreenProps> = ({ autoOpen, onBack }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [previewSize, setPreviewSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState<DetectedLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [didAutoOpen, setDidAutoOpen] = useState(false);

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
        title: 'Quyen truy cap camera',
        message: 'Ung dung can quyen camera de chup anh nhan dien vat the.',
        buttonPositive: 'Cho phep',
        buttonNegative: 'Tu choi',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const takePhoto = useCallback(async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        'Thieu quyen camera',
        'Vui long cap quyen camera trong cai dat de tiep tuc.',
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
      const message = result.errorMessage || 'Khong the mo camera';
      Alert.alert('Loi', `${message} (${result.errorCode})`);
      return;
    }

    const asset: Asset | undefined = result.assets?.[0];

    if (!asset?.uri || !asset.base64) {
      Alert.alert('Loi', 'Khong lay duoc du lieu anh');
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
      Alert.alert('Loi', error?.message || 'Khong gui duoc request');
    } finally {
      setLoading(false);
    }
  }, [requestCameraPermission]);

  useEffect(() => {
    if (!autoOpen || didAutoOpen) return;

    setDidAutoOpen(true);
    takePhoto();
  }, [autoOpen, didAutoOpen, takePhoto]);

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
      Alert.alert('Chua chon tu', 'Hay chon it nhat mot tu vung.');
      return;
    }

    Alert.alert(
      withRegister ? 'Luu va dang ky' : 'Luu tu vung',
      'Phase sau se noi lai content/learning service de luu that.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Icon name="chevron-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ket qua nhan dien</Text>
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
              <Icon name="camera-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyPreviewText}>Chua co anh</Text>
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
                  style={[
                    styles.detectionBox,
                    getDetectionBoxStyle(box),
                  ]}
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
              <Text style={styles.loadingText}>Dang nhan dien...</Text>
            </View>
          )}
        </View>

        <View style={styles.topicRow}>
          <Text style={styles.topicText}>Chon chu de cho tat ca</Text>
          <TouchableOpacity style={styles.topicButton}>
            <Text style={styles.topicButtonText}>chon chu de</Text>
            <Icon name="chevron-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {labels.length === 0 && !loading ? (
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Icon name="camera" size={18} color="#fff" />
            <Text style={styles.captureButtonText}>Chup anh</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.wordsList}>
            {labels.map(item => {
              const selected = selectedLabels.includes(item.label);

              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.85}
                  style={[styles.wordCard, selected && styles.wordCardSelected]}
                  onPress={() => toggleLabel(item.label)}
                >
                  <View style={styles.radioWrap}>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </View>

                  <View style={styles.wordInfo}>
                    <Text style={styles.word}>{item.label}</Text>
                    <Text style={styles.meaning}>/{item.label}/ - {getMeaning(item.label)}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.confidenceText}>
                        Do tin cay {Math.round(item.confidence * 100)}%
                      </Text>
                      <TouchableOpacity style={styles.smallTopicButton}>
                        <Text style={styles.smallTopicText}>chon chu de</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    disabled
                    style={[styles.soundButton, styles.soundButtonDisabled]}
                  >
                    <Icon name="volume-medium-outline" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {labels.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => saveSelected(false)}
          >
            <Text style={styles.secondaryButtonText}>
              Luu tu vung ({selectedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => saveSelected(true)}
          >
            <Text style={styles.primaryButtonText}>Luu va dang ky</Text>
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
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
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
  captureButton: {
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
  soundButtonDisabled: {
    backgroundColor: '#f1f5f9',
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
