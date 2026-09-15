import { DetectionVocabularyItem } from '../../services/detectionService';

export const formatIpa = (ipa?: string): string => {
  if (!ipa) return '';
  return ipa.startsWith('/') ? ipa : `/${ipa}/`;
};

export const getItemKey = (
  item: DetectionVocabularyItem,
  index?: number,
): string => `${item.label}-${item.word}-${index ?? 0}`;
