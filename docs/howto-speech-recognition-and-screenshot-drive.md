# How to Implement Speech Recognition & Screenshot Upload to Google Drive in a React Native Expo App

This guide walks you through adding two features from the standalone-taskmanager app to another Expo project:

1. **Speech Recognition (Dictation Button)** — voice-to-text input using `expo-speech-recognition`
2. **Screen Screenshot Capture + Google Drive Upload** — capture any screen as PNG and batch-upload to Drive

---

## Prerequisites

- Expo SDK 52+ project (managed or bare workflow)
- EAS Build configured (`eas.json` present, `eas-cli` installed)
- A Google Cloud project with the Google Drive API enabled
- Firebase project (used for Google Sign-In)

---

## Part 1 — Speech Recognition

### Step 1 — Install the package

```bash
npx expo install expo-speech-recognition
```

### Step 2 — Configure app.config.ts / app.json

Add the plugin and declare permissions:

```typescript
// app.config.ts
export default {
  expo: {
    plugins: [
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone for voice input.',
          speechRecognitionPermission: 'Allow $(PRODUCT_NAME) to use speech recognition for voice input.',
        },
      ],
    ],
    ios: {
      infoPlist: {
        NSSpeechRecognitionUsageDescription:
          'Allow $(PRODUCT_NAME) to use speech recognition for voice input.',
        NSMicrophoneUsageDescription:
          'Allow $(PRODUCT_NAME) to access your microphone for voice input.',
      },
    },
    android: {
      permissions: [
        'RECORD_AUDIO',
        'android.permission.RECORD_AUDIO',
      ],
    },
  },
};
```

### Step 3 — Copy the DictationButton component

Copy [`components/DictationButton.tsx`](../components/DictationButton.tsx) into your project's components folder. The component:

- Uses a module-level `activeButtonId` variable to ensure only one dictation session is active at a time across multiple button instances on the same screen.
- Requests `RECORD_AUDIO` on Android via `PermissionsAndroid` and uses `requestSpeechRecognizerPermissionsAsync` from the module on both platforms.
- Hooks into three events via `useSpeechRecognitionEvent`: `result`, `end`, and `error`.
- Accepts a `locale` from your translation hook — pass the user's current language code (e.g. `'en-US'`, `'tr-TR'`).

The component interface:

```typescript
interface DictationButtonProps {
  id: string;               // Unique string per button instance on a screen
  onDictationComplete: (text: string) => void;
  disabled?: boolean;
}
```

### Step 4 — Use the component in a form

```typescript
import DictationButton from '@/components/DictationButton';

// In your form component:
const [title, setTitle] = useState('');

<TextInput value={title} onChangeText={setTitle} placeholder="Title" />
<DictationButton
  id="title-field"
  onDictationComplete={(text) => setTitle(prev => prev + text)}
/>
```

For multiple fields on the same screen use distinct `id` values (`"title-field"`, `"description-field"`, etc.).

### Step 5 — Rebuild the app

Speech recognition requires a native build — Expo Go will not work:

```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

---

## Part 2 — Screenshot Capture + Google Drive Upload

This feature has three parts: Google Sign-In setup, the Drive service, and the screenshot context.

---

### Step 1 — Google Cloud & Firebase setup

1. In [Google Cloud Console](https://console.cloud.google.com), enable the **Google Drive API** for your project.
2. Under **APIs & Services → Credentials**, create an OAuth 2.0 client ID for your Android app (use your app's SHA-1) and one for iOS (use your bundle ID).
3. Note the **Web Client ID** — you will need it as an environment variable.
4. In Firebase Console, add your app and download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) into the project root.

### Step 2 — Install packages

```bash
npx expo install @react-native-google-signin/google-signin
npx expo install @react-native-firebase/app @react-native-firebase/auth
npx expo install react-native-view-shot
```

### Step 3 — Set the environment variable

Create (or update) `.env` in the project root:

```
EXPO_PUBLIC_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE
```

### Step 4 — Configure app.config.ts

```typescript
// app.config.ts
export default {
  expo: {
    plugins: [
      [
        '@react-native-google-signin/google-signin',
        {
          webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
          iosUrlScheme: 'YOUR_IOS_REVERSED_CLIENT_ID', // from GoogleService-Info.plist → REVERSED_CLIENT_ID
        },
      ],
      '@react-native-firebase/app',
    ],
    android: {
      googleServicesFile: './google-services.json',
    },
    ios: {
      googleServicesFile: './GoogleService-Info.plist',
    },
  },
};
```

The `iosUrlScheme` value is the `REVERSED_CLIENT_ID` field inside `GoogleService-Info.plist`, e.g. `com.googleusercontent.apps.13205155505-xxxx`.

### Step 5 — Copy the Google Drive service

Copy [`lib/export/googleDriveService.ts`](../lib/export/googleDriveService.ts) into your project (adjust the import path for your logging utility or replace `logInfo`/`logError` calls with `console.log`/`console.error`).

The service exports two functions:

| Function | Purpose |
|---|---|
| `uploadToGoogleDrive(fileUri, fileName)` | Upload CSV / XLSX files |
| `uploadImageToGoogleDrive(fileUri, fileName, mimeType?)` | Upload PNG screenshots (default `image/png`) |

Both return `{ id: string; webViewLink?: string }` on success.

The service calls `GoogleSignin.configure()` at module load time using `EXPO_PUBLIC_WEB_CLIENT_ID`. It tries `getTokens()` first, falls back to `signInSilently()`, and finally `signIn()` if needed — no extra auth code is required in your screens.

### Step 6 — Copy the Screenshot Context

Copy [`context/ScreenshotContext.tsx`](../context/ScreenshotContext.tsx) into your project. If your project uses a different path alias, update the import for `googleDriveService` accordingly.

The context exposes:

```typescript
interface ScreenshotContextType {
  selectedDevice: DeviceType;           // 'phone' | 'tablet7' | 'tablet10'
  setSelectedDevice: (d: DeviceType) => void;
  capturedScreenshots: CapturedScreenshot[];
  isCapturing: boolean;
  isUploading: boolean;
  captureCurrentScreen: (screenName?: string) => Promise<void>;
  uploadAllToGoogleDrive: () => Promise<void>;
  clearAllScreenshots: () => void;
}
```

`captureCurrentScreen` uses `captureScreen` from `react-native-view-shot` with `format: 'png'` and `quality: 1`. Width/height are intentionally **not** set to avoid layout distortion — the device type label is used only for the file name.

### Step 7 — Wrap your app with the provider

In your root layout (e.g. `app/_layout.tsx`):

```typescript
import { ScreenshotProvider } from '@/context/ScreenshotContext';

