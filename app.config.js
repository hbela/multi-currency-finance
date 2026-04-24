const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID ?? "";

// Reversed web client ID: com.googleusercontent.apps.<project-number>-<hash>
const reversedWebClientId = webClientId
  ? "com.googleusercontent.apps." + webClientId.replace(".apps.googleusercontent.com", "")
  : "";

/** @type {import('expo/config').ExpoConfig} */
export default {
  name: "Budget",
  slug: "standalone-budget",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "finance",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  android: {
    googleServicesFile: "./google-services.json",
    permissions: ["RECORD_AUDIO", "android.permission.RECORD_AUDIO"],
    adaptiveIcon: {
      backgroundColor: "#006874",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.hajzerbela.finance",
  },
  ios: {
    supportsTablet: true,
    googleServicesFile: "./GoogleService-Info.plist",
    infoPlist: {
      NSSpeechRecognitionUsageDescription:
        "Allow Budget to use speech recognition for voice input.",
      NSMicrophoneUsageDescription:
        "Allow Budget to access your microphone for voice input.",
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    "expo-sqlite",
    "expo-localization",
    [
      "expo-speech-recognition",
      {
        microphonePermission:
          "Allow Budget to access your microphone for voice input.",
        speechRecognitionPermission:
          "Allow Budget to use speech recognition for voice input.",
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        webClientId,
        iosUrlScheme: reversedWebClientId,
      },
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};
