export type ProductWorldId =
  | "xv2-plus"
  | "xflava-70000"
  | "violet-eclipse"
  | "yellow-freeze"
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
    id: "xv2-plus",
    slug: "xv2-plus",
    number: "01",
    name: "X-V2 Plus",
    flavor: "Lock · Power · Boost",
    bg: "#6C7BFF",
    word: "X-V2 PLUS",
    wordColor: "#E9ECFF",
    accent: "#FFD23F",
    accentInk: "#111111",
    ink: "#0B0E24",
    inkMuted: "rgba(11, 14, 36, 0.78)",
    surfaceTint: "rgba(255, 255, 255, 0.24)",
    image: "/products/x-slimbar.png",
    viewerSrc: "/3d/models-v2.html?transparent&model=xv2-plus",
    specs: {
      puffs: "SMART LED 88",
      finish: "SATIN BLACK + GLOSS RIM",
      display: "LOCK / POWER / BOOST",
    },
    tagline: "Compact satin-black slab with tri-mode LED telemetry.",
  },
  {
    id: "xflava-70000",
    slug: "xflava-70000",
    number: "02",
    name: "XFLAVA 70000",
    flavor: "Wang Wang Ice",
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
    viewerSrc: "/3d/models-v2.html?transparent&model=xflava-70000",
    specs: {
      puffs: "70,000 PUFFS",
      finish: "GRAPHITE + GLOSS TOP BAND",
      display: "DUAL AIRFLOW SLOTS",
    },
    tagline: "Oxbar V2 Long chassis with glossy XFLAVA crown.",
  },
  {
    id: "violet-eclipse",
    slug: "violet-eclipse",
    number: "03",
    name: "Violet Eclipse",
    flavor: "X-VAPE X-V2 Plus · 10ML",
    bg: "#7B4DFF",
    word: "ECLIPSE",
    wordColor: "rgba(237, 230, 255, 0.34)",
    accent: "#B6FF4D",
    accentInk: "#0C1804",
    ink: "#0B061A",
    inkMuted: "rgba(11, 6, 26, 0.80)",
    surfaceTint: "rgba(255, 255, 255, 0.24)",
    image: "/products/black-elite-60000.png",
    viewerSrc: "/3d/models-v2.html?transparent&model=violet-eclipse",
    specs: {
      puffs: "10ML POD",
      finish: "X-VAPE SATIN BLACK",
      display: "X-V2 PLUS COMPATIBLE",
    },
    tagline: "Crisp Violet Eclipse 10ML pod engineered for X-V2 Plus.",
  },
  {
    id: "yellow-freeze",
    slug: "yellow-freeze",
    number: "04",
    name: "Yellow Freeze",
    flavor: "X-VAPE X-V2 Plus · 10ML",
    bg: "#F5C400",
    word: "FREEZE",
    wordColor: "rgba(17, 17, 17, 0.20)",
    accent: "#1FD17A",
    accentInk: "#071B10",
    ink: "#111111",
    inkMuted: "rgba(17, 17, 17, 0.78)",
    surfaceTint: "rgba(255, 255, 255, 0.34)",
    image: "/products/zflava-50000.png",
    viewerSrc: "/3d/models-v2.html?transparent&model=yellow-freeze",
    specs: {
      puffs: "10ML POD",
      finish: "X-VAPE SATIN BLACK",
      display: "X-V2 PLUS COMPATIBLE",
    },
    tagline: "Icy Yellow Freeze 10ML pod with snap-fit mouthpiece.",
  },
  {
    id: "x-slimbar",
    slug: "x-slimbar",
    number: "05",
    name: "X-Slimbar",
    flavor: "Cobalt & Champagne Dual",
    bg: "#FF6B4A",
    word: "SLIMBAR",
    wordColor: "#FFE5DE",
    accent: "#00F0B5",
    accentInk: "#041C16",
    ink: "#160704",
    inkMuted: "rgba(22, 7, 4, 0.78)",
    surfaceTint: "rgba(255, 255, 255, 0.24)",
    image: "/products/x-slimbar.png",
    viewerSrc: "/3d/x-slimbar.html?transparent&accent=%2300F0B5&accentInk=%23041C16",
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
    number: "06",
    name: "Black Elite 60000",
    flavor: "Watermelon Ice",
    bg: "#FF3D5A",
    word: "WATERMELON",
    wordColor: "#FFD6DD",
    accent: "#B6FF4D",
    accentInk: "#0C1804",
    ink: "#0F0306",
    inkMuted: "rgba(15, 3, 6, 0.80)",
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
    number: "07",
    name: "ZFLAVA 50000",
    flavor: "Mixed Garden",
    bg: "#10B981",
    word: "GARDEN",
    wordColor: "rgba(4, 32, 22, 0.22)",
    accent: "#FFE14D",
    accentInk: "#161302",
    ink: "#042016",
    inkMuted: "rgba(4, 32, 22, 0.80)",
    surfaceTint: "rgba(255, 255, 255, 0.28)",
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
    number: "08",
    name: "XFLAVA Metal",
    flavor: "Brushed Alloy Edition",
    bg: "#22389C",
    word: "METAL",
    wordColor: "#2F48B8",
    wordStroke: "#FF8A3D",
    accent: "#FF8A3D",
    accentInk: "#1A0A02",
    ink: "#F8FAFC",
    inkMuted: "rgba(248, 250, 252, 0.78)",
    surfaceTint: "rgba(255, 255, 255, 0.12)",
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
