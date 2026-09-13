export type TopicVisibility = 'private' | 'public';

export type VocabularyTopic = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  visibility: TopicVisibility;
  favorite?: boolean;
  used?: boolean;
};

export type CreateTopicPayload = {
  name: string;
  description?: string;
  icon: string;
  color: string;
  visibility: TopicVisibility;
};

const mockTopics: VocabularyTopic[] = [
  {
    id: 'home-objects',
    name: 'Đồ vật trong nhà',
    description: 'Các đồ dùng, vật dụng trong nhà',
    icon: 'home',
    color: '#ef4444',
    visibility: 'private',
    used: true,
  },
  {
    id: 'food',
    name: 'Food',
    description: 'Đồ ăn, thức uống',
    icon: 'restaurant',
    color: '#f43f1f',
    visibility: 'public',
    favorite: true,
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Du lịch, phương tiện đi lại',
    icon: 'airplane',
    color: '#0ea5e9',
    visibility: 'public',
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Công việc, văn phòng',
    icon: 'briefcase',
    color: '#f97316',
    visibility: 'private',
  },
  {
    id: 'school',
    name: 'School',
    description: 'Học tập, trường học',
    icon: 'book',
    color: '#0ea5e9',
    visibility: 'public',
  },
  {
    id: 'daily-life',
    name: 'Daily Life',
    description: 'Cuộc sống hằng ngày',
    icon: 'water',
    color: '#f59e0b',
    visibility: 'private',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Đồ dùng nhà bếp',
    icon: 'school',
    color: '#ef4444',
    visibility: 'private',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Khác',
    icon: 'radio-button-on',
    color: '#2563eb',
    visibility: 'public',
  },
];

let topics = [...mockTopics];

const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const getVocabularyTopics = async (): Promise<VocabularyTopic[]> => {
  await wait(250);
  return topics;
};

export const createVocabularyTopic = async (
  payload: CreateTopicPayload,
): Promise<VocabularyTopic> => {
  await wait(250);

  const topic: VocabularyTopic = {
    id: `topic-${Date.now()}`,
    name: payload.name.trim(),
    description: payload.description?.trim() || 'Chủ đề tự tạo',
    icon: payload.icon,
    color: payload.color,
    visibility: payload.visibility,
    used: true,
  };

  topics = [topic, ...topics];
  return topic;
};
