import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HeaderBar: React.FC = () => {
  return (
    <View style={styles.wrapper}>
      {/* <View style={styles.statusRow}>
        <Text style={styles.timeText}>9:41</Text>
        <Text style={styles.statusText}>📶 ▣ 🔋</Text>
      </View> */}

      <View style={styles.mainRow}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>◌</Text>
        </View>

        <Text style={styles.brandText}>SnapLingua</Text>

        <View style={styles.headerRight}>
          <View style={styles.bubbleSmall}>
            <Text style={styles.bubbleText}>◔</Text>
          </View>
          <View style={styles.bubbleLight}>
            <Text style={styles.bubbleText}>☆</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusText: {
    fontSize: 16,
    color: '#111827',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1ca8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  brandText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bubbleLight: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f4e8b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: 16,
  },
});

export default HeaderBar;
