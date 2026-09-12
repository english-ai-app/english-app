import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  DetectedLabel,
  DetectionVocabularyItem,
  detectObjectFromImage,
} from '../services/detectionService';

const toPercent = (value: number): `${number}%` => {
  const clamped = Math.min(Math.max(value, 0), 1);
  return `${clamped * 100}%`;
};

const readImageAsBase64 = async (uri: string): Promise<string> => {
  if (uri.startsWith('data:')) {
    return uri.split(',')[1] || '';
  }

  const filePath = decodeURIComponent(uri.replace('file://', ''));

  try {
    return await RNFS.readFile(filePath, 'base64');
  } catch (error) {
    const stat = await RNFS.stat(uri);
    const originalPath = (stat as { originalFilepath?: string }).originalFilepath;
    if (originalPath) {
      return RNFS.readFile(originalPath, 'base64');
    }
    throw error;
  }
};

const formatIpa = (ipa?: string): string => {
  if (!ipa) return '';
  return ipa.startsWith('/') ? ipa : `/${ipa}/`;
};

type Size = {
  width: number;
  height: number;
};

type CameraMode = 'camera' | 'result';
type CameraPosition = 'back' | 'front';

type CameraScreenProps = {
  autoOpen?: boolean;
  onBack?: () => void;
};

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack }) => {
  const cameraRef = useRef<Camera>(null);
  const soundRef = useRef<Sound | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const [mode, setMode] = useState<CameraMode>('camera');
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [previewSize, setPreviewSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState<DetectedLabel[]>([]);
  const [items, setItems] = useState<DetectionVocabularyItem[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const device = useCameraDevice(cameraPosition);
  const selectedCount = selectedWords.length;
  const boxedLabels = useMemo(
    () => labels.filter(item => item.boundingBox).slice(0, 12),
    [labels],
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    Sound.setCategory('Playback');

    return () => {
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;
    };
  }, []);

  const openCamera = useCallback(() => {
    setMode('camera');
  }, []);

  const closeCamera = useCallback(() => {
    setMode('result');
  }, []);

  const runDetection = useCallback(
    async (payload: {
      uri: string;
      base64: string;
      type?: string;
      fileName?: string;
      width?: number;
      height?: number;
    }): Promise<void> => {
      setImageUri(payload.uri);
      setImageSize({
        width: payload.width || 1,
        height: payload.height || 1,
      });
      setLabels([]);
      setItems([]);
      setSelectedWords([]);
      setMode('result');
      setLoading(true);

      try {
        const detectResult = await detectObjectFromImage({
          base64: payload.base64,
          type: payload.type,
          fileName: payload.fileName,
        });
        setLabels(detectResult.labels);
        setItems(detectResult.items);
        setSelectedWords(detectResult.items.slice(0, 1).map(item => item.word));
      } catch (error: any) {
        console.log('DETECT_IMAGE_ERROR:', error);
        Alert.alert('Lỗi', error?.message || 'Không gửi được yêu cầu');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const detectFromAsset = useCallback(
    async (asset: Asset): Promise<void> => {
      if (!asset.uri) {
        Alert.alert('Lỗi', 'Không lấy được dữ liệu ảnh');
        return;
      }

      const base64 = asset.base64 || (await readImageAsBase64(asset.uri));

      await runDetection({
        uri: asset.uri,
        base64,
        type: asset.type,
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
      });
    },
    [runDetection],
  );

  const takePhoto = useCallback(async (): Promise<void> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Thiếu quyền camera',
          'Vui lòng cấp quyền camera trong cài đặt để tiếp tục.',
        );
        return;
      }
    }

    if (!cameraRef.current) {
      Alert.alert('Lỗi', 'Camera chưa sẵn sàng');
      return;
    }

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: torchEnabled && device?.hasFlash ? 'on' : 'off',
      });
      const uri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;
      const base64 = await RNFS.readFile(photo.path, 'base64');

      await runDetection({
        uri,
        base64,
        type: 'image/jpeg',
        fileName: photo.path.split('/').pop() || 'camera-photo.jpg',
        width: photo.width,
        height: photo.height,
      });
    } catch (error: any) {
      console.log('TAKE_PHOTO_ERROR:', error);
      Alert.alert('Lỗi', error?.message || 'Không chụp được ảnh');
    } finally {
      setLoading(false);
    }
  }, [device?.hasFlash, hasPermission, requestPermission, runDetection, torchEnabled]);

  const pickImageFromLibrary = useCallback(async (): Promise<void> => {
    try {
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
    } catch (error: any) {
      console.log('PICK_IMAGE_ERROR:', error);
      Alert.alert('Lỗi', error?.message || 'Không chọn được ảnh');
    }
  }, [detectFromAsset]);

  const playPronunciation = useCallback((word: string, audioUrl?: string): void => {
    const text = word.trim();
    if (!text) return;

    soundRef.current?.stop();
    soundRef.current?.release();
    soundRef.current = null;
    setPlayingWord(word);

    const url =
      audioUrl ||
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(
        text,
      )}`;
    const sound = new Sound(url, undefined, error => {
      if (error) {
        setPlayingWord(null);
        Alert.alert('Lỗi âm thanh', 'Không phát được phát âm của từ này.');
        return;
      }

      soundRef.current = sound;
      sound.play(success => {
        sound.release();
        if (soundRef.current === sound) {
          soundRef.current = null;
        }
        setPlayingWord(null);

        if (!success) {
          Alert.alert('Lỗi âm thanh', 'Phát âm bị gián đoạn.');
        }
      });
    });
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

  const toggleWord = (word: string): void => {
    setSelectedWords(current =>
      current.includes(word)
        ? current.filter(item => item !== word)
        : [...current, word],
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

  if (mode === 'camera') {
    return (
      <View style={styles.cameraRoot}>
        {hasPermission && device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={mode === 'camera'}
            photo
            torch={torchEnabled && device.hasTorch ? 'on' : 'off'}
          />
        ) : (
          <View style={styles.cameraUnavailable}>
            <Icon name="camera-outline" size={42} color="#fff" />
            <Text style={styles.cameraUnavailableText}>
              Camera chưa sẵn sàng
            </Text>
          </View>
        )}

        <View pointerEvents="none" style={styles.bottomShade} />

        <SafeAreaView style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity style={styles.closeCameraButton} onPress={closeCamera}>
              <Icon name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.cameraTitleWrap}>
              <Text style={styles.cameraTitle}>Nhận diện vật thể</Text>
              <Text style={styles.cameraSubtitle}>
                Chụp ảnh để nhận diện và học từ vựng
              </Text>
            </View>
            <TouchableOpacity
              style={styles.flashControl}
              onPress={() => setTorchEnabled(current => !current)}
              disabled={!device?.hasTorch}
            >
              <Icon
                name={torchEnabled ? 'flash' : 'flash-outline'}
                size={28}
                color="#fff"
              />
              <Text style={styles.flashText}>Flash</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={styles.sideAction}
              onPress={pickImageFromLibrary}
            >
              <Icon name="image-outline" size={31} color="#fff" />
              <Text style={styles.sideActionText}>Thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Chụp ảnh"
              disabled={loading || !device}
              style={styles.shutterOuter}
              onPress={takePhoto}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideAction}
              onPress={() =>
                setCameraPosition(current =>
                  current === 'back' ? 'front' : 'back',
                )
              }
            >
              <Icon name="sync-outline" size={33} color="#fff" />
              <Text style={styles.sideActionText}>Đổi camera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {loading && (
          <View style={styles.fullLoading}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.fullLoadingText}>Đang nhận diện...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Icon name="chevron-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả nhận diện</Text>
        <TouchableOpacity style={styles.iconButton} onPress={openCamera}>
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

        {items.length === 0 && !loading ? (
          <View style={styles.singleActionWrap}>
            <TouchableOpacity style={styles.captureButtonWide} onPress={openCamera}>
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
              {items.map((item, index) => {
                const selected = selectedWords.includes(item.word);

                return (
                  <TouchableOpacity
                    key={`${item.label}-${item.word}-${index}`}
                    activeOpacity={0.85}
                    style={[styles.wordCard, selected && styles.wordCardSelected]}
                    onPress={() => toggleWord(item.word)}
                  >
                    <View style={styles.radioWrap}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </View>

                    <View style={styles.wordInfo}>
                      <Text style={styles.word}>{item.word}</Text>
                      <Text style={styles.meaning}>
                        {formatIpa(item.ipa) ? `${formatIpa(item.ipa)} - ` : ''}
                        {item.vietnameseMeaning || 'Đang cập nhật nghĩa'}
                      </Text>
                      {!!item.example && (
                        <Text style={styles.example} numberOfLines={3}>
                          {item.example}
                        </Text>
                      )}
                      <View style={styles.metaRow}>
                        <Text style={styles.confidenceText}>
                          Độ tin cậy {Math.round(item.confidence * 100)}%
                        </Text>
                        {!!item.partOfSpeech && (
                          <Text style={styles.partOfSpeechText}>
                            {item.partOfSpeech}
                          </Text>
                        )}
                        {!!item.cefr && (
                          <Text style={styles.partOfSpeechText}>{item.cefr}</Text>
                        )}
                        <TouchableOpacity style={styles.smallTopicButton}>
                          <Text style={styles.smallTopicText}>Chọn chủ đề</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Phát âm ${item.word}`}
                      onPress={(event: GestureResponderEvent) => {
                        event.stopPropagation();
                        playPronunciation(item.word, item.audioUrl);
                      }}
                      style={[
                        styles.soundButton,
                        playingWord === item.word && styles.soundButtonPlaying,
                      ]}
                    >
                      <Icon
                        name={
                          playingWord === item.word
                            ? 'volume-high'
                            : 'volume-medium-outline'
                        }
                        size={20}
                        color={playingWord === item.word ? '#fff' : '#0f8bff'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {items.length > 0 && (
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
  cameraRoot: {
    flex: 1,
    backgroundColor: '#050505',
  },
  cameraUnavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  cameraUnavailableText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  closeCameraButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  flashControl: {
    minWidth: 64,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  flashText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  cameraTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 2,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  cameraSubtitle: {
    marginTop: 5,
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraActions: {
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 46,
    paddingBottom: 20,
  },
  sideAction: {
    width: 78,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sideActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  shutterOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fff',
  },
  fullLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  fullLoadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
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
  singleActionWrap: {
    alignItems: 'center',
  },
  captureButtonWide: {
    width: '100%',
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
    minHeight: 108,
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
    marginBottom: 6,
  },
  example: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
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
  partOfSpeechText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
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
