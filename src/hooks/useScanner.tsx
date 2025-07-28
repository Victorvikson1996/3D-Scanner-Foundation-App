import { useState, useRef, useCallback, useEffect } from 'react';
import { ScanSession, CapturedFrame, ScannerConfig } from '@/types/Scanner';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import { useLiDAR } from './useLiDAR';

export const useScanner = (config: Partial<ScannerConfig> = {}) => {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  const lidar = useLiDAR();
  const [useLiDARMode, setUseLiDARMode] = useState(false);

  const scanIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | number | null>(null);

  const scanConfig: ScannerConfig = {
    maxFrames: config.maxFrames || SCANNER_CONSTANTS.CAMERA.MAX_FRAMES,
    scanDuration:
      config.scanDuration || SCANNER_CONSTANTS.SCAN.DEFAULT_DURATION,
    depthEstimation: config.depthEstimation ?? true,
    pointCloudDensity: config.pointCloudDensity || 'medium',
    exportFormat: config.exportFormat || 'ply'
  };

  const startScan = useCallback(() => {
    const newSession: ScanSession = {
      id: `scan_${Date.now()}`,
      startTime: Date.now(),
      frames: [],
      status: 'scanning',
      progress: 0
    };

    setSession(newSession);
    setIsScanning(true);
    setProgress(0);
    setFrameCount(0);

    // Progress tracking
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - newSession.startTime;
        const newProgress = Math.min(
          (elapsed / scanConfig.scanDuration) * 100,
          100
        );

        if (newProgress >= 100) {
          stopScan();
        }

        return newProgress;
      });
    }, SCANNER_CONSTANTS.SCAN.PROGRESS_UPDATE_INTERVAL);
  }, [scanConfig.scanDuration]);

  const stopScan = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);
    setProgress(100);

    if (session) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              endTime: Date.now(),
              status: 'completed',
              progress: 100
            }
          : null
      );
    }
  }, [session]);

  const captureFrame = useCallback(
    async (uri: string): Promise<CapturedFrame> => {
      const frame: CapturedFrame = {
        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        uri,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      };

      setFrameCount((prev) => prev + 1);

      if (session) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                frames: [...prev.frames, frame]
              }
            : null
        );
      }

      return frame;
    },
    [session]
  );

  const resetScan = useCallback(() => {
    stopScan();
    setSession(null);
    setProgress(0);
    setFrameCount(0);
  }, [stopScan]);

  // LiDAR-specific methods
  const toggleLiDARMode = useCallback(async () => {
    if (!lidar.capabilities.hasLiDAR) {
      throw new Error('LiDAR not available on this device');
    }

    if (useLiDARMode) {
      await lidar.disableLiDAR();
      setUseLiDARMode(false);
    } else {
      await lidar.enableLiDAR();
      setUseLiDARMode(true);
    }
  }, [lidar, useLiDARMode]);

  const captureLiDARFrame = useCallback(async () => {
    if (!useLiDARMode || !lidar.isLiDAREnabled) {
      throw new Error('LiDAR mode not enabled');
    }

    const lidarFrame = await lidar.captureFrame();
    if (!lidarFrame) {
      throw new Error('Failed to capture LiDAR frame');
    }

    const frame: CapturedFrame = {
      id: lidarFrame.id,
      timestamp: lidarFrame.timestamp,
      uri: `lidar://${lidarFrame.id}`,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      depthData: lidarFrame.depthData
    };

    setFrameCount((prev) => prev + 1);

    if (session) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              frames: [...prev.frames, frame]
            }
          : null
      );
    }

    return frame;
  }, [useLiDARMode, lidar, session]);

  const generatePointCloud = useCallback(async () => {
    if (!lidar.lastFrame) {
      throw new Error('No LiDAR frame available');
    }

    return lidar.depthToPointCloud(lidar.lastFrame);
  }, [lidar]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  return {
    session,
    isScanning,
    progress,
    frameCount,
    scanConfig,
    startScan,
    stopScan,
    captureFrame,
    resetScan,

    lidarCapabilities: lidar.capabilities,
    useLiDARMode,
    isLiDAREnabled: lidar.isLiDAREnabled,
    lastLiDARFrame: lidar.lastFrame,
    toggleLiDARMode,
    captureLiDARFrame,
    generatePointCloud
  };
};
