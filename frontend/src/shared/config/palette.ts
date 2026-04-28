export interface Palette {
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMid: string;
  textDim: string;
  sidebarBg: string;
  stripBg: string;
  chipBg: string;
}

export const PAL: Record<"light" | "dark", Palette> = {
  light: {
    bg: "#f5f3ee",
    surface: "#ffffff",
    border: "#e0dbd0",
    text: "#18150f",
    textMid: "#4a4540",
    textDim: "#9a9590",
    sidebarBg: "#f0ece3",
    stripBg: "#ede9e2",
    chipBg: "#e8e3da",
  },
  dark: {
    bg: "#0e0d0b",
    surface: "#181613",
    border: "#2b2820",
    text: "#e8e2d8",
    textMid: "#9a9288",
    textDim: "#5a5450",
    sidebarBg: "#0a0908",
    stripBg: "#111009",
    chipBg: "#1e1c18",
  },
};
