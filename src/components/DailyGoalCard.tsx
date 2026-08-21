import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const DailyGoalCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Thành tích tuyệt vời!</Text>
        <Text style={styles.body}>
          Bạn đã duy trì chuỗi học tập trong 12 ngày liên tiếp.
        </Text>
        <Text style={styles.body}>Tiếp tục phát huy nhé!</Text>

        <View style={styles.ctaWrap}>
          <Text style={styles.ctaText}>Chia sẻ ngay</Text>
        </View>
      </View>

      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
        }}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 18,
    borderRadius: 18,
    marginBottom: 22,
  },
  textBlock: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  ctaWrap: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 14,
  },
});

export default DailyGoalCard;
