import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomNav, { BottomTabKey } from '../components/BottomNav';
import { AppScreenKey } from './HomeScreen';

type SimpleFeatureScreenProps = {
  title: string;
  subtitle: string;
  icon: string;
  activeTab?: BottomTabKey;
  onBack?: () => void;
  onOpenAddWord?: () => void;
  onNavigate?: (screen: AppScreenKey) => void;
};

const SimpleFeatureScreen: React.FC<SimpleFeatureScreenProps> = ({
  title,
  subtitle,
  icon,
  activeTab = 'home',
  onBack,
  onOpenAddWord,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <Icon name="chevron-back" size={22} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureIconText}>{icon}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <BottomNav
          activeTab={activeTab}
          onAddPress={onOpenAddWord}
          onTabPress={onNavigate}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 88,
  },
  featureIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureIconText: {
    fontSize: 34,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default SimpleFeatureScreen;
