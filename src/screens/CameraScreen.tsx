import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  createVocabularyTopic,
  getVocabularyTopics,
  VocabularyTopic,
  TopicVisibility,
} from '../services/topicService';

const toPercent = (value: number): `${number}%` => {
  const clamped = Math.min(Math.max(value, 0), 1);
  return `${clamped * 100}%`;
};

const normalizeBox = (
  box: NonNullable<DetectedLabel['boundingBox']>,
): NonNullable<DetectedLabel['boundingBox']> => {
  const maxValue = Math.max(box.x, box.y, box.width, box.height);

  if (maxValue <= 1) {
    return box;
  }

  return {
    x: box.x / 100,
    y: box.y / 100,
    width: box.width / 100,
    height: box.height / 100,
  };
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

const getItemKey = (item: DetectionVocabularyItem, index?: number): string =>
  `${item.label}-${item.word}-${index ?? 0}`;

type Size = {
  width: number;
  height: number;
};

type CameraMode = 'camera' | 'result' | 'topicPicker' | 'createTopic';
type CameraPosition = 'back' | 'front';
type TopicTarget =
  | {
      type: 'all';
    }
  | {
      type: 'item';
      itemKey: string;
      item: DetectionVocabularyItem;
    };

const topicFilterOptions = [
  { key: 'suggested', label: 'Gợi ý' },
  { key: 'all', label: 'Tất cả' },
  { key: 'used', label: 'Đã dùng' },
  { key: 'favorite', label: 'Yêu thích' },
] as const;

const newTopicIconOptions = [
  { icon: 'home', color: '#0f8bff' },
  { icon: 'bed', color: '#2563eb' },
  { icon: 'briefcase', color: '#f97316' },
  { icon: 'book', color: '#0ea5e9' },
  { icon: 'game-controller', color: '#2563eb' },
  { icon: 'leaf', color: '#22c55e' },
  { icon: 'heart', color: '#ef4444' },
  { icon: 'airplane', color: '#0ea5e9' },
  { icon: 'restaurant', color: '#f43f1f' },
  { icon: 'school', color: '#7c3aed' },
  { icon: 'ellipsis-horizontal', color: '#1d4ed8' },
];

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
  const [topics, setTopics] = useState<VocabularyTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<'suggested' | 'all' | 'used' | 'favorite'>('suggested');
  const [topicTarget, setTopicTarget] = useState<TopicTarget>({ type: 'all' });
  const [draftTopicIds, setDraftTopicIds] = useState<string[]>([]);
  const [allTopicIds, setAllTopicIds] = useState<string[]>([]);
  const [itemTopicIds, setItemTopicIds] = useState<Record<string, string[]>>({});
  const [hiddenTopics, setHiddenTopics] = useState<VocabularyTopic[] | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [newTopicIcon, setNewTopicIcon] = useState('home');
  const [newTopicColor, setNewTopicColor] = useState('#0f8bff');
  const [newTopicVisibility, setNewTopicVisibility] =
    useState<TopicVisibility>('private');

  const device = useCameraDevice(cameraPosition);
  const selectedCount = selectedWords.length;
  const boxedLabels = useMemo(
    () => labels.filter(item => item.boundingBox).slice(0, 12),
    [labels],
  );
  const hasIndividualTopics = useMemo(
    () => Object.values(itemTopicIds).some(topicIds => topicIds.length > 0),
    [itemTopicIds],
  );
  const topicById = useMemo(() => {
    return topics.reduce<Record<string, VocabularyTopic>>((acc, topic) => {
      acc[topic.id] = topic;
      return acc;
    }, {});
  }, [topics]);
  const filteredTopics = useMemo(() => {
    const keyword = topicSearch.trim().toLowerCase();

    return topics.filter(topic => {
      if (topicFilter === 'used' && !topic.used) return false;
      if (topicFilter === 'favorite' && !topic.favorite) return false;
      if (keyword) {
        const searchable = `${topic.name} ${topic.description}`.toLowerCase();
        if (!searchable.includes(keyword)) return false;
      }

      return true;
    });
  }, [topicFilter, topicSearch, topics]);

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

  useEffect(() => {
    let active = true;

    const loadTopics = async (): Promise<void> => {
      setTopicsLoading(true);
      try {
        const data = await getVocabularyTopics();
        if (active) {
          setTopics(data);
        }
      } catch {
        if (active) {
          Alert.alert('Lỗi', 'Không tải được danh sách chủ đề');
        }
      } finally {
        if (active) {
          setTopicsLoading(false);
        }
      }
    };

    loadTopics();

    return () => {
      active = false;
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
      setAllTopicIds([]);
      setItemTopicIds({});
      setMode('result');
      setLoading(true);

      try {
        const detectResult = await detectObjectFromImage({
          base64: payload.base64,
          type: payload.type,
          fileName: payload.fileName,
          imageWidth: payload.width,
          imageHeight: payload.height,
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
    const normalizedBox = normalizeBox(box);

    if (!imageSize || !previewSize) {
      return {
        left: toPercent(normalizedBox.x),
        top: toPercent(normalizedBox.y),
        width: toPercent(normalizedBox.width),
        height: toPercent(normalizedBox.height),
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
      left: offsetX + normalizedBox.x * renderedWidth,
      top: offsetY + normalizedBox.y * renderedHeight,
      width: normalizedBox.width * renderedWidth,
      height: normalizedBox.height * renderedHeight,
    };
  };

  const getTopicPreviewImageStyle = () => {
    if (
      topicTarget.type !== 'item' ||
      !topicTarget.item.boundingBox ||
      !imageSize
    ) {
      return styles.topicPreviewImage;
    }

    const box = normalizeBox(topicTarget.item.boundingBox);
    const previewWidth = 76;
    const previewHeight = 76;
    const boxWidth = Math.max(box.width * imageSize.width, 1);
    const boxHeight = Math.max(box.height * imageSize.height, 1);
    const scale = Math.max(previewWidth / boxWidth, previewHeight / boxHeight);
    const scaledImageWidth = imageSize.width * scale;
    const scaledImageHeight = imageSize.height * scale;
    const boxCenterX = (box.x + box.width / 2) * scaledImageWidth;
    const boxCenterY = (box.y + box.height / 2) * scaledImageHeight;

    return [
      styles.topicPreviewImage,
      {
        position: 'absolute' as const,
        width: scaledImageWidth,
        height: scaledImageHeight,
        left: previewWidth / 2 - boxCenterX,
        top: previewHeight / 2 - boxCenterY,
      },
    ];
  };

  const getTopicsFromIds = useCallback(
    (topicIds: string[]): VocabularyTopic[] =>
      topicIds.map(id => topicById[id]).filter(Boolean),
    [topicById],
  );

  const openTopicPicker = useCallback(
    (target: TopicTarget): void => {
      if (target.type === 'all' && hasIndividualTopics) return;

      setTopicTarget(target);
      setTopicSearch('');
      setTopicFilter('suggested');
      setDraftTopicIds(
        target.type === 'all'
          ? allTopicIds
          : itemTopicIds[target.itemKey] || [],
      );
      setMode('topicPicker');
    },
    [allTopicIds, hasIndividualTopics, itemTopicIds],
  );

  const toggleDraftTopic = (topicId: string): void => {
    setDraftTopicIds(current =>
      current.includes(topicId)
        ? current.filter(id => id !== topicId)
        : [...current, topicId],
    );
  };

  const confirmTopics = (): void => {
    if (topicTarget.type === 'all') {
      setAllTopicIds(draftTopicIds);
    } else {
      setAllTopicIds([]);
      setItemTopicIds(current => ({
        ...current,
        [topicTarget.itemKey]: draftTopicIds,
      }));
    }

    setMode('result');
  };

  const removeTopic = (target: TopicTarget, topicId: string): void => {
    if (target.type === 'all') {
      setAllTopicIds(current => current.filter(id => id !== topicId));
      return;
    }

    setItemTopicIds(current => ({
      ...current,
      [target.itemKey]: (current[target.itemKey] || []).filter(
        id => id !== topicId,
      ),
    }));
  };

  const createTopic = async (): Promise<void> => {
    const name = newTopicName.trim();
    if (!name) {
      Alert.alert('Thiếu tên chủ đề', 'Vui lòng nhập tên chủ đề.');
      return;
    }

    setTopicsLoading(true);
    try {
      const topic = await createVocabularyTopic({
        name,
        description: newTopicDescription,
        icon: newTopicIcon,
        color: newTopicColor,
        visibility: newTopicVisibility,
      });
      setTopics(current => [topic, ...current]);
      setDraftTopicIds(current => [...current, topic.id]);
      setNewTopicName('');
      setNewTopicDescription('');
      setNewTopicIcon('home');
      setNewTopicColor('#0f8bff');
      setNewTopicVisibility('private');
      setMode('topicPicker');
    } catch {
      Alert.alert('Lỗi', 'Không tạo được chủ đề mới');
    } finally {
      setTopicsLoading(false);
    }
  };

  const renderTopicChips = (
    selectedTopics: VocabularyTopic[],
    target: TopicTarget,
  ) => {
    if (selectedTopics.length === 0) {
      return (
        <View style={styles.topicPickerPill}>
          <Text style={styles.topicPickerPillText}>Chọn chủ đề</Text>
          <Icon name="chevron-forward" size={14} color="#fff" />
        </View>
      );
    }

    const visibleTopics = selectedTopics.slice(0, 1);
    const overflowTopics = selectedTopics.slice(1);

    return (
      <View style={styles.topicChipRow}>
        {visibleTopics.map(topic => (
          <TouchableOpacity
            key={topic.id}
            activeOpacity={0.8}
            style={styles.selectedTopicChip}
            onPress={event => event.stopPropagation()}
          >
            <Text numberOfLines={1} style={styles.selectedTopicText}>
              {topic.name}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Bỏ chủ đề ${topic.name}`}
              onPress={event => {
                event.stopPropagation();
                removeTopic(target, topic.id);
              }}
              style={styles.selectedTopicRemove}
            >
              <Icon name="close" size={12} color="#2563eb" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {overflowTopics.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.moreTopicChip}
            onPress={event => {
              event.stopPropagation();
              setHiddenTopics(overflowTopics);
            }}
          >
            <Text style={styles.moreTopicText}>...</Text>
          </TouchableOpacity>
        )}
      </View>
    );
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

  if (mode === 'topicPicker') {
    const previewItem = topicTarget.type === 'item' ? topicTarget.item : items[0];

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topicScreenHeader}>
          <TouchableOpacity
            style={styles.topicBackButton}
            onPress={() => setMode('result')}
          >
            <Icon name="chevron-back" size={24} color="#0f63ff" />
          </TouchableOpacity>
          <Text style={styles.topicScreenTitle}>Chọn chủ đề</Text>
          <View style={styles.topicHeaderSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.topicScreenContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topicObjectCard}>
            <View style={styles.topicPreviewThumb}>
              {imageUri ? (
                <Image
                  resizeMode={topicTarget.type === 'all' ? 'contain' : 'cover'}
                  source={{ uri: imageUri }}
                  style={getTopicPreviewImageStyle()}
                />
              ) : (
                <Icon name="image-outline" size={28} color="#94a3b8" />
              )}
            </View>
            <View style={styles.topicObjectInfo}>
              <Text style={styles.topicObjectWord}>
                {topicTarget.type === 'all' ? 'Áp dụng cho tất cả' : previewItem?.word}
              </Text>
              {topicTarget.type === 'item' && (
                <>
                  {!!formatIpa(previewItem?.ipa) && (
                    <Text style={styles.topicObjectIpa}>
                      {formatIpa(previewItem?.ipa)}
                    </Text>
                  )}
                  <View style={styles.topicObjectMeta}>
                    <Text style={styles.topicObjectMetaText}>
                      {previewItem?.confidence
                        ? `${Math.round(previewItem.confidence * 100)}%`
                        : 'Object'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.topicSearchBox}>
            <Icon name="search" size={19} color="#7c9ac4" />
            <TextInput
              value={topicSearch}
              onChangeText={setTopicSearch}
              placeholder="Tìm chủ đề..."
              placeholderTextColor="#8aa2c7"
              style={styles.topicSearchInput}
            />
          </View>

          <View style={styles.topicFilterRow}>
            {topicFilterOptions.map(option => {
              const active = topicFilter === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  style={[
                    styles.topicFilterButton,
                    active && styles.topicFilterButtonActive,
                  ]}
                  onPress={() => setTopicFilter(option.key)}
                >
                  <Text
                    style={[
                      styles.topicFilterText,
                      active && styles.topicFilterTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.topicList}>
            {topicsLoading && topics.length === 0 ? (
              <ActivityIndicator color="#0f8bff" />
            ) : (
              filteredTopics.map(topic => {
                const selected = draftTopicIds.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    activeOpacity={0.86}
                    style={styles.topicOption}
                    onPress={() => toggleDraftTopic(topic.id)}
                  >
                    <View
                      style={[
                        styles.topicOptionIcon,
                        { backgroundColor: `${topic.color}18` },
                      ]}
                    >
                      <Icon name={topic.icon} size={25} color={topic.color} />
                    </View>
                    <View style={styles.topicOptionInfo}>
                      <Text style={styles.topicOptionName}>{topic.name}</Text>
                      <Text numberOfLines={1} style={styles.topicOptionDesc}>
                        {topic.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.topicOptionRadio,
                        selected && styles.topicOptionRadioSelected,
                      ]}
                    >
                      {selected && <View style={styles.topicOptionRadioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.createTopicButton}
            onPress={() => setMode('createTopic')}
          >
            <Icon name="add" size={20} color="#0f63ff" />
            <Text style={styles.createTopicButtonText}>Tạo chủ đề mới</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.topicFooter}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.confirmTopicButton}
            onPress={confirmTopics}
          >
            <Text style={styles.confirmTopicText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'createTopic') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topicScreenHeader}>
          <TouchableOpacity
            style={styles.topicBackButton}
            onPress={() => setMode('topicPicker')}
          >
            <Icon name="chevron-back" size={24} color="#0f63ff" />
          </TouchableOpacity>
          <Text style={styles.topicScreenTitle}>Tạo chủ đề mới</Text>
          <View style={styles.topicHeaderSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.createTopicContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.inputLabel}>Tên chủ đề *</Text>
          <TextInput
            value={newTopicName}
            onChangeText={setNewTopicName}
            placeholder="My Room"
            placeholderTextColor="#8aa2c7"
            style={styles.topicTextInput}
          />

          <Text style={styles.inputLabel}>Mô tả (tùy chọn)</Text>
          <TextInput
            value={newTopicDescription}
            onChangeText={setNewTopicDescription}
            multiline
            placeholder="Các đồ vật trong phòng của tôi"
            placeholderTextColor="#8aa2c7"
            style={[styles.topicTextInput, styles.topicTextArea]}
          />

          <Text style={styles.inputLabel}>Chọn icon</Text>
          <View style={styles.iconGrid}>
            {newTopicIconOptions.map(option => {
              const active = newTopicIcon === option.icon;
              return (
                <TouchableOpacity
                  key={option.icon}
                  activeOpacity={0.84}
                  style={[
                    styles.iconChoice,
                    active && styles.iconChoiceActive,
                  ]}
                  onPress={() => {
                    setNewTopicIcon(option.icon);
                    setNewTopicColor(option.color);
                  }}
                >
                  <Icon name={option.icon} size={25} color={option.color} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Chế độ hiển thị</Text>
          {[
            {
              key: 'private' as const,
              icon: 'lock-closed',
              title: 'Riêng tư',
              subtitle: 'Chỉ mình tôi thấy',
            },
            {
              key: 'public' as const,
              icon: 'globe-outline',
              title: 'Công khai',
              subtitle: 'Mọi người có thể thấy (cộng đồng)',
            },
          ].map(option => {
            const active = newTopicVisibility === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                activeOpacity={0.86}
                style={[
                  styles.visibilityOption,
                  active && styles.visibilityOptionActive,
                ]}
                onPress={() => setNewTopicVisibility(option.key)}
              >
                <View
                  style={[
                    styles.visibilityRadio,
                    active && styles.visibilityRadioActive,
                  ]}
                >
                  {active && <View style={styles.visibilityRadioDot} />}
                </View>
                <Icon name={option.icon} size={20} color="#1d4ed8" />
                <View style={styles.visibilityInfo}>
                  <Text style={styles.visibilityTitle}>{option.title}</Text>
                  <Text style={styles.visibilitySubtitle}>{option.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.topicFooter}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={topicsLoading}
            style={[
              styles.confirmTopicButton,
              topicsLoading && styles.confirmTopicButtonDisabled,
            ]}
            onPress={createTopic}
          >
            <Text style={styles.confirmTopicText}>
              {topicsLoading ? 'Đang tạo...' : 'Tạo chủ đề'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              <TouchableOpacity
                activeOpacity={hasIndividualTopics ? 1 : 0.85}
                disabled={hasIndividualTopics}
                style={[
                  styles.topicButton,
                  hasIndividualTopics && styles.topicButtonDisabled,
                ]}
                onPress={() => openTopicPicker({ type: 'all' })}
              >
                {renderTopicChips(getTopicsFromIds(allTopicIds), { type: 'all' })}
              </TouchableOpacity>
            </View>

            <View style={styles.wordsList}>
              {items.map((item, index) => {
                const selected = selectedWords.includes(item.word);
                const itemKey = getItemKey(item, index);
                const ownTopicIds = itemTopicIds[itemKey] || [];
                const itemTopics = getTopicsFromIds(
                  ownTopicIds.length > 0 ? ownTopicIds : allTopicIds,
                );
                const itemTopicChipTarget =
                  ownTopicIds.length > 0
                    ? ({ type: 'item', itemKey, item } as const)
                    : ({ type: 'all' } as const);

                return (
                  <TouchableOpacity
                    key={itemKey}
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
                      <View style={styles.metaRow}>
                        <Text style={styles.confidenceText}>
                          Độ tin cậy {Math.round(item.confidence * 100)}%
                        </Text>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={styles.smallTopicButton}
                          onPress={(event: GestureResponderEvent) => {
                            event.stopPropagation();
                            openTopicPicker({ type: 'item', itemKey, item });
                          }}
                        >
                          {renderTopicChips(itemTopics, itemTopicChipTarget)}
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

      <Modal
        transparent
        visible={!!hiddenTopics}
        animationType="fade"
        onRequestClose={() => setHiddenTopics(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.tooltipBackdrop}
          onPress={() => setHiddenTopics(null)}
        >
          <View style={styles.tooltipCard}>
            <Text style={styles.tooltipTitle}>Chủ đề đã chọn</Text>
            {(hiddenTopics || []).map(topic => (
              <Text key={topic.id} style={styles.tooltipItem}>
                {topic.name}
              </Text>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  topicScreenHeader: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  topicBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicScreenTitle: {
    color: '#172554',
    fontSize: 17,
    fontWeight: '900',
  },
  topicHeaderSpacer: {
    width: 40,
  },
  topicScreenContent: {
    paddingHorizontal: 16,
    paddingBottom: 104,
  },
  createTopicContent: {
    paddingHorizontal: 16,
    paddingBottom: 104,
  },
  topicObjectCard: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf4ff',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  topicPreviewThumb: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#eef6ff',
  },
  topicPreviewImage: {
    width: 76,
    height: 76,
  },
  topicObjectInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  topicObjectWord: {
    color: '#172554',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  topicObjectIpa: {
    marginTop: 4,
    color: '#7c9ac4',
    fontSize: 14,
    fontWeight: '700',
  },
  topicObjectMeta: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 9,
    backgroundColor: '#eaf2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicObjectMetaText: {
    color: '#2f64b7',
    fontSize: 11,
    fontWeight: '800',
  },
  topicSearchBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#edf6ff',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  topicSearchInput: {
    flex: 1,
    color: '#172554',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
    marginLeft: 8,
  },
  topicFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  topicFilterButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    backgroundColor: '#f5f9ff',
    paddingHorizontal: 13,
  },
  topicFilterButtonActive: {
    borderColor: '#0f8bff',
    backgroundColor: '#fff',
  },
  topicFilterText: {
    color: '#6482b4',
    fontSize: 12,
    fontWeight: '800',
  },
  topicFilterTextActive: {
    color: '#0f63ff',
  },
  topicList: {
    borderWidth: 1,
    borderColor: '#e6eef8',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  topicOption: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6eef8',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  topicOptionIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  topicOptionInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  topicOptionName: {
    color: '#172554',
    fontSize: 14,
    fontWeight: '900',
  },
  topicOptionDesc: {
    marginTop: 4,
    color: '#59769f',
    fontSize: 12,
    fontWeight: '600',
  },
  topicOptionRadio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#a8c3e8',
    borderRadius: 10,
    marginLeft: 10,
  },
  topicOptionRadioSelected: {
    borderColor: '#0f63ff',
  },
  topicOptionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0f63ff',
  },
  createTopicButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#0f8bff',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  createTopicButtonText: {
    color: '#0f63ff',
    fontSize: 14,
    fontWeight: '900',
  },
  topicFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  confirmTopicButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f8bff',
  },
  confirmTopicButtonDisabled: {
    opacity: 0.6,
  },
  confirmTopicText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  inputLabel: {
    color: '#172554',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 7,
  },
  topicTextInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#cfe0f5',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#172554',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  topicTextArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconChoice: {
    width: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    backgroundColor: '#eef7ff',
  },
  iconChoiceActive: {
    borderColor: '#0f63ff',
    backgroundColor: '#dceeff',
  },
  visibilityOption: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8e7f8',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  visibilityOptionActive: {
    borderColor: '#0f8bff',
    backgroundColor: '#f8fbff',
  },
  visibilityRadio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#a8c3e8',
    borderRadius: 9,
    marginRight: 10,
  },
  visibilityRadioActive: {
    borderColor: '#0f63ff',
  },
  visibilityRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f63ff',
  },
  visibilityInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  visibilityTitle: {
    color: '#172554',
    fontSize: 13,
    fontWeight: '900',
  },
  visibilitySubtitle: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 16,
  },
  tooltipTitle: {
    color: '#172554',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  tooltipItem: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 4,
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
  },
  topicButtonDisabled: {
    opacity: 0.45,
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
    maxWidth: '100%',
    borderRadius: 12,
  },
  smallTopicText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  topicPickerPill: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    backgroundColor: '#0f8bff',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicPickerPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  topicChipRow: {
    maxWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  selectedTopicChip: {
    maxWidth: 118,
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#e7f1ff',
    paddingLeft: 9,
    paddingRight: 4,
  },
  selectedTopicText: {
    maxWidth: 82,
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  selectedTopicRemove: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#fff',
    marginLeft: 4,
  },
  moreTopicChip: {
    minWidth: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#dbeafe',
  },
  moreTopicText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '900',
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

