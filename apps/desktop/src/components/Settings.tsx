import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import {
  activePreset,
  COLOR_GROUPS,
  type ColorKey,
  contrastCheck,
  defaultAppearance,
  DEFAULTS,
  FONTS,
  isHex,
  type Mode,
  type ModePref,
  PRESETS,
  withColor,
  withPreset,
} from "../theme/tokens";

const MODE_LABEL: Record<Mode, string> = { dark: "dark mode", light: "light mode" };

function Section({ title, caption, action, children }: { title: string; caption: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-line bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          <p className="text-xs text-muted">{caption}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-lg border border-line-2 bg-cell text-sm">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 font-medium ${v === value ? "bg-accent text-on-accent" : "text-muted hover:text-fg"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ k, label, hint }: { k: ColorKey; label: string; hint: string }) {
  const { appearance, setAppearance, mode, palette } = useTheme();
  const value = palette[k];
  const [draft, setDraft] = useState<string | null>(null);
  const changed = isHex(appearance.colors[mode][k]);
  const check = contrastCheck(palette, k);
  const set = (v: string | null) => setAppearance((a) => withColor(a, mode, k, v));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-2 border-b border-line py-2.5 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={`c-${k}`} className="block text-sm font-medium text-fg">
          {label}
        </label>
        <span className="block text-xs text-muted">{hint}</span>
      </div>
      {check ? (
        <span
          title={`Contrast ${check.ratio.toFixed(1)}:1 against panels`}
          className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap ${check.ok ? "text-faint" : "border border-down/40 bg-down/10 text-down"}`}
        >
          {check.ok ? "" : "Low · "}
          {check.ratio.toFixed(1)}:1
        </span>
      ) : (
        <span />
      )}
      <input
        id={`c-${k}`}
        type="color"
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-label={`${label} color`}
        className="h-8 w-9 cursor-pointer rounded-md border border-line-2 bg-cell p-0.5"
      />
      <input
        value={draft ?? value.toUpperCase()}
        onChange={(e) => {
          let v = e.target.value.trim();
          setDraft(v);
          if (v && !v.startsWith("#")) v = `#${v}`;
          if (isHex(v)) set(v);
        }}
        onBlur={() => setDraft(null)}
        maxLength={7}
        spellCheck={false}
        aria-label={`${label} hex value`}
        className="w-[5.5rem] rounded-md border border-line-2 bg-cell px-2 py-1.5 font-mono text-xs text-fg outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={() => set(null)}
        disabled={!changed}
        title="Reset to default"
        aria-label={`Reset ${label}`}
        className="h-8 w-8 rounded-md border border-line text-muted hover:text-fg disabled:opacity-30"
      >
        ↺
      </button>
    </div>
  );
}

function FontSelect({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-line-2 bg-cell px-3 py-2 text-sm text-fg outline-none focus:border-accent">
        {options.map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
    </label>
  );
}

function Preview() {
  const bars = [38, 52, 47, 61, 58, 72, 80];
  return (
    <aside aria-label="Live preview" className="space-y-4 rounded-lg border border-line bg-panel p-5 lg:sticky lg:top-4">
      <div>
        <h3 className="text-sm font-semibold text-fg">Live preview</h3>
        <p className="text-xs text-muted">How research screens will look</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold text-fg">
            Apple Inc. <span className="font-mono text-muted">AAPL</span>
          </div>
          <div className="text-xs text-faint">NASDAQ · Technology</div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-semibold tabular-nums text-fg">$232.14</div>
          <div className="text-xs font-medium tabular-nums text-up">+2.82 (+1.23%)</div>
        </div>
      </div>
      <div className="flex gap-1 border-b border-line text-xs">
        <span className="-mb-px border-b-2 border-accent px-2 py-1.5 text-fg">Overview</span>
        <span className="px-2 py-1.5 text-muted">Financials</span>
        <span className="px-2 py-1.5 text-muted">SEC filings</span>
      </div>
      <div className="flex h-20 items-end gap-1.5 rounded-lg border border-line bg-cell p-2" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-sm bg-accent" style={{ height: `${h}%`, opacity: 0.55 + i * 0.06 }} />
        ))}
      </div>
      <table className="w-full text-xs tabular-nums">
        <tbody>
          <tr className="border-b border-line">
            <td className="py-1.5 text-soft">Net income</td>
            <td className="py-1.5 text-right text-fg">$112.00B</td>
          </tr>
          <tr className="border-b border-line">
            <td className="py-1.5 text-soft">Capital expenditure</td>
            <td className="py-1.5 text-right text-down">-$12.00B</td>
          </tr>
          <tr>
            <td className="py-1.5 text-soft">Free cash flow</td>
            <td className="py-1.5 text-right text-up">$99.00B</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-faint">Faint text for sources and hints</p>
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        <span className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Start subscription</span>
        <span className="rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs text-accent">Annual (10-K)</span>
        <span className="rounded-full border border-line-2 px-3 py-1 text-xs text-muted">8-K</span>
      </div>
    </aside>
  );
}

