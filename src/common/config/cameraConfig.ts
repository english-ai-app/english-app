export const topicFilterOptions = [
  { key: 'suggested', label: 'Gợi ý' },
  { key: 'all', label: 'Tất cả' },
  { key: 'used', label: 'Đã dùng' },
  { key: 'favorite', label: 'Yêu thích' },
] as const;

export const newTopicIconOptions = [
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
] as const;

export type TopicFilterKey = (typeof topicFilterOptions)[number]['key'];
