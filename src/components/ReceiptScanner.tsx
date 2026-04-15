import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';

import { parseReceiptText, ParsedReceipt } from '../utils/receiptParser';
import { useAppTheme } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult: (result: { parsed: ParsedReceipt; imageUri: string }) => void;
}

export const ReceiptScanner: React.FC<Props> = ({ visible, onClose, onResult }) => {
  const theme = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const processImage = async (uri: string) => {
    setBusy(true);
    setError(null);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const result = await TextRecognition.recognize(manipulated.uri);
      const parsed = parseReceiptText(result.text);
      onResult({ parsed, imageUri: manipulated.uri });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read receipt');
    } finally {
      setBusy(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) await processImage(photo.uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed');
    }
  };

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  const renderBody = () => {
    if (!permission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View style={[styles.center, { padding: 24, gap: 12 }]}>
          <Text style={{ color: theme.colors.onBackground, textAlign: 'center' }}>
            Camera access is needed to scan receipts.
          </Text>
          <Button mode="contained" onPress={requestPermission}>
            Grant camera access
          </Button>
          <Button mode="outlined" onPress={handlePickGallery}>
            Pick from gallery
          </Button>
        </View>
      );
    }
    return (
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        {busy && (
          <View style={[StyleSheet.absoluteFill, styles.busy]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 12 }}>Reading receipt…</Text>
          </View>
        )}
        <View style={styles.controls}>
          {error && (
            <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text>
          )}
          <Button
            mode="contained"
            icon="camera"
            onPress={handleCapture}
            disabled={busy}
          >
            Capture
          </Button>
          <Button
            mode="outlined"
            icon="image"
            onPress={handlePickGallery}
            disabled={busy}
            textColor="#fff"
          >
            Pick from gallery
          </Button>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
            Scan receipt
          </Text>
          <Button onPress={onClose} disabled={busy}>
            Close
          </Button>
        </View>
        {renderBody()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  busy: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    gap: 8,
  },
});
