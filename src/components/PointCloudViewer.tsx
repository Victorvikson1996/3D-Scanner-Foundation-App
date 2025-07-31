import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert
} from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { PointCloud } from '@/types/Scanner';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import {
  Camera,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Settings,
  Eye,
  EyeOff,
  Box
} from 'lucide-react-native';

interface PointCloudViewerProps {
  pointCloud: PointCloud;
  onClose: () => void;
}

export const PointCloudViewer: React.FC<PointCloudViewerProps> = ({
  pointCloud,
  onClose
}) => {
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [pointSize, setPointSize] = useState(0.1);

  const onContextCreate = async (gl: any) => {
    try {
      console.log('PointCloudViewer: Creating GL context...');
      setIsRendering(true);
      setError(null);

      // Create renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x1a1a2e, 1);
      setRenderer(renderer);

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      setScene(scene);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);
      setCamera(camera);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Create point cloud
      createPointCloud(scene, pointCloud);

      // Start render loop
      const render = () => {
        if (renderer && scene && camera) {
          requestAnimationFrame(render);
          renderer.render(scene, camera);
          gl.endFrameEXP();
        }
      };
      render();

      console.log('PointCloudViewer: GL context created successfully');
    } catch (err) {
      console.error('PointCloudViewer: Error creating GL context:', err);
      setError('Failed to initialize 3D viewer');
      setIsRendering(false);
    }
  };

  const createPointCloud = (scene: THREE.Scene, pointCloud: PointCloud) => {
    try {
      console.log('PointCloudViewer: Creating point cloud...');

      // Clear existing objects except lights
      const lightsToKeep = scene.children.filter(
        (child) =>
          child.type === 'AmbientLight' ||
          child.type === 'DirectionalLight' ||
          child.type === 'PointLight'
      );
      scene.children = lightsToKeep;

      // Create geometry
      const geometry = new THREE.BufferGeometry();

      // Get points (use sample data if empty)
      const points =
        pointCloud.points.length > 0
          ? pointCloud.points
          : generateSamplePoints(pointCloud.metadata.pointCount);

      console.log(`PointCloudViewer: Rendering ${points.length} points`);

      const positions = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;

        // Simple color mapping
        colors[i * 3] = 0.8; // Red
        colors[i * 3 + 1] = 0.6; // Green
        colors[i * 3 + 2] = 0.4; // Blue
      }

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Create material
      const material = new THREE.PointsMaterial({
        size: pointSize,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });

      // Create points mesh
      const pointsMesh = new THREE.Points(geometry, material);
      scene.add(pointsMesh);

      // Add bounding box
      if (showBoundingBox) {
        const bbox = new THREE.Box3().setFromObject(pointsMesh);
        const bboxHelper = new THREE.Box3Helper(bbox, 0x00ff00);
        scene.add(bboxHelper);
      }

      // Add coordinate axes
      const axesHelper = new THREE.AxesHelper(1);
      scene.add(axesHelper);

      console.log('PointCloudViewer: Point cloud created successfully');
    } catch (err) {
      console.error('PointCloudViewer: Error creating point cloud:', err);
      setError('Failed to create point cloud');
    }
  };

  const generateSamplePoints = (count: number) => {
    const points = [];
    for (let i = 0; i < count; i++) {
      points.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      });
    }
    return points;
  };

  const handleRotate = (axis: 'x' | 'y', direction: 1 | -1) => {
    if (scene) {
      const angle = direction * 0.1;
      if (axis === 'x') {
        scene.rotation.x += angle;
      } else {
        scene.rotation.y += angle;
      }
    }
  };

  const handleZoom = (direction: 1 | -1) => {
    if (camera) {
      const zoomFactor = direction > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(zoomFactor);
    }
  };

  const handleReset = () => {
    if (scene && camera) {
      scene.rotation.set(0, 0, 0);
      camera.position.set(0, 0, 5);
    }
  };

  const toggleBoundingBox = () => {
    setShowBoundingBox(!showBoundingBox);
    if (scene) {
      createPointCloud(scene, pointCloud);
    }
  };

  const adjustPointSize = (increase: boolean) => {
    const newSize = increase ? pointSize * 1.2 : pointSize * 0.8;
    setPointSize(Math.max(0.02, Math.min(0.3, newSize)));
    if (scene) {
      createPointCloud(scene, pointCloud);
    }
  };

  const showPointCloudInfo = () => {
    Alert.alert(
      'Point Cloud Information',
      `Name: ${pointCloud.name}\n` +
        `Points: ${pointCloud.metadata.pointCount.toLocaleString()}\n` +
        `Device: ${pointCloud.metadata.deviceType}\n` +
        `Scan Duration: ${Math.round(
          pointCloud.metadata.scanDuration / 1000
        )}s\n` +
        `Rendering: ${isRendering ? 'Active' : 'Inactive'}`,
      [{ text: 'OK' }]
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{pointCloud.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>3D Viewer Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setError(null)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{pointCloud.name}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.glContainer}>
        <GLView style={styles.glView} onContextCreate={onContextCreate} />
        {!isRendering && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Initializing 3D Viewer...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleRotate('y', -1)}
        >
          <RotateCcw size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleRotate('y', 1)}
        >
          <RotateCcw size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleZoom(1)}
        >
          <ZoomIn size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleZoom(-1)}
        >
          <ZoomOut size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Camera size={24} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            showBoundingBox && styles.activeButton
          ]}
          onPress={toggleBoundingBox}
        >
          <Box size={20} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => adjustPointSize(true)}
        >
          <Text style={styles.secondaryButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => adjustPointSize(false)}
        >
          <Text style={styles.secondaryButtonText}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={showPointCloudInfo}
        >
          <Settings size={20} color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Points: {pointCloud.metadata.pointCount.toLocaleString()}
        </Text>
        <Text style={styles.infoText}>
          Device: {pointCloud.metadata.deviceType}
        </Text>
        <Text style={styles.infoText}>
          Status: {isRendering ? 'Rendering' : 'Loading...'}
        </Text>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    fontSize: 18,
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  glContainer: {
    flex: 1,
    position: 'relative'
  },
  glView: {
    flex: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorContainer: {
    padding: 20,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center'
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: SCANNER_CONSTANTS.COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: SCANNER_CONSTANTS.COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: SCANNER_CONSTANTS.COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryButtonText: {
    fontSize: 24,
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  activeButton: {
    backgroundColor: SCANNER_CONSTANTS.COLORS.PRIMARY
  },
  info: {
    padding: 20,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE
  },
  infoText: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: 4
  }
});
