import { getApiErrorMessage, requestApi } from './api/apiClient';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectedLabel = {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
};

export type DetectionVocabularyItem = {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
  wordId?: number | null;
  word: string;
  ipa?: string;
  vietnameseMeaning?: string;
  partOfSpeech?: string;
  example?: string;
  audioUrl?: string;
  cefr?: string;
};

type DetectApiResponse = {
  success?: boolean;
  message?: string;
  sagaId?: string;
  collectionId?: number | null;
  source?: string;
  tempImageKey?: string | null;
  labels?: DetectedLabel[];
  items?: DetectionVocabularyItem[];
};

type DetectImageApiPayload = {
  userId: number;
  imageBase64: string;
  imageContentType?: string;
  imageFileName?: string;
  collectionId?: number;
  tempImageKey?: string;
};

type DetectImagePayload = {
  userId?: number;
  base64?: string;
  type?: string;
  fileName?: string;
  imageWidth?: number;
  imageHeight?: number;
  collectionId?: number;
  tempImageKey?: string;
};

export type DetectImageResult = {
  collectionId?: number | null;
  source?: string;
  tempImageKey?: string | null;
  items: DetectionVocabularyItem[];
  labels: DetectedLabel[];
  message?: string;
};

const normalizeBoundingBox = (
  box?: BoundingBox,
  imageWidth?: number,
  imageHeight?: number,
): BoundingBox | undefined => {
  if (!box) return undefined;

  const maxValue = Math.max(box.x, box.y, box.width, box.height);
  if (maxValue <= 1) {
    return box;
  }

  if (box.x + box.width <= 100 && box.y + box.height <= 100) {
    return {
      x: box.x / 100,
      y: box.y / 100,
      width: box.width / 100,
      height: box.height / 100,
    };
  }

  if (imageWidth && imageHeight) {
    return {
      x: box.x / imageWidth,
      y: box.y / imageHeight,
      width: box.width / imageWidth,
      height: box.height / imageHeight,
    };
  }

  return box;
};

export const detectObjectFromImage = async (
  payload: DetectImagePayload,
): Promise<DetectImageResult> => {
  if (!payload.base64) {
    throw new Error('Không lấy được dữ liệu ảnh base64');
  }

  const requestBody: DetectImageApiPayload = {
    userId: payload.userId || 1,
    imageBase64: payload.base64,
    imageContentType: payload.type || 'image/jpeg',
    imageFileName: payload.fileName || 'photo.jpg',
    collectionId: payload.collectionId,
    tempImageKey: payload.tempImageKey,
  };

  try {
    const data = await requestApi<DetectApiResponse>({
      url: '/saga/image-vocabulary',
      method: 'POST',
      data: requestBody,
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    const labels = Array.isArray(data?.labels)
      ? data.labels
      : items.map(item => ({
          label: item.label,
          confidence: item.confidence,
          boundingBox: item.boundingBox,
        }));
    const normalizedItems = items.map(item => ({
      ...item,
      boundingBox: normalizeBoundingBox(
        item.boundingBox,
        payload.imageWidth,
        payload.imageHeight,
      ),
    }));

    return {
      collectionId: data?.collectionId,
      source: data?.source,
      tempImageKey: data?.tempImageKey,
      items: normalizedItems,
      labels: labels.map(item => ({
        label: item.label,
        confidence: item.confidence,
        boundingBox: normalizeBoundingBox(
          item.boundingBox,
          payload.imageWidth,
          payload.imageHeight,
        ),
      })),
      message: data?.message,
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không gọi được backend'));
  }
};