export default function RootLayout() {
  return (
    <ScreenshotProvider>
      {/* other providers */}
      <Stack />
    </ScreenshotProvider>
  );
}
```

### Step 8 — Copy the ScreenshotCaptureButton component

Copy [`components/ScreenshotCaptureButton.tsx`](../components/ScreenshotCaptureButton.tsx) into your project. Place it wherever you want a capture button — typically in a screen header:

```typescript
import ScreenshotCaptureButton from '@/components/ScreenshotCaptureButton';

// Inside a screen component, in the header options:
<Stack.Screen
  options={{
    headerRight: () => <ScreenshotCaptureButton screenName="home" />,
  }}
/>
```

### Step 9 — Add a management UI

You need a screen or section where the user can review captures and trigger the Drive upload. The pattern used in this app (in the Settings screen) shows:

```typescript
import { useScreenshot, DEVICE_DIMENSIONS, DeviceType } from '@/context/ScreenshotContext';

function ScreenshotManager() {
  const {
    selectedDevice,
    setSelectedDevice,
    capturedScreenshots,
    isUploading,
    uploadAllToGoogleDrive,
    clearAllScreenshots,
  } = useScreenshot();

  return (
    <>
      {/* Device type selector */}
      {(['phone', 'tablet7', 'tablet10'] as DeviceType[]).map(device => (
        <Chip
          key={device}
          selected={selectedDevice === device}
          onPress={() => setSelectedDevice(device)}
        >
          {DEVICE_DIMENSIONS[device].label}
        </Chip>
      ))}

      {/* Screenshot count */}
      <Text>{capturedScreenshots.length} screenshot(s) captured</Text>

      {/* Upload button */}
      <Button
        onPress={uploadAllToGoogleDrive}
        loading={isUploading}
        disabled={capturedScreenshots.length === 0 || isUploading}
      >
        Upload All to Google Drive
      </Button>

      {/* Clear button */}
      <Button onPress={clearAllScreenshots} disabled={capturedScreenshots.length === 0}>
        Clear All
      </Button>
    </>
  );
}
```

### Step 10 — Rebuild

Both `react-native-view-shot` and `@react-native-google-signin/google-signin` require a native build:

```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

---

## Checklist Before Testing

- [ ] `EXPO_PUBLIC_WEB_CLIENT_ID` is set in `.env`
- [ ] `google-services.json` is in the project root (Android)
- [ ] `GoogleService-Info.plist` is in the project root (iOS)
- [ ] `iosUrlScheme` in `app.config.ts` matches the `REVERSED_CLIENT_ID` in `GoogleService-Info.plist`
- [ ] Google Drive API is enabled in Google Cloud Console
- [ ] SHA-1 fingerprint of your keystore is registered in Firebase/GCP (Android)
- [ ] All copied files have their import paths adjusted to your project's alias/structure
- [ ] App rebuilt with EAS (not Expo Go)

---

## Common Issues

| Problem | Likely Cause |
|---|---|
| `DEVELOPER_ERROR` on Google Sign-In (Android) | SHA-1 mismatch — register the SHA-1 of your EAS build keystore in Firebase |
| `Sign-in required` loop | `EXPO_PUBLIC_WEB_CLIENT_ID` is wrong or missing |
| Screenshot is blank or black | Captured before the screen finished rendering — the 100ms delay in `captureCurrentScreen` handles most cases; increase it if needed |
| Speech recognition never starts on Android | `RECORD_AUDIO` permission not granted at runtime or missing from `app.config.ts` |
| `expo-speech-recognition not available` in console | App running in Expo Go — use a development build |
