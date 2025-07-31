export interface Point3D {
  x: number;
  y: number;
  z: number;
  color?: string;
  intensity?: number;
}

export interface PointCloud {
  id: string;
  name: string;
  points: Point3D[];
  timestamp: number;
  metadata: {
    deviceType: string;
    scanDuration: number;
    pointCount: number;
    boundingBox: {
      min: Point3D;
      max: Point3D;
    };
    frameCount?: number;
    processingMethod?: string;
  };
}

export interface ScanSession {
  id: string;
  startTime: number;
  endTime?: number;
  frames: CapturedFrame[];
  status: 'idle' | 'scanning' | 'processing' | 'completed' | 'error';
  progress: number;
}

export interface CapturedFrame {
  id: string;
  timestamp: number;
  uri: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  depthData?: Float32Array;
  isLiDARFrame?: boolean;
  confidenceData?: Uint8Array;
  frameWidth?: number;
  frameHeight?: number;
}

export interface CameraSettings {
  flashMode: boolean;
  facing: 'front' | 'back';
  quality: 'low' | 'medium' | 'high';
  autoFocus: boolean;
}

export interface ScannerConfig {
  maxFrames: number;
  scanDuration: number;
  depthEstimation: boolean;
  pointCloudDensity: 'low' | 'medium' | 'high';
  exportFormat: 'ply' | 'obj' | 'json';
}
