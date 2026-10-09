export type Mode = "dark" | "light";
export type ModePref = Mode | "system";

/** Colors a user can edit. Everything else (line-2, soft text, text on accent) is derived. */
export const COLOR_KEYS = ["bg", "panel", "cell", "line", "fg", "muted", "faint", "accent", "up", "down"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type Palette = Record<ColorKey, string>;

export const DEFAULTS: Record<Mode, Palette> = {
  dark: {
    bg: "#0c0c0d",
    panel: "#131315",
    cell: "#1a1a1d",
    line: "#27272c",
    fg: "#f2f2f4",
    muted: "#a3a3ae",
    faint: "#71717c",
    accent: "#8ab6ea",
    up: "#7fd6c8",
    down: "#e07fae",
  },
  light: {
    bg: "#f6f6f8",
    panel: "#ffffff",
    cell: "#efeff3",
    line: "#dedee5",
    fg: "#111114",
    muted: "#50505c",
    faint: "#85858f",
    accent: "#3f68c2",
    up: "#0b7f74",
    down: "#b2387a",
  },
};

export const PRESETS: Record<Mode, [name: string, palette: Palette | null][]> = {
  dark: [
    ["Trendsight", null],
    ["Ocean", { bg: "#020617", panel: "#0b1222", cell: "#0f172a", line: "#1e293b", fg: "#f1f5f9", muted: "#94a3b8", faint: "#64748b", accent: "#38bdf8", up: "#34d399", down: "#fb7185" }],
    ["Midnight", { bg: "#070b18", panel: "#0d1428", cell: "#121c36", line: "#1f2b4a", fg: "#e8eefc", muted: "#8a9bbd", faint: "#56668a", accent: "#7aa7ff", up: "#4ade9b", down: "#ff7a85" }],
    ["Amber terminal", { bg: "#0a0906", panel: "#12100b", cell: "#1a170f", line: "#2c2617", fg: "#f6e7c6", muted: "#b49b6b", faint: "#6f6043", accent: "#f5a623", up: "#8fe36b", down: "#ff6b57" }],
    ["High contrast", { bg: "#000000", panel: "#0a0a0a", cell: "#141414", line: "#3d3d3d", fg: "#ffffff", muted: "#cfcfcf", faint: "#9a9a9a", accent: "#4cc2ff", up: "#3dff8b", down: "#ff5c5c" }],
  ],
  light: [
    ["Trendsight", null],
    ["Ocean", { bg: "#f4f6fa", panel: "#ffffff", cell: "#edf1f6", line: "#dbe1ea", fg: "#0f172a", muted: "#475569", faint: "#7d8aa0", accent: "#0277b6", up: "#047857", down: "#be123c" }],
    ["Paper", { bg: "#f6f3ec", panel: "#fffdf8", cell: "#f1ece1", line: "#e3dbcb", fg: "#1d1a14", muted: "#6b6352", faint: "#a1977f", accent: "#9a5b13", up: "#1d7a45", down: "#b3322b" }],
    ["Graphite", { bg: "#f2f2f3", panel: "#ffffff", cell: "#ececee", line: "#d9d9dd", fg: "#18181b", muted: "#52525b", faint: "#8e8e96", accent: "#4f46e5", up: "#15803d", down: "#dc2626" }],
    ["High contrast", { bg: "#ffffff", panel: "#ffffff", cell: "#f2f2f2", line: "#b5b5b5", fg: "#000000", muted: "#2e2e2e", faint: "#5f5f5f", accent: "#0050a0", up: "#006b2d", down: "#b00020" }],
  ],
};

export const COLOR_GROUPS: [group: string, rows: [key: ColorKey, label: string, hint: string][]][] = [
  ["Text", [
    ["fg", "Primary text", "Company names, prices and table figures"],
    ["muted", "Secondary text", "Labels, tabs and captions"],
    ["faint", "Faint text", "Hints, sources and placeholders"],
  ]],
  ["Market", [
    ["up", "Gains", "Price up, positive change and growth"],
    ["down", "Losses", "Price down, negative values and errors"],
  ]],
  ["Accent", [["accent", "Buttons & highlights", "Active tab, links, chart lead series"]]],
  ["Surfaces", [
    ["bg", "Window background", "Behind everything"],
    ["panel", "Panels", "Cards, charts and the stats strip"],
    ["cell", "Inputs", "Search box, dropdowns and hovered rows"],
    ["line", "Borders", "Outlines, dividers and grid lines"],
  ]],
];

export const FONTS = {
  sans: ["System UI", "Inter", "IBM Plex Sans", "DM Sans", "Manrope", "Source Sans 3", "Figtree"],
  display: ["Same as body", "Montserrat", "Space Grotesk", "Sora", "Bricolage Grotesque", "Fraunces", "IBM Plex Sans"],
  mono: ["Same as body", "JetBrains Mono", "IBM Plex Mono", "Roboto Mono", "DM Mono"],
} as const;

/** Weights requested from Google Fonts for each family. */
export const FONT_WEIGHTS: Record<string, string> = {
  Inter: "400;500;600;700",
  "IBM Plex Sans": "400;500;600;700",
  "DM Sans": "400;500;600;700",
  Manrope: "400;500;600;700",
  "Source Sans 3": "400;600;700",
  Figtree: "400;500;600;700",
  Montserrat: "400;500;600;700",
  "Space Grotesk": "500;600;700",
  Sora: "500;600;700",
  "Bricolage Grotesque": "600;700;800",
  Fraunces: "500;600;700",
  "JetBrains Mono": "500;700",
  "IBM Plex Mono": "500;600",
  "Roboto Mono": "500;700",
  "DM Mono": "500",
};

export interface Appearance {
  mode: ModePref;
  colors: Record<Mode, Partial<Palette>>;
  sans: string;
  display: string;
  mono: string;
  /** Interface size in percent. */
  scale: number;
  /** Corner roundness multiplier, 0 to 2. */
  radius: number;
}

export const defaultAppearance = (): Appearance => ({
  mode: "system",
  colors: { dark: {}, light: {} },
  sans: "System UI",
  display: "Same as body",
  mono: "Same as body",
  scale: 100,
  radius: 1,
});

export const isHex = (v: string | undefined): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v);

