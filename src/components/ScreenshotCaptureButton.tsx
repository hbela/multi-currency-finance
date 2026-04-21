import React from 'react';
import { IconButton } from 'react-native-paper';
import { useScreenshot } from '@/src/context/ScreenshotContext';
import { useAppTheme } from '@/src/theme';

interface Props {
  screenName: string;
}

export default function ScreenshotCaptureButton({ screenName }: Props) {
  const theme = useAppTheme();
  const { captureCurrentScreen, isCapturing } = useScreenshot();

  return (
    <IconButton
      icon="camera"
      size={24}
      iconColor={theme.colors.primary}
      disabled={isCapturing}
      accessibilityLabel="Capture screenshot"
      onPress={() => captureCurrentScreen(screenName)}
    />
  );
}
