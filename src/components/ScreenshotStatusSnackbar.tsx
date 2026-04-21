import React from 'react';
import { Snackbar } from 'react-native-paper';
import { useScreenshot } from '@/src/context/ScreenshotContext';

export default function ScreenshotStatusSnackbar() {
  const { status, dismissStatus } = useScreenshot();
  const visible = status.kind !== 'idle';
  const message = visible ? status.message : '';

  return (
    <Snackbar
      visible={visible}
      onDismiss={dismissStatus}
      duration={status.kind === 'error' ? 6000 : 2500}
      action={{ label: 'OK', onPress: dismissStatus }}>
      {message}
    </Snackbar>
  );
}
