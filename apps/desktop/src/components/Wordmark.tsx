import { useTheme } from "../theme/ThemeProvider";
import { mix } from "../theme/tokens";

export const APP_NAME = "Trendsight";

/** Logo gradient, left to right. Light mode uses deeper stops so the letters stay readable on white. */
const GRADIENT = {
  dark: ["#8ed1d3", "#8ab6ea", "#a698e0", "#c4769a"],
  light: ["#2a9497", "#3f70c4", "#7154c0", "#ad3570"],
};

function gradientAt(stops: string[], t: number) {
  const x = t * (stops.length - 1);
  const i = Math.min(Math.floor(x), stops.length - 2);
  return mix(stops[i + 1]!, stops[i]!, x - i);
}

/** The logo as text: gradient capitals with the E mirrored, as in the brand artwork. */
export function Wordmark({ className = "" }: { className?: string }) {
  const { mode } = useTheme();
  const letters = [...APP_NAME.toUpperCase()];
  const mirrored = letters.indexOf("E");
  return (
    <div className={`wordmark select-none whitespace-nowrap ${className}`} role="img" aria-label={APP_NAME}>
      {letters.map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className={i === mirrored ? "mirror" : undefined}
          style={{ color: gradientAt(GRADIENT[mode], letters.length > 1 ? i / (letters.length - 1) : 0) }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
