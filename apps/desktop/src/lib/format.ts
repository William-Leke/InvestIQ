const UNITS: [number, string][] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/** 3_450_000_000_000 -> "3.45T"; keeps the sign; null -> "—". */
export function compact(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  for (const [size, unit] of UNITS) {
    if (abs >= size) return `${(value / size).toFixed(digits)}${unit}`;
  }
  return value.toFixed(digits);
}

export function money(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function compactMoney(value: number | null | undefined, digits = 2): string {
  const c = compact(value, digits);
  if (c === "—") return c;
  return c.startsWith("-") ? `-$${c.slice(1)}` : `$${c}`;
}

export function percent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

/** Element-wise a / b as a percentage, null when either side is missing or b is 0. */
export function ratio(a: (number | null)[], b: (number | null)[]): (number | null)[] {
  return a.map((x, i) => {
    const y = b[i];
    return x === null || y === null || y === undefined || y === 0 ? null : (x / y) * 100;
  });
}
