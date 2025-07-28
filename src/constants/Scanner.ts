import { Dimensions } from 'react-native';

export const SCANNER_CONSTANTS = {
  CAMERA: {
    DEFAULT_QUALITY: 'high' as const,
    MAX_FRAMES: 100,
    FRAME_INTERVAL: 100, // ms
    PREVIEW_ASPECT_RATIO: 16 / 9
  },

  SCAN: {
    DEFAULT_DURATION: 30000,
    MIN_DURATION: 5000,
    MAX_DURATION: 120000,
    PROGRESS_UPDATE_INTERVAL: 100
  },

  POINT_CLOUD: {
    MAX_POINTS: 100000,
    DEFAULT_POINT_SIZE: 2,
    COLOR_DEPTH_RANGE: 255,
    DENSITY_MULTIPLIERS: {
      low: 0.1,
      medium: 0.5,
      high: 1.0
    }
  },

  UI: {
    SCREEN_WIDTH: Dimensions.get('window').width,
    SCREEN_HEIGHT: Dimensions.get('window').height,
    HEADER_HEIGHT: 60,
    TAB_BAR_HEIGHT: 80,
    BUTTON_HEIGHT: 50,
    BORDER_RADIUS: 12,
    ANIMATION_DURATION: 300
  },

  COLORS: {
    PRIMARY: '#00ff88',
    SECONDARY: '#0066cc',
    BACKGROUND: '#000000',
    SURFACE: '#1a1a1a',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#cccccc',
    ERROR: '#ff4444',
    WARNING: '#ffaa00',
    SUCCESS: '#00ff88',
    OVERLAY: 'rgba(0, 0, 0, 0.7)'
  }
} as const;
