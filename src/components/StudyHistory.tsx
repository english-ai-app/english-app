import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const completed = [true, true, true, true, false, false, false];

const StudyHistory: React.FC = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Lịch sử tuần này</Text>

      <View style={styles.row}>
        {days.map((day, index) => (
          <View key={day} style={styles.dayWrap}>
            <Text style={styles.dayText}>{day}</Text>
            <View
              style={[
                styles.dot,
                completed[index] ? styles.dotDone : styles.dotIdle,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayWrap: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 10,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  dotDone: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  dotIdle: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
});

export default StudyHistory;
