import React, { createContext, useCallback, useContext, useState } from 'react';
import { captureScreen } from 'react-native-view-shot';
import { uploadImageToGoogleDrive } from '@/src/lib/googleDriveService';

export type DeviceType = 'phone' | 'tablet7' | 'tablet10';

export const DEVICE_DIMENSIONS: Record<DeviceType, { label: string }> = {
  phone: { label: 'Phone' },
  tablet7: { label: '7" Tablet' },
  tablet10: { label: '10" Tablet' },
};

export interface CapturedScreenshot {
  uri: string;
  screenName: string;
  device: DeviceType;
  capturedAt: number;
}

interface ScreenshotContextType {
  selectedDevice: DeviceType;
  setSelectedDevice: (d: DeviceType) => void;
  capturedScreenshots: CapturedScreenshot[];
  isCapturing: boolean;
  isUploading: boolean;
  captureCurrentScreen: (screenName?: string) => Promise<void>;
  uploadAllToGoogleDrive: () => Promise<void>;
  clearAllScreenshots: () => void;
}

const ScreenshotContext = createContext<ScreenshotContextType | null>(null);

export function ScreenshotProvider({ children }: { children: React.ReactNode }) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('phone');
  const [capturedScreenshots, setCapturedScreenshots] = useState<CapturedScreenshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const captureCurrentScreen = useCallback(async (screenName = 'screen') => {
    setIsCapturing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const uri = await captureScreen({ format: 'png', quality: 1 });
      setCapturedScreenshots((prev) => [
        ...prev,
        { uri, screenName, device: selectedDevice, capturedAt: Date.now() },
      ]);
    } finally {
      setIsCapturing(false);
    }
  }, [selectedDevice]);

  const uploadAllToGoogleDrive = useCallback(async () => {
    if (capturedScreenshots.length === 0) return;
    setIsUploading(true);
    try {
      await Promise.all(
        capturedScreenshots.map((s) => {
          const fileName = `${s.screenName}_${DEVICE_DIMENSIONS[s.device].label}_${s.capturedAt}.png`;
          return uploadImageToGoogleDrive(s.uri, fileName);
        }),
      );
    } finally {
      setIsUploading(false);
    }
  }, [capturedScreenshots]);

  const clearAllScreenshots = useCallback(() => {
    setCapturedScreenshots([]);
  }, []);

  return (
    <ScreenshotContext.Provider
      value={{
        selectedDevice,
        setSelectedDevice,
        capturedScreenshots,
        isCapturing,
        isUploading,
        captureCurrentScreen,
        uploadAllToGoogleDrive,
        clearAllScreenshots,
      }}>
      {children}
    </ScreenshotContext.Provider>
  );
}

export function useScreenshot(): ScreenshotContextType {
  const ctx = useContext(ScreenshotContext);
  if (!ctx) throw new Error('useScreenshot must be used inside ScreenshotProvider');
  return ctx;
}
