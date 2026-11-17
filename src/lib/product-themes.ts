export type ProductWorldId =
  | "x-slimbar"
  | "black-elite-60000"
  | "zflava-50000"
  | "xflava-metal";

export interface ProductTheme {
  id: ProductWorldId;
  slug: string;
  number: string;
  name: string;
  flavor: string;
  bg: string;
  word: string;
  wordColor: string;
  wordStroke?: string;
  accent: string;
  accentInk: string;
  ink: string;
  inkMuted: string;
  surfaceTint: string;
  image: string;
  viewerSrc: string;
  specs: {
    puffs: string;
    finish: string;
    display: string;
  };
  tagline: string;
}

export const PRODUCT_THEMES: ProductTheme[] = [
  {
    id: "x-slimbar",
    slug: "x-slimbar",
    number: "01",
    name: "X-Slimbar",
    flavor: "Cobalt & Champagne Dual",
    bg: "#6C7BFF",
    word: "SLIMBAR",
    wordColor: "#E9ECFF",
    accent: "#FFD23F",
    accentInk: "#111111",
    ink: "#0B0E24",
    inkMuted: "rgba(11, 14, 36, 0.78)",
    surfaceTint: "rgba(255, 255, 255, 0.24)",
    image: "/products/x-slimbar.png",
    viewerSrc: "/3d/x-slimbar.html?transparent&accent=%23FFD23F&accentInk=%23111111",
    specs: {
      puffs: "25,000 PUFFS",
      finish: "MATTE + METALLIC SHELL",
      display: "DUAL BOOST / ECO SCREEN",
    },
    tagline: "Featherweight chassis with dual-mode power output.",
  },
  {
    id: "black-elite-60000",
    slug: "black-elite-60000",
    number: "02",
    name: "Black Elite 60000",
    flavor: "Watermelon Ice",
    bg: "#FF3D5A",
    word: "WATERMELON",
    wordColor: "#FFD6DD",
    accent: "#B6FF4D",
    accentInk: "#0C1804",
    ink: "#0F0306",
    inkMuted: "rgba(15, 3, 6, 0.8)",
    surfaceTint: "rgba(255, 255, 255, 0.22)",
    image: "/products/black-elite-60000.png",
    viewerSrc: "/3d/black-elite.html?transparent&accent=%23B6FF4D&accentInk=%230C1804",
    specs: {
      puffs: "60,000 PUFFS",
      finish: "BRUSHED ALLOY + GLASS",
      display: "LIVING LIQUID CHAMBER",
    },
    tagline: "High-capacity transparent tank with precision airflow.",
  },
  {
    id: "zflava-50000",
    slug: "zflava-50000",
    number: "03",
    name: "ZFLAVA 50000",
    flavor: "Mixed Garden",
    bg: "#F5C400",
    word: "GARDEN",
    wordColor: "#111111",
    accent: "#1FD17A",
    accentInk: "#071B10",
    ink: "#111111",
    inkMuted: "rgba(17, 17, 17, 0.78)",
    surfaceTint: "rgba(255, 255, 255, 0.34)",
    image: "/products/zflava-50000.png",
    viewerSrc: "/3d/vape-360.html?transparent&model=zflava",
    specs: {
      puffs: "50,000 PUFFS",
      finish: "CRYSTAL ACRYLIC BODY",
      display: "SMART LED TELEMETRY",
    },
    tagline: "Crisp botanical profile housed in a crystal-clear shell.",
  },
  {
    id: "xflava-metal",
    slug: "xflava-metal",
    number: "04",
    name: "XFLAVA Metal",
    flavor: "Brushed Alloy Edition",
    bg: "#14161A",
    word: "XFLAVA",
    wordColor: "#2B2F36",
    wordStroke: "#00E5FF",
    accent: "#00E5FF",
    accentInk: "#061418",
    ink: "#F8FAFC",
    inkMuted: "rgba(248, 250, 252, 0.76)",
    surfaceTint: "rgba(255, 255, 255, 0.08)",
    image: "/products/xflava-metal.png",
    viewerSrc: "/3d/vape-360.html?transparent&model=xflava",
    specs: {
      puffs: "50,000 PUFFS",
      finish: "CNC BRUSHED METAL",
      display: "HD OLED STATUS",
    },
    tagline: "Industrial brushed-alloy build engineered for daily carry.",
  },
];

export function getProductThemeCssVars(theme: ProductTheme): Record<string, string> {
  return {
    "--bg": theme.bg,
    "--word": theme.wordColor,
    "--accent": theme.accent,
    "--accent-ink": theme.accentInk,
    "--ink": theme.ink,
    "--ink-muted": theme.inkMuted,
    "--surface-tint": theme.surfaceTint,
  };
}
