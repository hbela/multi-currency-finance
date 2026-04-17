import React, { useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { IconButton } from 'react-native-paper';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { useAppTheme } from '../theme';

// Ensures only one dictation session is active at a time across all instances.
let activeButtonId: string | null = null;

interface DictationButtonProps {
  id: string;
  onDictationComplete: (text: string) => void;
  disabled?: boolean;
}

export const DictationButton: React.FC<DictationButtonProps> = ({ id, onDictationComplete, disabled }) => {
  const theme = useAppTheme();
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    if (activeButtonId !== id) return;
    const text = event.results?.[0]?.transcript ?? '';
    if (text) onDictationComplete(text);
  });

  useSpeechRecognitionEvent('end', () => {
    if (activeButtonId !== id) return;
    activeButtonId = null;
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    if (activeButtonId !== id) return;
    activeButtonId = null;
    setIsListening(false);
  });

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return granted;
  };

  const handlePress = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      activeButtonId = null;
      setIsListening(false);
      return;
    }

    // Stop any other active session first
    if (activeButtonId !== null) {
      ExpoSpeechRecognitionModule.stop();
    }

    const ok = await requestPermissions();
    if (!ok) return;

    activeButtonId = id;
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false });
  };

  return (
    <IconButton
      icon={isListening ? 'microphone' : 'microphone-outline'}
      iconColor={isListening ? theme.colors.primary : theme.colors.onSurfaceVariant}
      size={24}
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={isListening ? 'Stop dictation' : 'Start dictation'}
    />
  );
};
