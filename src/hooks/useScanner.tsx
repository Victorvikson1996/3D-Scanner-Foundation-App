import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ScanSession,
  CapturedFrame,
  ScannerConfig,
  PointCloud
} from '@/types/Scanner';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import { useLiDAR } from './useLiDAR';
import { StorageService } from '@/utils/StorageService';
import { DepthProcessor } from '@/utils/DepthProcessor';

export const useScanner = (config: Partial<ScannerConfig> = {}) => {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  const lidar = useLiDAR();
  const [useLiDARMode, setUseLiDARMode] = useState(false);

  const scanIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const onFrameCapturedRef = useRef<(() => void) | null>(null);
  const frameCountRef = useRef(0); // Use ref to track frame count in intervals
  const isScanningRef = useRef(false); // Use ref to track scanning state in intervals

  const scanConfig: ScannerConfig = {
    maxFrames: config.maxFrames || SCANNER_CONSTANTS.CAMERA.MAX_FRAMES,
    scanDuration:
      config.scanDuration || SCANNER_CONSTANTS.SCAN.DEFAULT_DURATION,
    depthEstimation: config.depthEstimation ?? true,
    pointCloudDensity: config.pointCloudDensity || 'medium',
    exportFormat: config.exportFormat || 'ply'
  };

  const startFrameCapture = useCallback(
    (takePhotoFn: () => Promise<string>, onFrameCaptured?: () => void) => {
      console.log('Starting frame capture...');
      onFrameCapturedRef.current = onFrameCaptured || null;

      // Start capturing frames at regular intervals
      scanIntervalRef.current = setInterval(async () => {
        try {
          console.log(
            'Frame capture interval triggered, current frame count:',
            frameCountRef.current
          );

          if (frameCountRef.current >= scanConfig.maxFrames) {
            console.log('Max frames reached, stopping scan');
            stopScan();
            return;
          }

          // Check if we're still scanning before taking photo
          if (!isScanningRef.current) {
            console.log('Not scanning anymore, skipping frame capture');
            return;
          }

          console.log('Taking photo for frame capture...');
          const photoUri = await takePhotoFn();
          console.log('Photo taken for frame:', photoUri);

          await captureFrame(photoUri);
          console.log('Frame captured successfully');

          // Trigger frame captured callback
          if (onFrameCapturedRef.current) {
            onFrameCapturedRef.current();
          }
        } catch (error) {
          console.error('Failed to capture frame:', error);
          // Don't stop scanning on individual frame errors, just log them
        }
      }, SCANNER_CONSTANTS.CAMERA.FRAME_INTERVAL);
    },
    [scanConfig.maxFrames]
  );

  const startScan = useCallback(
    (takePhotoFn?: () => Promise<string>, onFrameCaptured?: () => void) => {
      console.log('Starting scan...');

      const newSession: ScanSession = {
        id: `scan_${Date.now()}`,
        startTime: Date.now(),
        frames: [],
        status: 'scanning',
        progress: 0
      };

      setSession(newSession);
      setIsScanning(true);
      isScanningRef.current = true; // Set the ref
      setProgress(0);
      setFrameCount(0);
      frameCountRef.current = 0; // Reset the ref

      // Start frame capture if takePhotoFn is provided
      if (takePhotoFn) {
        console.log('Starting frame capture with takePhotoFn');
        startFrameCapture(takePhotoFn, onFrameCaptured);
      } else {
        console.log('No takePhotoFn provided, skipping frame capture');
      }

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
    },
    [scanConfig.scanDuration, startFrameCapture]
  );

  const stopScan = useCallback(() => {
    console.log('Stopping scan...');

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);
    isScanningRef.current = false; // Clear the ref
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
      // Calculate realistic position based on frame count
      const frameIndex = frameCountRef.current;
      const angle = (frameIndex / scanConfig.maxFrames) * Math.PI * 2; // Full circle
      const radius = 0.5; // Distance from center

      const frame: CapturedFrame = {
        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        uri,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0.2 * Math.sin(angle * 2) // Add some vertical variation
        },
        rotation: {
          x: 0,
          y: angle,
          z: 0
        }
      };

      frameCountRef.current += 1;
      setFrameCount(frameCountRef.current);

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
    [session, scanConfig.maxFrames]
  );

  const resetScan = useCallback(() => {
    stopScan();
    setSession(null);
    setProgress(0);
    setFrameCount(0);
    frameCountRef.current = 0; // Reset the ref
    isScanningRef.current = false; // Clear the ref
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

  const saveScan = useCallback(
    async (name?: string, deviceType?: string) => {
      if (!session) {
        throw new Error('No scan session to save');
      }

      console.log(`Saving scan with ${session.frames.length} frames`);

      // Generate point cloud from captured frames
      let pointCloud: PointCloud;

      if (session.frames.length > 0) {
        // Use captured frames to generate point cloud
        pointCloud = await DepthProcessor.processFramesToPointCloud(
          session.frames,
          name || `Scan ${new Date().toLocaleDateString()}`,
          deviceType || 'Camera Device',
          session.endTime ? session.endTime - session.startTime : 0
        );
      } else {
        // Fallback to test point cloud if no frames captured
        pointCloud = DepthProcessor.createTestPointCloud(
          name || `Test Scan ${new Date().toLocaleDateString()}`,
          deviceType || 'Test Device',
          session.endTime ? session.endTime - session.startTime : 15000
        );
      }

      const scanData = {
        id: session.id,
        startTime: session.startTime,
        endTime: Date.now(),
        status: session.status,
        progress: session.progress,
        frames: session.frames,
        pointCloud: pointCloud
      };

      await StorageService.saveScanSession(session);
      await StorageService.savePointCloud(pointCloud);
      resetScan(); // Clear session after saving

      console.log(
        `Scan saved successfully with ${pointCloud.points.length} points`
      );
      return pointCloud;
    },
    [session, resetScan]
  );

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

  // Keep ref in sync with state
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

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
    startFrameCapture,

    lidarCapabilities: lidar.capabilities,
    useLiDARMode,
    isLiDAREnabled: lidar.isLiDAREnabled,
    lastLiDARFrame: lidar.lastFrame,
    toggleLiDARMode,
    captureLiDARFrame,
    generatePointCloud,
    saveScan
  };
};
