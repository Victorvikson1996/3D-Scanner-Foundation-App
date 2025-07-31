import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Camera,
  Scan as Scan3d,
  Download,
  CircleHelp as HelpCircle,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'button' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  icon?: React.ReactNode;
}

export const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    depthEstimation: true,
    autoSave: true,
    highQuality: false,
    hapticFeedback: true,
    cloudSync: false
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all temporary files and cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully!');
          }
        }
      ]
    );
  };

  const handleExportSettings = () => {
    Alert.alert(
      'Export Settings',
      'Export your current settings configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', 'Settings exported successfully!');
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About 3D Scanner',
      'Version 1.0.0\n\nA powerful 3D scanning app that uses advanced computer vision and depth estimation to create detailed point clouds from camera input.\n\nBuilt with React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'For help and support:\n\n• Check the in-app tutorials\n• Visit our documentation\n• Contact support team\n\nThis demo shows the interface structure for a full 3D scanning application.',
      [{ text: 'OK' }]
    );
  };

  const settingsData: SettingItem[] = [
    {
      id: 'camera_section',
      title: 'Camera Settings',
      type: 'info',
      icon: <Camera size={20} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />
    },
    {
      id: 'depth_estimation',
      title: 'Depth Estimation',
      subtitle: 'Use AI-powered depth estimation for better 3D reconstruction',
      type: 'toggle',
      value: settings.depthEstimation,
      onToggle: (value) => updateSetting('depthEstimation', value)
    },
    {
      id: 'high_quality',
      title: 'High Quality Mode',
      subtitle: 'Capture at maximum resolution (slower processing)',
      type: 'toggle',
      value: settings.highQuality,
      onToggle: (value) => updateSetting('highQuality', value)
    },
    {
      id: 'scanning_section',
      title: 'Scanning Settings',
      type: 'info',
      icon: <Scan3d size={20} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />
    },
    {
      id: 'auto_save',
      title: 'Auto Save',
      subtitle: 'Automatically save scans after completion',
      type: 'toggle',
      value: settings.autoSave,
      onToggle: (value) => updateSetting('autoSave', value)
    },
    {
      id: 'haptic_feedback',
      title: 'Haptic Feedback',
      subtitle: 'Vibrate on scan events and interactions',
      type: 'toggle',
      value: settings.hapticFeedback,
      onToggle: (value) => updateSetting('hapticFeedback', value)
    },
    {
      id: 'cloud_sync',
      title: 'Cloud Sync',
      subtitle: 'Sync point clouds across devices',
      type: 'toggle',
      value: settings.cloudSync,
      onToggle: (value) => updateSetting('cloudSync', value)
    },
    {
      id: 'data_section',
      title: 'Data Management',
      type: 'info',
      icon: <Download size={20} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />
    },
    {
      id: 'export_settings',
      title: 'Export Settings',
      subtitle: 'Save current configuration',
      type: 'button',
      onPress: handleExportSettings
    },
    {
      id: 'clear_cache',
      title: 'Clear Cache',
      subtitle: 'Remove temporary files and cached data',
      type: 'button',
      onPress: handleClearCache
    },
    {
      id: 'support_section',
      title: 'Support',
      type: 'info',
      icon: <HelpCircle size={20} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      type: 'button',
      onPress: handleHelp
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      type: 'button',
      onPress: handleAbout
    }
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'info') {
      return (
        <View key={item.id} style={styles.sectionHeader}>
          {item.icon}
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    return (
      <View key={item.id} style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: 'rgba(255, 255, 255, 0.2)',
              true: SCANNER_CONSTANTS.COLORS.PRIMARY
            }}
            thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
          />
        )}

        {item.type === 'button' && (
          <Button
            title='Open'
            onPress={item.onPress || (() => {})}
            variant='outline'
            size='small'
            style={styles.settingButton}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style='light' />

      <View style={styles.header}>
        <SettingsIcon size={28} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsData.map(renderSettingItem)}

        <View style={styles.footer}>
          <Text style={styles.footerText}>3D Scanner v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Built with React Native & Expo
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    gap: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: SCANNER_CONSTANTS.UI.BORDER_RADIUS,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  settingContent: {
    flex: 1,
    marginRight: 16
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 2
  },
  settingSubtitle: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    lineHeight: 18
  },
  settingButton: {
    minWidth: 80
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20
  },
  footerText: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: 4
  },
  footerSubtext: {
    fontSize: 12,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    opacity: 0.7
  }
});
