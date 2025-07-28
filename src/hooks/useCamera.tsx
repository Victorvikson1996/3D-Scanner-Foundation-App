import { useState, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { CameraSettings } from '@/types/Scanner';

export const useCamera = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [settings, setSettings] = useState<CameraSettings>({
    flashMode: false,
    facing: 'back',
    quality: 'high',
    autoFocus: true
  });

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
    toggleFlash,
    toggleCamera,
    updateQuality,
    toggleAutoFocus
  };
};