export function Settings({ onClose }: { onClose: () => void }) {
  const { appearance, setAppearance, mode } = useTheme();
  const [armed, setArmed] = useState<"mode" | "all" | null>(null);
  const current = activePreset(appearance, mode);

  const reset = (which: "mode" | "all") => {
    if (armed !== which) return setArmed(which);
    setArmed(null);
    setAppearance((a) => (which === "all" ? defaultAppearance() : { ...a, colors: { ...a.colors, [mode]: {} } }));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-fg">Appearance</h1>
        <button type="button" onClick={onClose} className="rounded-lg border border-line-2 bg-cell px-4 py-2 text-sm font-medium text-fg hover:border-faint">
          Done
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Section
            title="Mode"
            caption={appearance.mode === "system" ? `Following your system setting (now ${MODE_LABEL[mode]})` : `Always ${MODE_LABEL[mode]}`}
          >
            <Segmented<ModePref>
              label="Appearance mode"
              value={appearance.mode}
              options={[
                ["system", "System"],
                ["dark", "Dark"],
                ["light", "Light"],
              ]}
              onChange={(m) => setAppearance((a) => ({ ...a, mode: m }))}
            />
          </Section>

          <Section title="Theme presets" caption={`Starting points for ${MODE_LABEL[mode]}. Fine-tune any color below.`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {PRESETS[mode].map(([name, p], i) => {
                const pal = p ?? DEFAULTS[mode];
                const on = i === current;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAppearance((a) => withPreset(a, mode, i))}
                    className={`flex flex-col gap-2 rounded-lg border bg-cell p-2 text-left ${on ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-2"}`}
                  >
                    <span className="flex items-center gap-1.5 rounded-md border p-2" style={{ background: pal.bg, borderColor: pal.line }}>
                      <span className="mr-auto rounded px-1.5 py-0.5 text-xs font-bold" style={{ background: pal.panel, color: pal.fg }}>
                        Aa
                      </span>
                      <i className="block h-3 w-3 rounded-full" style={{ background: pal.up }} />
                      <i className="block h-3 w-3 rounded-full" style={{ background: pal.down }} />
                      <i className="block h-3 w-3 rounded-full" style={{ background: pal.accent }} />
                    </span>
                    <span className="text-sm font-medium text-fg">{name}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={`Colors · ${MODE_LABEL[mode]}`} caption="Changes apply instantly. Dark and light mode keep separate colors.">
            <div className="grid gap-x-8 md:grid-cols-2">
              {COLOR_GROUPS.map(([group, rows]) => (
                <div key={group}>
                  <h4 className="mt-2 mb-1 font-mono text-[11px] tracking-wider text-faint uppercase">{group}</h4>
                  {rows.map(([k, label, hint]) => (
                    <ColorRow key={`${mode}-${k}`} k={k} label={label} hint={hint} />
                  ))}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Typography & layout" caption="Applies to both modes">
            <div className="grid gap-4 sm:grid-cols-3">
              <FontSelect id="s-sans" label="Body font" value={appearance.sans} options={FONTS.sans} onChange={(v) => setAppearance((a) => ({ ...a, sans: v }))} />
              <FontSelect id="s-display" label="Heading & price font" value={appearance.display} options={FONTS.display} onChange={(v) => setAppearance((a) => ({ ...a, display: v }))} />
              <FontSelect id="s-mono" label="Ticker font" value={appearance.mono} options={FONTS.mono} onChange={(v) => setAppearance((a) => ({ ...a, mono: v }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="s-scale" className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Interface size · {appearance.scale}%</span>
                <input id="s-scale" type="range" min={85} max={125} step={5} value={appearance.scale} onChange={(e) => setAppearance((a) => ({ ...a, scale: +e.target.value }))} />
              </label>
              <label htmlFor="s-radius" className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Corner roundness · {Math.round(appearance.radius * 100)}%</span>
                <input id="s-radius" type="range" min={0} max={2} step={0.25} value={appearance.radius} onChange={(e) => setAppearance((a) => ({ ...a, radius: +e.target.value }))} />
              </label>
            </div>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-faint">Saved automatically on this computer</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => reset("mode")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${armed === "mode" ? "border-down bg-down text-white" : "border-line-2 bg-cell text-fg"}`}
              >
                {armed === "mode" ? "Click again to confirm" : `Reset ${MODE_LABEL[mode]} colors`}
              </button>
              <button
                type="button"
                onClick={() => reset("all")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${armed === "all" ? "border-down bg-down text-white" : "border-down/40 text-down"}`}
              >
                {armed === "all" ? "Click again to confirm" : "Reset everything"}
              </button>
            </div>
          </div>
        </div>
        <Preview />
      </div>
    </div>
  );
}
