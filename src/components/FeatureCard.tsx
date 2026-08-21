import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type FeatureCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  bgColor: string;
  iconBg: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  subtitle,
  bgColor,
  iconBg,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#4b5563',
  },
});

export default FeatureCard;
