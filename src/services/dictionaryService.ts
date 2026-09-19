import { getApiErrorMessage, requestApi } from './api/apiClient';

export type DictionarySense = {
  senseId: string;
  senseNumber?: string | null;
  usageLabels: string[];
  definition: string;
  meaningVi?: string | null;
  examples: string[];
  exampleItems?: DictionaryExample[];
};

export type DictionaryExample = {
  text: string;
  meaningVi?: string | null;
};

export type DictionaryDefinitionItem = {
  itemId: string;
  senseNumber?: string | null;
  usageLabels: string[];
  definition: string;
  meaningVi?: string | null;
  examples: string[];
  exampleItems?: DictionaryExample[];
  subDefinition: boolean;
};

export type DictionaryDefinitionGroup = {
  groupId: string;
  senseNumber?: string | null;
  usageLabels: string[];
  definitions: DictionaryDefinitionItem[];
  seeAlso: string[];
};

export type DictionaryPhrase = {
  phraseId: string;
  phrase: string;
  usageLabels: string[];
  definitions: string[];
  examples: string[];
};

export type DictionaryEntry = {
  entryId: string;
  word: string;
  partOfSpeech?: string | null;
  ipa?: string | null;
  audioUrl?: string | null;
  inflections: string[];
  senses: DictionarySense[];
  definitionGroups?: DictionaryDefinitionGroup[];
  phrases: DictionaryPhrase[];
  relatedWords: string[];
};

export type DictionarySearchResult = {
  word: string;
  found: boolean;
  suggestions: string[];
  entries: DictionaryEntry[];
};

export type DictionarySuggestResult = {
  prefix: string;
  suggestions: string[];
};

export const searchDictionary = async (
  word: string,
): Promise<DictionarySearchResult> => {
  try {
    return await requestApi<DictionarySearchResult>({
      method: 'GET',
      url: '/api/v1/dictionary/search',
      params: { word: word.trim() },
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tra từ lúc này'));
  }
};

export const suggestDictionaryWords = async (
  prefix: string,
): Promise<DictionarySuggestResult> => {
  try {
    return await requestApi<DictionarySuggestResult>({
      method: 'GET',
      url: '/api/v1/dictionary/suggest',
      params: { prefix: prefix.trim() },
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the goi y tu luc nay'));
  }
};
