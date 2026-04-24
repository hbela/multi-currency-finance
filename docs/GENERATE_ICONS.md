1. Assets to be created

icon.png → 512×512 px
adaptive-icon.png → 1024×1024 px
PNG, 32-bit, sRGB
File size < 1024 KB

2. No styling baked in

❌ No rounded corners
❌ No shadows
❌ No background transparency for Play icon (use solid background)

Google Play will automatically:

apply ~30% corner radius
handle masking per device

3. Adaptive icon (Expo config)
In your app.json / app.config.ts:

{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#006874"
      }
    }
  }
}


👉 Use my theme’s:

primary (rgb(0,104,116)) for light
primaryContainer or darker tone for dark if you want variants later

4. Pro tip (important)
My current icon is edge-safe, but for adaptive icons:

keep the wallet inside a safe zone (~66%)
avoid placing key elements near edges (Android may crop)