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

    return {
      collectionId: data?.collectionId,
      source: data?.source,
      tempImageKey: data?.tempImageKey,
      items,
      labels: items.map(item => ({
        label: item.label,
        confidence: item.confidence,
        boundingBox: item.boundingBox,
      })),
      message: data?.message,
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không gọi được backend'));
  }
};
