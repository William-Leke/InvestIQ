import { useMemo } from "react";
import { compact, compactMoney, ratio } from "../lib/format";
import type { Financials as FinancialsData } from "../lib/types";
import { useTheme } from "../theme/ThemeProvider";
import type { Palette } from "../theme/tokens";
import { type ChartOption, EChart } from "./EChart";

type Series = { name: string; data: (number | null)[]; type?: "bar" | "line" };

/** Series colors follow the theme: accent leads, then a fixed violet and amber, then gains. */
function seriesColors(p: Palette) {
  return [p.accent, "#a78bfa", p.up, "#f59e0b", p.down];
}

function chartOption(
  p: Palette,
  years: string[],
  series: Series[],
  format: (v: number) => string,
  axisFormat = format,
): ChartOption {
  const axis = {
    axisLine: { lineStyle: { color: p.line } },
    axisLabel: { color: p.muted },
    splitLine: { lineStyle: { color: p.line } },
  };
  return {
    color: seriesColors(p),
    grid: { left: 64, right: 16, top: 36, bottom: 28 },
    legend: { top: 0, textStyle: { color: p.muted } },
    tooltip: {
      trigger: "axis",
      backgroundColor: p.cell,
      borderColor: p.line,
      textStyle: { color: p.fg },
      valueFormatter: (v: unknown) => (typeof v === "number" ? format(v) : "—"),
    },
    xAxis: { type: "category", data: years, ...axis },
    yAxis: { type: "value", ...axis, axisLabel: { ...axis.axisLabel, formatter: axisFormat } },
    series: series.map((s) => ({ name: s.name, type: s.type ?? "bar", data: s.data, connectNulls: true, smooth: false, barMaxWidth: 28 })),
  };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <h3 className="mb-2 text-sm font-semibold text-soft">{title}</h3>
      {children}
    </div>
  );
}

export function Financials({ data }: { data: FinancialsData }) {
  const { years, income, balance, cashflow } = data;
  const { palette } = useTheme();
  const pct = (v: number) => `${v.toFixed(1)}%`;
  const pctAxis = (v: number) => `${v.toFixed(0)}%`;
  const moneyAxis = (v: number) => compactMoney(v, 0);

  const charts = useMemo(
    () => ({
      revenue: chartOption(
        palette,
        years,
        [
          { name: "Revenue", data: income.revenue },
          { name: "Net income", data: income.netIncome },
        ],
        compactMoney,
        moneyAxis,
      ),
      margins: chartOption(
        palette,
        years,
        [
          { name: "Gross margin", data: ratio(income.grossProfit, income.revenue), type: "line" },
          { name: "Operating margin", data: ratio(income.operatingIncome, income.revenue), type: "line" },
          { name: "Net margin", data: ratio(income.netIncome, income.revenue), type: "line" },
        ],
        pct,
        pctAxis,
      ),
      cash: chartOption(
        palette,
        years,
        [
          { name: "Operating cash flow", data: cashflow.operatingCashFlow },
          { name: "Free cash flow", data: cashflow.freeCashFlow },
        ],
        compactMoney,
        moneyAxis,
      ),
      balance: chartOption(
        palette,
        years,
        [
          { name: "Cash", data: balance.cash },
          { name: "Total debt", data: balance.totalDebt },
          { name: "Equity", data: balance.totalEquity },
        ],
        compactMoney,
        moneyAxis,
      ),
      eps: chartOption(palette, years, [{ name: "Diluted EPS", data: income.eps }], (v) => `$${v.toFixed(2)}`),
    }),
    [palette, years, income, balance, cashflow],
  );

  const rows: [string, (number | null)[], (v: number | null) => string][] = [
    ["Revenue", income.revenue, compactMoney],
    ["Gross profit", income.grossProfit, compactMoney],
    ["Operating income", income.operatingIncome, compactMoney],
    ["Net income", income.netIncome, compactMoney],
    ["Diluted EPS", income.eps, (v) => (v === null ? "—" : `$${v.toFixed(2)}`)],
    ["Total assets", balance.totalAssets, compactMoney],
    ["Total liabilities", balance.totalLiabilities, compactMoney],
    ["Shareholders' equity", balance.totalEquity, compactMoney],
    ["Cash and equivalents", balance.cash, compactMoney],
    ["Total debt", balance.totalDebt, compactMoney],
    ["Operating cash flow", cashflow.operatingCashFlow, compactMoney],
    ["Capital expenditure", cashflow.capitalExpenditure, compactMoney],
    ["Free cash flow", cashflow.freeCashFlow, compactMoney],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue and net income">
          <EChart option={charts.revenue} />
        </Card>
        <Card title="Margins">
          <EChart option={charts.margins} />
        </Card>
        <Card title="Cash flow">
          <EChart option={charts.cash} />
        </Card>
        <Card title="Balance sheet">
          <EChart option={charts.balance} />
        </Card>
        <Card title="Earnings per share">
          <EChart option={charts.eps} />
        </Card>
      </div>
      <Card title={`Annual statements (${data.currency}, fiscal years)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-faint">
                <th className="py-2 pr-4 text-left font-medium">Metric</th>
                {years.map((y) => (
                  <th key={y} className="px-3 py-2 text-right font-medium">
                    FY{y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, values, fmt]) => (
                <tr key={label} className="border-t border-line">
                  <td className="py-2 pr-4 text-soft">{label}</td>
                  {values.map((v, i) => (
                    <td key={years[i]} className={`px-3 py-2 text-right ${v !== null && v < 0 ? "text-down" : ""}`}>
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-faint">Figures in {data.currency}; {compact(1e9, 0)} = one billion.</p>
      </Card>
    </div>
  );
}
