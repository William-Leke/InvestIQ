import { describe, expect, it } from "vitest";
import {
  activePreset,
  contrast,
  contrastCheck,
  cssVars,
  DEFAULTS,
  defaultAppearance,
  mix,
  PRESETS,
  resolvePalette,
  sanitize,
  withColor,
  withPreset,
} from "./tokens";

describe("appearance tokens", () => {
  it("resolves defaults, then applies only valid overrides", () => {
    const a = withColor(defaultAppearance(), "dark", "accent", "#FF8800");
    expect(resolvePalette(a, "dark").accent).toBe("#ff8800");
    expect(resolvePalette(a, "light")).toEqual(DEFAULTS.light);
    const bad = { ...a, colors: { dark: { accent: "orange" as string }, light: {} } };
    expect(resolvePalette(bad, "dark").accent).toBe(DEFAULTS.dark.accent);
  });

  it("drops an override that equals the default, so the Trendsight preset stays selected", () => {
    let a = withColor(defaultAppearance(), "dark", "up", "#00ff00");
    expect(activePreset(a, "dark")).toBe(-1);
    a = withColor(a, "dark", "up", DEFAULTS.dark.up);
    expect(a.colors.dark).toEqual({});
    expect(activePreset(a, "dark")).toBe(0);
  });

  it("applies a preset to one mode and recognizes it as active", () => {
    const a = withPreset(defaultAppearance(), "dark", 2);
    expect(activePreset(a, "dark")).toBe(2);
    expect(resolvePalette(a, "dark").accent).toBe(PRESETS.dark[2]![1]!.accent);
    expect(activePreset(a, "light")).toBe(0);
    expect(activePreset(withPreset(a, "dark", 0), "dark")).toBe(0);
  });

  it("keeps every preset readable: primary text at 4.5:1 and market colors at 3:1 on panels", () => {
    for (const mode of ["dark", "light"] as const) {
      for (const [name, p] of PRESETS[mode]) {
        const pal = p ?? DEFAULTS[mode];
        for (const key of ["fg", "muted", "up", "down", "accent"] as const) {
          expect(contrastCheck(pal, key)?.ok, `${mode} ${name} ${key}`).toBe(true);
        }
      }
    }
  });

  it("computes WCAG contrast and color mixes", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(cssVars(DEFAULTS.dark)["--iq-on-accent"]).toBe("#0b0f19");
  });

  it("sanitizes stored settings", () => {
    const a = sanitize({ mode: "light", colors: { dark: { bg: "#123456", fg: "red" } }, sans: "Comic Sans", scale: 400, radius: -1 });
    expect(a.mode).toBe("light");
    expect(a.colors.dark).toEqual({ bg: "#123456" });
    expect(a.sans).toBe("System UI");
    expect(a.scale).toBe(125);
    expect(a.radius).toBe(0);
    expect(sanitize("garbage")).toEqual(defaultAppearance());
  });
});
