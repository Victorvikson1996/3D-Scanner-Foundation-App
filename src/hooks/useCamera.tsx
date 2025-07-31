import { useState, useCallback } from 'react';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { CameraSettings } from '@/types/Scanner';

export const useCamera = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [settings, setSettings] = useState<CameraSettings>({
    flashMode: false,
    facing: 'back',
    quality: 'high',
    autoFocus: true
  });

  const takePhoto = useCallback(
    async (cameraRef: React.RefObject<CameraView | null>) => {
      console.log(
        'takePhoto called, cameraRef:',
        cameraRef.current ? 'exists' : 'null'
      );

      if (!cameraRef.current) {
        console.error('Camera ref is null in takePhoto');
        throw new Error('Camera not ready');
      }

      try {
        console.log('Starting photo capture with settings:', settings);

        // Add a small delay to ensure camera is stable
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('Taking picture...');
        const photo = await cameraRef.current.takePictureAsync({
          quality:
            settings.quality === 'high'
              ? 1.0
              : settings.quality === 'medium'
              ? 0.7
              : 0.5,
          base64: false,
          exif: true,
          skipProcessing: false
        });

        console.log('Photo captured successfully:', photo);
        return photo.uri;
      } catch (error) {
        console.error('Failed to take photo:', error);
        // Check if it's a camera unmount error
        if (error instanceof Error && error.message.includes('unmounted')) {
          throw new Error(
            'Camera was unmounted during photo capture. Please try again.'
          );
        }
        throw error;
      }
    },
    [settings.quality]
  );

  const toggleFlash = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      flashMode: !prev.flashMode
    }));
  }, []);

  const toggleCamera = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      facing: prev.facing === 'back' ? 'front' : 'back'
    }));
  }, []);

  const updateQuality = useCallback((quality: CameraSettings['quality']) => {
    setSettings((prev) => ({
      ...prev,
      quality
    }));
  }, []);

  const toggleAutoFocus = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      autoFocus: !prev.autoFocus
    }));
  }, []);

  return {
    permission,
    requestPermission,
    settings,
    takePhoto,
    toggleFlash,
    toggleCamera,
    updateQuality,
    toggleAutoFocus
  };
};
