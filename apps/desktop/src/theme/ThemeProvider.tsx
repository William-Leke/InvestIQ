import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type Appearance,
  cssVars,
  defaultAppearance,
  FONT_WEIGHTS,
  fontStack,
  type Mode,
  type Palette,
  resolvePalette,
  sanitize,
} from "./tokens";

const STORAGE_KEY = "investiq.appearance";

interface ThemeValue {
  appearance: Appearance;
  setAppearance: (next: Appearance | ((prev: Appearance) => Appearance)) => void;
  /** The mode on screen: the saved choice, or the system's when set to follow it. */
  mode: Mode;
  palette: Palette;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function load(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : defaultAppearance();
  } catch {
    return defaultAppearance();
  }
}

function useSystemMode(): Mode {
  const query = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  const [mode, setMode] = useState<Mode>(query?.matches ? "light" : "dark");
  useEffect(() => {
    if (!query) return;
    const onChange = () => setMode(query.matches ? "light" : "dark");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [query]);
  return mode;
}

const loadedFonts = new Set<string>();
function loadFont(name: string) {
  const weights = FONT_WEIGHTS[name];
  if (!weights || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(load);
  const systemMode = useSystemMode();
  const mode: Mode = appearance.mode === "system" ? systemMode : appearance.mode;
  const palette = useMemo(() => resolvePalette(appearance, mode), [appearance, mode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // Storage can be unavailable (private mode); settings then last for this session only.
    }
  }, [appearance]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.style.colorScheme = mode;
    for (const [k, v] of Object.entries(cssVars(palette))) root.style.setProperty(k, v);

    const sans = appearance.sans;
    const display = appearance.display === "Same as body" ? sans : appearance.display;
    const mono = appearance.mono === "Same as body" ? sans : appearance.mono;
    [sans, display, mono].forEach(loadFont);
    root.style.setProperty("--iq-sans", fontStack(sans, "sans"));
    root.style.setProperty("--iq-display", fontStack(display, "display"));
    root.style.setProperty("--iq-mono", appearance.mono === "Same as body" ? fontStack(sans, "sans") : fontStack(mono, "mono"));
    root.style.setProperty("--iq-rs", String(appearance.radius));
    root.style.fontSize = `${appearance.scale}%`;
  }, [palette, mode, appearance.sans, appearance.display, appearance.mono, appearance.radius, appearance.scale]);

  const value = useMemo(() => ({ appearance, setAppearance, mode, palette }), [appearance, mode, palette]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
