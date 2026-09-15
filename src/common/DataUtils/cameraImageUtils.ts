import RNFS from 'react-native-fs';
import { DetectedLabel } from '../../services/detectionService';

export const toPercent = (value: number): `${number}%` => {
  const clamped = Math.min(Math.max(value, 0), 1);
  return `${clamped * 100}%`;
};

export const normalizeBox = (
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

export const readImageAsBase64 = async (uri: string): Promise<string> => {
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
