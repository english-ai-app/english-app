import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AiAssistantCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>✦</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Gợi ý từ AI</Text>
        <Text style={styles.description}>
          Hôm nay lá thời điểm tốt nhất để học các từ vựng về {'"'}Văn phòng
          {'"'}. Bạn đã chụp ảnh chiếc laptop nào chưa?
        </Text>
      </View>

      <TouchableOpacity style={styles.menuBtn}>
        <Text style={styles.menuText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dff7ff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1ca8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  menuBtn: {
    marginLeft: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 24,
    color: '#4b5563',
  },
});

export default AiAssistantCard;
