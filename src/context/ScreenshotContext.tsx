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

export type ScreenshotStatus =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

interface ScreenshotContextType {
  selectedDevice: DeviceType;
  setSelectedDevice: (d: DeviceType) => void;
  capturedScreenshots: CapturedScreenshot[];
  isCapturing: boolean;
  isUploading: boolean;
  captureCurrentScreen: (screenName?: string) => Promise<void>;
  uploadAllToGoogleDrive: () => Promise<void>;
  clearAllScreenshots: () => void;
  status: ScreenshotStatus;
  dismissStatus: () => void;
}

const ScreenshotContext = createContext<ScreenshotContextType | null>(null);

export function ScreenshotProvider({ children }: { children: React.ReactNode }) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('phone');
  const [capturedScreenshots, setCapturedScreenshots] = useState<CapturedScreenshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<ScreenshotStatus>({ kind: 'idle' });

  const captureCurrentScreen = useCallback(async (screenName = 'screen') => {
    setIsCapturing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const uri = await captureScreen({ format: 'png', quality: 1, result: 'tmpfile' });
      setCapturedScreenshots((prev) => {
        const next = [...prev, { uri, screenName, device: selectedDevice, capturedAt: Date.now() }];
        setStatus({ kind: 'success', message: `Captured ${screenName} (${next.length} total)` });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[screenshot] capture failed', err);
      setStatus({ kind: 'error', message: `Capture failed: ${message}` });
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
      setStatus({
        kind: 'success',
        message: `Uploaded ${capturedScreenshots.length} screenshot(s) to Drive`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[screenshot] upload failed', err);
      setStatus({ kind: 'error', message: `Upload failed: ${message}` });
    } finally {
      setIsUploading(false);
    }
  }, [capturedScreenshots]);

  const clearAllScreenshots = useCallback(() => {
    setCapturedScreenshots([]);
  }, []);

  const dismissStatus = useCallback(() => setStatus({ kind: 'idle' }), []);

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
        status,
        dismissStatus,
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
