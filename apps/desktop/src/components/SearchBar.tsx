import { useEffect, useRef, useState } from "react";
import { useApi } from "../lib/api";
import type { SearchResult } from "../lib/types";

export function SearchBar({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce keystrokes so typing a name costs one search, not one per letter.
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 250);
    return () => clearTimeout(t);
  }, [text]);

  const { data: results = [], loading } = useApi<SearchResult[]>(query ? `/api/search?q=${encodeURIComponent(query)}` : null);

  useEffect(() => setActive(0), [results]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (symbol: string) => {
    onSelect(symbol.toUpperCase());
    setText("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1));
          else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
          else if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter") {
            const pick = results[active]?.symbol ?? text.trim();
            if (pick) choose(pick);
          }
        }}
        placeholder="Search a company or ticker, e.g. Apple or AAPL"
        className="w-full rounded-lg border border-line-2 bg-cell px-4 py-2 text-sm outline-none placeholder:text-faint focus:border-accent"
        aria-label="Search companies"
      />
      {open && text.trim() && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-line-2 bg-cell py-1 text-sm shadow-xl">
          {loading && results.length === 0 && <li className="px-4 py-2 text-faint">Searching…</li>}
          {!loading && results.length === 0 && query && <li className="px-4 py-2 text-faint">No matches. Press Enter to open "{text.trim().toUpperCase()}".</li>}
          {results.map((r, i) => (
            <li key={`${r.symbol}-${r.exchange}`}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r.symbol)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${i === active ? "bg-cell" : ""}`}
              >
                <span className="w-20 font-mono font-semibold text-accent">{r.symbol}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-xs text-faint">{r.exchange}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
