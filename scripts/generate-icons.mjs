// Generates Play Store-ready icon assets from the wallet preview images.
// icon.png                    → 512×512, solid #006874 background
// android-icon-foreground.png → 1024×1024, transparent bg, wallet in 66% safe zone
// android-icon-background.png → 1024×1024, solid #006874
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const LIGHT_ICON_SRC = path.join(root, "assets/icon_previews/light_icon.png");
const LIGHT_ADAPTIVE_SRC = path.join(root, "assets/icon_previews/light_adaptive_icon.png");

const ICON_OUT = path.join(root, "assets/images/icon.png");
const FOREGROUND_OUT = path.join(root, "assets/images/android-icon-foreground.png");
const BACKGROUND_OUT = path.join(root, "assets/images/android-icon-background.png");

const PRIMARY = "#006874";
// Safe zone: 66% of 1024 = ~676px, use 660 for breathing room
const ADAPTIVE_SIZE = 1024;
const SAFE_ZONE_PX = 660;
// Icon canvas wallet size: ~80% of 512 = 410px
const ICON_WALLET_PX = 410;

// Background colour in the preview images: rgb(221, 246, 250)
const BG = { r: 221, g: 246, b: 250 };
// Tolerance for colour-key (per-channel)
const TOLERANCE = 20;

/**
 * Strips the flat light-cyan background from a PNG buffer,
 * returning a buffer with those pixels made transparent.
 */
async function removeBackground(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4
  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += channels) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    if (
      Math.abs(r - BG.r) <= TOLERANCE &&
      Math.abs(g - BG.g) <= TOLERANCE &&
      Math.abs(b - BG.b) <= TOLERANCE
    ) {
      out[i + 3] = 0; // make transparent
    }
  }

  return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

async function generatePlayStoreIcon() {
  const walletTransparent = await removeBackground(LIGHT_ICON_SRC);

  const walletResized = await sharp(walletTransparent)
    .resize(ICON_WALLET_PX, ICON_WALLET_PX, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: PRIMARY },
  })
    .composite([{ input: walletResized, gravity: "center" }])
    .png()
    .toFile(ICON_OUT);

  console.log(`✓ icon.png → 512×512, background ${PRIMARY}`);
}

async function generateAdaptiveForeground() {
  const walletTransparent = await removeBackground(LIGHT_ADAPTIVE_SRC);

  const walletResized = await sharp(walletTransparent)
    .resize(SAFE_ZONE_PX, SAFE_ZONE_PX, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: {
      width: ADAPTIVE_SIZE,
      height: ADAPTIVE_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: walletResized, gravity: "center" }])
    .png()
    .toFile(FOREGROUND_OUT);

  console.log(`✓ android-icon-foreground.png → ${ADAPTIVE_SIZE}×${ADAPTIVE_SIZE}, wallet in ${SAFE_ZONE_PX}px safe zone, transparent bg`);
}

async function generateAdaptiveBackground() {
  await sharp({
    create: {
      width: ADAPTIVE_SIZE,
      height: ADAPTIVE_SIZE,
      channels: 3,
      background: PRIMARY,
    },
  })
    .png()
    .toFile(BACKGROUND_OUT);

  console.log(`✓ android-icon-background.png → ${ADAPTIVE_SIZE}×${ADAPTIVE_SIZE}, solid ${PRIMARY}`);
}

async function main() {
  await generatePlayStoreIcon();
  await generateAdaptiveForeground();
  await generateAdaptiveBackground();

  // Report file sizes
  const { statSync } = await import("fs");
  for (const f of [ICON_OUT, FOREGROUND_OUT, BACKGROUND_OUT]) {
    const kb = (statSync(f).size / 1024).toFixed(1);
    console.log(`  ${path.basename(f)}: ${kb} KB`);
  }
  console.log("\nAll icons generated. Max allowed: 1024 KB each.");
}

main().catch((e) => { console.error(e); process.exit(1); });
