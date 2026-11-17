export const VAPE_THEME = {
  colors: {
    bgDark: "#071B52",
    bgDarkDeep: "#05143E",
    bgLight: "#f4f7fb",
    accentPrimary: "#E86F12",
    accentBright: "#F58A1F",
    accentCream: "#FFE0B2",
    orbitBlue: "#3b82f6",
    orbitAmber: "#f58a1f",
    orbitCyan: "#38bdf8",
  },
  shadows: {
    amberGlow: "0 0 32px rgba(232, 111, 18, 0.45)",
    amberGlowHover: "0 0 44px rgba(245, 138, 31, 0.55)",
  },
  fonts: {
    display: "var(--font-display)",
    serif: "var(--font-serif)",
    mono: "var(--font-mono)",
    sans: "var(--font-sans)",
  },
} as const;

export type ShowcaseDeviceId =
  | "x-slimbar"
  | "black-elite"
  | "zflava"
  | "xflava";

export interface ShowcaseDevice {
  id: ShowcaseDeviceId;
  indexLabel: string;
  label: string;
  title: string;
  flavorOrSpec: string;
  puffs: string;
  src: string;
}

export const SHOWCASE_DEVICES: ShowcaseDevice[] = [
  {
    id: "x-slimbar",
    indexLabel: "01",
    label: "X-Slimbar",
    title: "X-Slimbar",
    flavorOrSpec: "Dual Finish · Boost / Eco",
    puffs: "Matte & Metallic",
    src: "/3d/x-slimbar.html?transparent",
  },
  {
    id: "black-elite",
    indexLabel: "02",
    label: "Black Elite 60000",
    title: "Black Elite 60000",
    flavorOrSpec: "Watermelon Ice",
    puffs: "60,000 Puffs",
    src: "/3d/black-elite.html?transparent",
  },
  {
    id: "zflava",
    indexLabel: "03",
    label: "ZFLAVA 50000",
    title: "ZFLAVA 50000",
    flavorOrSpec: "Mixed Garden",
    puffs: "50,000 Puffs",
    src: "/3d/vape-360.html?transparent&model=zflava",
  },
  {
    id: "xflava",
    indexLabel: "04",
    label: "XFLAVA",
    title: "XFLAVA Metal",
    flavorOrSpec: "Brushed Alloy Edition",
    puffs: "50,000 Puffs",
    src: "/3d/vape-360.html?transparent&model=xflava",
  },
];
