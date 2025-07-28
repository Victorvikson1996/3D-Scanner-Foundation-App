import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Point3D, PointCloud } from '@/types/Scanner';

export interface LiDARCapabilities {
  hasLiDAR: boolean;
  supportsDepthData: boolean;
  maxRange: number;
  accuracy: 'low' | 'medium' | 'high';
}

export interface LiDARFrame {
  id: string;
  timestamp: number;
  depthData: Float32Array;
  confidenceData?: Uint8Array;
  width: number;
  height: number;
  intrinsics: {
    fx: number;
    fy: number;
    cx: number;
    cy: number;
  };
}

export const useLiDAR = () => {
  const [capabilities, setCapabilities] = useState<LiDARCapabilities>({
    hasLiDAR: false,
    supportsDepthData: false,
    maxRange: 5.0,
    accuracy: 'medium'
  });

  const [isLiDAREnabled, setIsLiDAREnabled] = useState(false);
  const [lastFrame, setLastFrame] = useState<LiDARFrame | null>(null);

  // Check device capabilities
  useEffect(() => {
    checkLiDARCapabilities();
  }, []);

  const checkLiDARCapabilities = useCallback(async () => {
    try {
      const hasLiDAR =
        Platform.OS === 'ios' &&
        Platform.constants.systemName === 'iOS' &&
        parseFloat(Platform.constants.osVersion) >= 14.0;

      setCapabilities({
        hasLiDAR,
        supportsDepthData: hasLiDAR,
        maxRange: hasLiDAR ? 5.0 : 3.0,
        accuracy: hasLiDAR ? 'high' : 'medium'
      });
    } catch (error) {
      console.warn('Failed to check LiDAR capabilities:', error);
    }
  }, []);

  const enableLiDAR = useCallback(async () => {
    if (!capabilities.hasLiDAR) {
      throw new Error('LiDAR not available on this device');
    }

    setIsLiDAREnabled(true);
    return true;
  }, [capabilities.hasLiDAR]);

  const disableLiDAR = useCallback(() => {
    setIsLiDAREnabled(false);
    setLastFrame(null);
  }, []);

  const depthToPointCloud = useCallback(
    (frame: LiDARFrame): PointCloud => {
      const points: Point3D[] = [];
      const { depthData, width, height, intrinsics } = frame;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const index = y * width + x;
          const depth = depthData[index];

          if (depth > 0 && depth < capabilities.maxRange) {
            const worldX = ((x - intrinsics.cx) * depth) / intrinsics.fx;
            const worldY = ((y - intrinsics.cy) * depth) / intrinsics.fy;
            const worldZ = -depth;

            points.push({
              x: worldX,
              y: worldY,
              z: worldZ,
              intensity: depth / capabilities.maxRange // Normalize depth as intensity
            });
          }
        }
      }

      return {
        id: `lidar_${frame.timestamp}`,
        name: `LiDAR Scan ${new Date(frame.timestamp).toLocaleTimeString()}`,
        points,
        timestamp: frame.timestamp,
        metadata: {
          deviceType: 'LiDAR',
          scanDuration: 0,
          pointCount: points.length,
          boundingBox: calculateBoundingBox(points)
        }
      };
    },
    [capabilities.maxRange]
  );

  const captureFrame = useCallback(async (): Promise<LiDARFrame | null> => {
    if (!isLiDAREnabled) return null;

    try {
      const width = 256;
      const height = 192;
      const depthData = new Float32Array(width * height);

      for (let i = 0; i < depthData.length; i++) {
        depthData[i] = Math.random() * capabilities.maxRange;
      }

      const frame: LiDARFrame = {
        id: `frame_${Date.now()}`,
        timestamp: Date.now(),
        depthData,
        width,
        height,
        intrinsics: {
          fx: 200, // These would come from camera calibration
          fy: 200,
          cx: width / 2,
          cy: height / 2
        }
      };

      setLastFrame(frame);
      return frame;
    } catch (error) {
      console.error('Failed to capture LiDAR frame:', error);
      return null;
    }
  }, [isLiDAREnabled, capabilities.maxRange]);

  return {
    capabilities,
    isLiDAREnabled,
    lastFrame,
    enableLiDAR,
    disableLiDAR,
    captureFrame,
    depthToPointCloud
  };
};

// Helper function to calculate bounding box
function calculateBoundingBox(points: Point3D[]) {
  if (points.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 }
    };
  }

  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };

  points.forEach((point) => {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    min.z = Math.min(min.z, point.z);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
    max.z = Math.max(max.z, point.z);
  });

  return { min, max };
}