/** The defaults for a mode with the user's valid overrides applied. */
export function resolvePalette(a: Appearance, mode: Mode): Palette {
  const out = { ...DEFAULTS[mode] };
  const o = a.colors[mode] ?? {};
  for (const k of COLOR_KEYS) {
    const v = o[k];
    if (isHex(v)) out[k] = v.toLowerCase();
  }
  return out;
}

/** Which preset (by index) the palette matches exactly, or -1. */
export function activePreset(a: Appearance, mode: Mode): number {
  const overrides = Object.keys(a.colors[mode] ?? {}).length;
  return PRESETS[mode].findIndex(([, p]) => {
    if (!p) return overrides === 0;
    const pal = resolvePalette(a, mode);
    return COLOR_KEYS.every((k) => pal[k] === p[k].toLowerCase());
  });
}

/** Stores a color override, dropping it when it equals the default so presets and resets stay clean. */
export function withColor(a: Appearance, mode: Mode, key: ColorKey, value: string | null): Appearance {
  const next = { ...(a.colors[mode] ?? {}) };
  if (value === null || value.toLowerCase() === DEFAULTS[mode][key]) delete next[key];
  else next[key] = value.toLowerCase();
  return { ...a, colors: { ...a.colors, [mode]: next } };
}

export function withPreset(a: Appearance, mode: Mode, index: number): Appearance {
  const p = PRESETS[mode][index]?.[1];
  const colors: Partial<Palette> = {};
  if (p) for (const k of COLOR_KEYS) if (p[k].toLowerCase() !== DEFAULTS[mode][k]) colors[k] = p[k].toLowerCase();
  return { ...a, colors: { ...a.colors, [mode]: colors } };
}

/** Parses stored settings, keeping only known fields with sane values. */
export function sanitize(raw: unknown): Appearance {
  const base = defaultAppearance();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const pickColors = (v: unknown): Partial<Palette> => {
    const out: Partial<Palette> = {};
    if (v && typeof v === "object") {
      for (const k of COLOR_KEYS) {
        const c = (v as Record<string, unknown>)[k];
        if (typeof c === "string" && isHex(c)) out[k] = c.toLowerCase();
      }
    }
    return out;
  };
  const colors = (r.colors ?? {}) as Record<string, unknown>;
  const pickFont = (v: unknown, list: readonly string[], fallback: string) =>
    typeof v === "string" && list.includes(v) ? v : fallback;
  const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
  return {
    mode: r.mode === "dark" || r.mode === "light" || r.mode === "system" ? r.mode : base.mode,
    colors: { dark: pickColors(colors.dark), light: pickColors(colors.light) },
    sans: pickFont(r.sans, FONTS.sans, base.sans),
    display: pickFont(r.display, FONTS.display, base.display),
    mono: pickFont(r.mono, FONTS.mono, base.mono),
    scale: clamp(r.scale, 85, 125, base.scale),
    radius: clamp(r.radius, 0, 2, base.radius),
  };
}

// ---- color math ----

function channel(hex: string, i: number) {
  return parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
}

export function luminance(hex: string): number {
  const [r, g, b] = [0, 1, 2].map((i) => {
    const v = channel(hex, i) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Linear mix of two hex colors; weight is the share of `a`. */
export function mix(a: string, b: string, weight: number): string {
  const out = [0, 1, 2].map((i) => Math.round(channel(a, i) * weight + channel(b, i) * (1 - weight)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const onColor = (hex: string) => (luminance(hex) > 0.4 ? "#0b0f19" : "#ffffff");

/** Minimum contrast against panels that keeps each color readable. */
export function contrastCheck(p: Palette, key: ColorKey): { ratio: number; ok: boolean } | null {
  if (key === "accent") {
    const ratio = contrast(p.accent, p.panel);
    return { ratio, ok: ratio >= 3 };
  }
  if (!["fg", "muted", "faint", "up", "down"].includes(key)) return null;
  const ratio = contrast(p[key], p.panel);
  const need = key === "fg" ? 4.5 : key === "faint" ? 2.5 : 3;
  return { ratio, ok: ratio >= need };
}

/** All CSS custom properties for a palette, including the derived ones. */
export function cssVars(p: Palette): Record<string, string> {
  return {
    "--iq-bg": p.bg,
    "--iq-panel": p.panel,
    "--iq-cell": p.cell,
    "--iq-line": p.line,
    "--iq-line-2": mix(p.line, p.fg, 0.8),
    "--iq-fg": p.fg,
    "--iq-soft": mix(p.fg, p.muted, 0.55),
    "--iq-muted": p.muted,
    "--iq-faint": p.faint,
    "--iq-accent": p.accent,
    "--iq-on-accent": onColor(p.accent),
    "--iq-up": p.up,
    "--iq-down": p.down,
  };
}

export function fontStack(name: string, kind: "sans" | "display" | "mono"): string {
  const system = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  if (name === "System UI") return system;
  const fallback = kind === "mono" ? 'ui-monospace, "SF Mono", Menlo, monospace' : name === "Fraunces" ? "Georgia, serif" : system;
  return `"${name}", ${fallback}`;
}
