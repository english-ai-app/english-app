import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProgressCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.progressWrap}>
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <Text style={styles.percentText}>65%</Text>
            <Text style={styles.labelText}>Mục tiêu</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.dayText}>Hôm nay</Text>
        <Text style={styles.detailText}>Bạn đã hoàn thành</Text>
        <Text style={styles.detailText}>13/20 từ vựng mới.</Text>

        <View style={styles.rowStats}>
          <Text style={styles.metaText}>Tiến độ</Text>
          <Text style={styles.metaText}>1.250 XP / 2.000</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressWrap: {
    marginRight: 18,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#dfe7ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 8,
    borderColor: '#1ca8ff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  percentText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1ca8ff',
  },
  labelText: {
    fontSize: 12,
    color: '#4b5563',
  },
  infoBlock: {
    flex: 1,
  },
  dayText: {
    fontSize: 28,
    color: '#1f2937',
    fontWeight: '700',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  rowStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#1ca8ff',
    borderRadius: 10,
  },
});

export default ProgressCard;
