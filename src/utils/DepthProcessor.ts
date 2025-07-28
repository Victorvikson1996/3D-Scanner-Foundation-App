import { Point3D, PointCloud } from '@/types/Scanner';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';

export class DepthProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
    }
  }

  /**
   * Estimate depth from image using simple gradient-based approach
   * In a real implementation, this would use ML models or stereo vision
   */
  async estimateDepthFromImage(imageUri: string): Promise<Float32Array> {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not available');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const width = 320;
          const height = 240;

          this.canvas!.width = width;
          this.canvas!.height = height;

          this.context!.drawImage(img, 0, 0, width, height);
          const imageData = this.context!.getImageData(0, 0, width, height);
          const depthData = this.processImageToDepth(imageData);

          resolve(depthData);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUri;
    });
  }

  private processImageToDepth(imageData: ImageData): Float32Array {
    const { data, width, height } = imageData;
    const depthData = new Float32Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      const depth = (255 - luminance) / 255;

      const pixelIndex = i / 4;
      depthData[pixelIndex] = depth;
    }

    return depthData;
  }

  generatePointCloud(
    depthData: Float32Array,
    width: number,
    height: number,
    density: 'low' | 'medium' | 'high' = 'medium'
  ): Point3D[] {
    const points: Point3D[] = [];
    const multiplier =
      SCANNER_CONSTANTS.POINT_CLOUD.DENSITY_MULTIPLIERS[density];
    const step = Math.ceil(1 / multiplier);

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = y * width + x;
        const depth = depthData[index];

        if (depth > 0.1) {
          const point: Point3D = {
            x: (x - width / 2) / width,
            y: (height / 2 - y) / height,
            z: depth,
            intensity: depth,
            color: this.depthToColor(depth)
          };

          points.push(point);
        }
      }
    }

    return points;
  }

  private depthToColor(depth: number): string {
    const hue = (1 - depth) * 240;
    return `hsl(${hue}, 100%, 50%)`;
  }

  mergePointClouds(pointClouds: Point3D[][]): Point3D[] {
    const merged: Point3D[] = [];

    pointClouds.forEach((cloud) => {
      merged.push(...cloud);
    });

    return this.removeDuplicatePoints(merged);
  }

  private removeDuplicatePoints(
    points: Point3D[],
    threshold = 0.01
  ): Point3D[] {
    const spatialHash = new Map<string, Point3D>();

    points.forEach((point) => {
      const key = `${Math.round(point.x / threshold)}_${Math.round(
        point.y / threshold
      )}_${Math.round(point.z / threshold)}`;

      if (!spatialHash.has(key)) {
        spatialHash.set(key, point);
      }
    });

    return Array.from(spatialHash.values());
  }

  exportToPLY(pointCloud: PointCloud): string {
    const { points } = pointCloud;

    let ply = 'ply\n';
    ply += 'format ascii 1.0\n';
    ply += `element vertex ${points.length}\n`;
    ply += 'property float x\n';
    ply += 'property float y\n';
    ply += 'property float z\n';
    ply += 'property uchar red\n';
    ply += 'property uchar green\n';
    ply += 'property uchar blue\n';
    ply += 'end_header\n';

    points.forEach((point) => {
      const color = this.hexToRgb(point.color || '#ffffff');
      ply += `${point.x} ${point.y} ${point.z} ${color.r} ${color.g} ${color.b}\n`;
    });

    return ply;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 255, g: 255, b: 255 };
  }
}
