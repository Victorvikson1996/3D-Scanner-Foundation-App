import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Download, Share, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import { PointCloud } from '@/types/Scanner';

const mockPointClouds: PointCloud[] = [
  {
    id: 'scan_1',
    name: 'Coffee Mug',
    points: [],
    timestamp: Date.now() - 3600000,
    metadata: {
      deviceType: 'iPhone 15 Pro',
      scanDuration: 25000,
      pointCount: 15420,
      boundingBox: {
        min: { x: -0.5, y: -0.3, z: 0 },
        max: { x: 0.5, y: 0.3, z: 0.8 }
      }
    }
  },
  {
    id: 'scan_2',
    name: 'Small Plant',
    points: [],
    timestamp: Date.now() - 7200000,
    metadata: {
      deviceType: 'iPhone 15 Pro',
      scanDuration: 45000,
      pointCount: 28750,
      boundingBox: {
        min: { x: -0.8, y: -0.8, z: 0 },
        max: { x: 0.8, y: 0.8, z: 1.2 }
      }
    }
  }
];

export const ViewerScreen = () => {
  const [pointClouds, setPointClouds] = useState<PointCloud[]>(mockPointClouds);
  const [selectedCloud, setSelectedCloud] = useState<PointCloud | null>(null);
  const [isViewing, setIsViewing] = useState(false);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const handleView = (cloud: PointCloud) => {
    setSelectedCloud(cloud);
    setIsViewing(true);
    // In a real app, this would open a 3D viewer
    Alert.alert(
      '3D Viewer',
      `Viewing "${
        cloud.name
      }" with ${cloud.metadata.pointCount.toLocaleString()} points.\n\nIn a full implementation, this would show an interactive 3D point cloud viewer.`,
      [{ text: 'Close', onPress: () => setIsViewing(false) }]
    );
  };

  const handleExport = (cloud: PointCloud) => {
    Alert.alert('Export Point Cloud', `Export "${cloud.name}" as PLY file?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          // In a real app, this would export the file
          Alert.alert('Success', 'Point cloud exported successfully!');
        }
      }
    ]);
  };

  const handleShare = (cloud: PointCloud) => {
    Alert.alert('Share Point Cloud', `Share "${cloud.name}" with others?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Share',
        onPress: () => {
          // In a real app, this would use the share API
          Alert.alert('Success', 'Sharing options opened!');
        }
      }
    ]);
  };

  const handleDelete = (cloud: PointCloud) => {
    Alert.alert(
      'Delete Point Cloud',
      `Are you sure you want to delete "${cloud.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPointClouds((prev) => prev.filter((pc) => pc.id !== cloud.id));
          }
        }
      ]
    );
  };

  const PointCloudCard: React.FC<{ cloud: PointCloud }> = ({ cloud }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{cloud.name}</Text>
        <Text style={styles.cardTimestamp}>
          {formatTimestamp(cloud.timestamp)}
        </Text>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Points</Text>
          <Text style={styles.statValue}>
            {cloud.metadata.pointCount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>
            {formatDuration(cloud.metadata.scanDuration)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Device</Text>
          <Text style={styles.statValue}>{cloud.metadata.deviceType}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button
          title='View'
          onPress={() => handleView(cloud)}
          variant='primary'
          size='small'
          icon={<Eye size={16} color={SCANNER_CONSTANTS.COLORS.BACKGROUND} />}
          style={styles.actionButton}
        />
        <Button
          title='Export'
          onPress={() => handleExport(cloud)}
          variant='outline'
          size='small'
          icon={<Download size={16} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />}
          style={styles.actionButton}
        />
        <Button
          title='Share'
          onPress={() => handleShare(cloud)}
          variant='ghost'
          size='small'
          icon={
            <Share size={16} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
          }
          style={styles.actionButton}
        />
        <Button
          title=''
          onPress={() => handleDelete(cloud)}
          variant='ghost'
          size='small'
          icon={<Trash2 size={16} color={SCANNER_CONSTANTS.COLORS.ERROR} />}
          style={[styles.actionButton, styles.deleteButton]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style='light' />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>3D Point Clouds</Text>
        <Text style={styles.headerSubtitle}>
          {pointClouds.length} scanned objects
        </Text>
      </View>

      {pointClouds.length === 0 ? (
        <View style={styles.emptyState}>
          <EyeOff size={64} color={SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY} />
          <Text style={styles.emptyTitle}>No Point Clouds</Text>
          <Text style={styles.emptyText}>
            Start scanning objects to see them here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {pointClouds.map((cloud) => (
            <PointCloudCard key={cloud.id} cloud={cloud} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    gap: 16
  },
  card: {
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: SCANNER_CONSTANTS.UI.BORDER_RADIUS,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  cardHeader: {
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 4
  },
  cardTimestamp: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  stat: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    flex: 1
  },
  deleteButton: {
    flex: 0,
    minWidth: 44
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24
  }
});
