import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PracticeCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Luyện tập thông minh</Text>
        <Text style={styles.link}>Xem tất cả</Text>
      </View>

      <View style={styles.mainCard}>
        <View style={styles.badgeRow}>
          <Text style={styles.tag}>Ôn tập SRS</Text>
          <Text style={styles.meta}>◔ 10 phút</Text>
        </View>

        <Text style={styles.highlight}>Sẵn sàng để ôn tập?</Text>
        <Text style={styles.description}>
          Hệ thống AI đã chuẩn bị 15 từ vựng cần củng cố hôm nay.
        </Text>

        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Bắt đầu ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '700',
  },
  link: {
    fontSize: 15,
    color: '#1ca8ff',
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#edf7f0',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#dfeee4',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#dff6ff',
    color: '#0f766e',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  meta: {
    color: '#6b7280',
    fontSize: 13,
  },
  highlight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#1ca8ff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: 150,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PracticeCard;
