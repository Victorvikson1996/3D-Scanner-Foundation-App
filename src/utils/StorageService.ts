import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanSession, PointCloud } from '@/types/Scanner';

const STORAGE_KEYS = {
  SCAN_SESSIONS: 'scan_sessions',
  POINT_CLOUDS: 'point_clouds'
};

export class StorageService {
  // Save a scan session
  static async saveScanSession(session: ScanSession): Promise<void> {
    try {
      const existingSessions = await this.getScanSessions();
      const updatedSessions = [...existingSessions, session];

      await AsyncStorage.setItem(
        STORAGE_KEYS.SCAN_SESSIONS,
        JSON.stringify(updatedSessions)
      );
    } catch (error) {
      console.error('Failed to save scan session:', error);
      throw error;
    }
  }

  // Get all scan sessions
  static async getScanSessions(): Promise<ScanSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.SCAN_SESSIONS
      );
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Failed to get scan sessions:', error);
      return [];
    }
  }

  // Save a point cloud
  static async savePointCloud(pointCloud: PointCloud): Promise<void> {
    try {
      console.log('StorageService: Saving point cloud:', pointCloud.id);
      const existingClouds = await this.getPointClouds();
      console.log(
        'StorageService: Existing clouds count:',
        existingClouds.length
      );

      const updatedClouds = [...existingClouds, pointCloud];
      console.log(
        'StorageService: Updated clouds count:',
        updatedClouds.length
      );

      await AsyncStorage.setItem(
        STORAGE_KEYS.POINT_CLOUDS,
        JSON.stringify(updatedClouds)
      );
      console.log('StorageService: Point cloud saved successfully');
    } catch (error) {
      console.error('StorageService: Failed to save point cloud:', error);
      throw error;
    }
  }

  static async getPointClouds(): Promise<PointCloud[]> {
    try {
      console.log('StorageService: Loading point clouds...');
      const cloudsJson = await AsyncStorage.getItem(STORAGE_KEYS.POINT_CLOUDS);
      const clouds = cloudsJson ? JSON.parse(cloudsJson) : [];
      console.log('StorageService: Loaded clouds count:', clouds.length);
      return clouds;
    } catch (error) {
      console.error('StorageService: Failed to get point clouds:', error);
      return [];
    }
  }

  // Delete a point cloud
  static async deletePointCloud(cloudId: string): Promise<void> {
    try {
      const existingClouds = await this.getPointClouds();
      const updatedClouds = existingClouds.filter(
        (cloud) => cloud.id !== cloudId
      );

      await AsyncStorage.setItem(
        STORAGE_KEYS.POINT_CLOUDS,
        JSON.stringify(updatedClouds)
      );
    } catch (error) {
      console.error('Failed to delete point cloud:', error);
      throw error;
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SCAN_SESSIONS,
        STORAGE_KEYS.POINT_CLOUDS
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}
