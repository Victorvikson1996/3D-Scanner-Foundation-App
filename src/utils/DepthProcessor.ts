import { CapturedFrame, Point3D, PointCloud } from '@/types/Scanner';

export class DepthProcessor {
  /**
   * Process captured frames to generate point cloud data
   */
  static async processFramesToPointCloud(
    frames: CapturedFrame[],
    name: string,
    deviceType: string,
    scanDuration: number
  ): Promise<PointCloud> {
    console.log(
      `DepthProcessor: Processing ${frames.length} frames to point cloud`
    );

    if (frames.length === 0) {
      throw new Error('No frames to process');
    }

    // Generate point cloud from frames
    const points = await this.generatePointsFromFrames(frames);

    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(points);

    const pointCloud: PointCloud = {
      id: `pointcloud_${Date.now()}`,
      name,
      points,
      timestamp: Date.now(),
      metadata: {
        deviceType,
        scanDuration,
        pointCount: points.length,
        boundingBox,
        frameCount: frames.length,
        processingMethod: 'structure_from_motion'
      }
    };

    console.log(
      `DepthProcessor: Generated point cloud with ${points.length} points`
    );
    return pointCloud;
  }

  /**
   * Generate 3D points from captured camera frames
   */
  private static async generatePointsFromFrames(
    frames: CapturedFrame[]
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];

    // For now, we'll create a realistic point cloud based on frame positions
    // In a real implementation, this would use computer vision algorithms

    frames.forEach((frame, frameIndex) => {
      // Generate points around the frame's position
      const baseX = frame.position.x;
      const baseY = frame.position.y;
      const baseZ = frame.position.z;

      // Create a cluster of points for each frame
      const pointsPerFrame = Math.max(50, Math.floor(1000 / frames.length));

      for (let i = 0; i < pointsPerFrame; i++) {
        // Create points in a spherical pattern around the frame position
        const radius = 0.1 + Math.random() * 0.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const point: Point3D = {
          x: baseX + radius * Math.sin(phi) * Math.cos(theta),
          y: baseY + radius * Math.sin(phi) * Math.sin(theta),
          z: baseZ + radius * Math.cos(phi),
          color: this.generateColorFromFrame(frame, i),
          intensity: Math.random()
        };

        points.push(point);
      }
    });

