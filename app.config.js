const WEB_CLIENT_ID = "13205155505-h8notg3rkd4bgr1151s4re3fn4s6u6f1.apps.googleusercontent.com";
const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID ?? WEB_CLIENT_ID;

// Reversed web client ID: com.googleusercontent.apps.<project-number>-<hash>
const reversedWebClientId =
  "com.googleusercontent.apps." + webClientId.replace(".apps.googleusercontent.com", "");

/** @type {import('expo/config').ExpoConfig} */
export default {
  name: "Standalone Budget Manager",
  slug: "standalone-budget",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "finance",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  android: {
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    permissions: ["RECORD_AUDIO", "android.permission.RECORD_AUDIO"],
    adaptiveIcon: {
      backgroundColor: "#006874",
      foregroundImage: "./assets/images/screen.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.hajzerbela.finance",
  },
  ios: {
    supportsTablet: true,
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
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
        backgroundColor: "#006874",
        dark: { backgroundColor: "#006874" },
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
  extra: {
    eas: {
      projectId: "ba890362-4b67-4d6f-8b8a-fbd08588fc2f",
    },
  },
};
