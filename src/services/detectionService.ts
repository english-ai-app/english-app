import { getApiErrorMessage, requestApi } from './api/apiClient';

export type DetectedLabel = {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type DetectApiResponse = {
  success?: boolean;
  message?: string;
  sagaId?: string;
  labels?: DetectedLabel[];
};

type DetectImageApiPayload = {
  userId: number;
  imageBase64: string;
  imageContentType?: string;
  imageFileName?: string;
};

type DetectImagePayload = {
  userId?: number;
  base64?: string;
  type?: string;
  fileName?: string;
};

export type DetectImageResult = {
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
  };

  try {
    const data = await requestApi<DetectApiResponse>({
      url: '/saga/image-vocabulary',
      method: 'POST',
      data: requestBody,
    });

    return {
      labels: Array.isArray(data?.labels) ? data.labels : [],
      message: data?.message,
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không gọi được backend'));
  }
};