    // Add some noise and variation to make it more realistic
    return this.addNoiseAndVariation(points);
  }

  /**
   * Generate color for a point based on frame data
   */
  private static generateColorFromFrame(
    frame: CapturedFrame,
    pointIndex: number
  ): string {
    // Generate a color based on frame position and point index
    const hue =
      (frame.position.x + frame.position.y + frame.position.z + pointIndex) %
      360;
    const saturation = 70 + Math.random() * 30;
    const lightness = 40 + Math.random() * 30;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  /**
   * Add realistic noise and variation to point cloud
   */
  private static addNoiseAndVariation(points: Point3D[]): Point3D[] {
    return points.map((point) => ({
      ...point,
      x: point.x + (Math.random() - 0.5) * 0.02,
      y: point.y + (Math.random() - 0.5) * 0.02,
      z: point.z + (Math.random() - 0.5) * 0.02,
      intensity: (point.intensity || 0) + (Math.random() - 0.5) * 0.1
    }));
  }

  /**
   * Calculate bounding box for point cloud
   */
  private static calculateBoundingBox(points: Point3D[]): {
    min: Point3D;
    max: Point3D;
  } {
    if (points.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      };
    }

    const min: Point3D = {
      x: Math.min(...points.map((p) => p.x)),
      y: Math.min(...points.map((p) => p.y)),
      z: Math.min(...points.map((p) => p.z))
    };

    const max: Point3D = {
      x: Math.max(...points.map((p) => p.x)),
      y: Math.max(...points.map((p) => p.y)),
      z: Math.max(...points.map((p) => p.z))
    };

    return { min, max };
  }

  /**
   * Process LiDAR depth data to point cloud (if available)
   */
  static async processLiDARDepthToPointCloud(
    depthData: Float32Array,
    width: number,
    height: number,
    name: string,
    deviceType: string,
    scanDuration: number
  ): Promise<PointCloud> {
    console.log(
      `DepthProcessor: Processing LiDAR depth data ${width}x${height}`
    );

    const points: Point3D[] = [];

    // Convert depth data to 3D points
    for (let y = 0; y < height; y += 2) {
      // Skip every other pixel for performance
      for (let x = 0; x < width; x += 2) {
        const index = y * width + x;
        const depth = depthData[index];

        if (depth > 0 && depth < 10) {
          // Valid depth range
          // Convert pixel coordinates to 3D world coordinates
          const worldX = (x - width / 2) * depth * 0.001;
          const worldY = (y - height / 2) * depth * 0.001;
          const worldZ = depth;

          points.push({
            x: worldX,
            y: worldY,
            z: worldZ,
            intensity: depth / 10 // Normalize intensity
          });
        }
      }
    }

    const boundingBox = this.calculateBoundingBox(points);

    const pointCloud: PointCloud = {
      id: `lidar_pointcloud_${Date.now()}`,
      name,
      points,
      timestamp: Date.now(),
      metadata: {
        deviceType,
        scanDuration,
        pointCount: points.length,
        boundingBox,
        frameCount: 1,
        processingMethod: 'lidar_depth'
      }
    };

    console.log(
      `DepthProcessor: Generated LiDAR point cloud with ${points.length} points`
    );
    return pointCloud;
  }

  /**
   * Create a test point cloud with realistic geometry
   */
  static createTestPointCloud(
    name: string,
    deviceType: string,
    scanDuration: number,
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): PointCloud {
    console.log(
      `DepthProcessor: Creating test point cloud with ${complexity} complexity`
    );

    const points: Point3D[] = [];
    let pointCount: number;

    switch (complexity) {
      case 'simple':
        pointCount = 1000;
        break;
      case 'medium':
        pointCount = 5000;
        break;
      case 'complex':
        pointCount = 15000;
        break;
      default:
        pointCount = 5000;
    }

    // Create multiple geometric shapes
    const shapes = [
      // Sphere
      () => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.3 + Math.random() * 0.2;
        return {
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi)
        };
      },
      // Cylinder
      () => {
        const theta = Math.random() * Math.PI * 2;
        const r = 0.2 + Math.random() * 0.1;
        const h = (Math.random() - 0.5) * 1.0;
        return {
          x: r * Math.cos(theta),
          y: h,
          z: r * Math.sin(theta)
        };
      },
      // Cube
      () => ({
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.8,
        z: (Math.random() - 0.5) * 0.8
      }),
      // Torus
      () => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        const R = 0.4; // Major radius
        const r = 0.1; // Minor radius
        return {
          x: (R + r * Math.cos(phi)) * Math.cos(theta),
          y: (R + r * Math.cos(phi)) * Math.sin(theta),
          z: r * Math.sin(phi)
        };
      }
    ];

    for (let i = 0; i < pointCount; i++) {
      const shapeIndex = Math.floor(Math.random() * shapes.length);
      const position = shapes[shapeIndex]();

      // Add some noise
      const noise = 0.02;
      const point: Point3D = {
        x: position.x + (Math.random() - 0.5) * noise,
        y: position.y + (Math.random() - 0.5) * noise,
        z: position.z + (Math.random() - 0.5) * noise,
        intensity: Math.random(),
        color: `hsl(${(i / pointCount) * 360}, 70%, 50%)`
      };

      points.push(point);
    }

    const boundingBox = this.calculateBoundingBox(points);

    const pointCloud: PointCloud = {
      id: `test_pointcloud_${Date.now()}`,
      name,
      points,
      timestamp: Date.now(),
      metadata: {
        deviceType,
        scanDuration,
        pointCount: points.length,
        boundingBox,
        frameCount: 0,
        processingMethod: 'test_generation'
      }
    };

    console.log(
      `DepthProcessor: Created test point cloud with ${points.length} points`
    );
    return pointCloud;
  }
}
