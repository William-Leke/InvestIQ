import { useMemo } from "react";
import { compact, compactMoney, ratio } from "../lib/format";
import type { Financials as FinancialsData } from "../lib/types";
import { type ChartOption, EChart } from "./EChart";

const PALETTE = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f87171"];
const AXIS = { axisLine: { lineStyle: { color: "#334155" } }, axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#1e293b" } } };

type Series = { name: string; data: (number | null)[]; type?: "bar" | "line" };

function chartOption(years: string[], series: Series[], format: (v: number) => string, axisFormat = format): ChartOption {
  return {
    color: PALETTE,
    grid: { left: 64, right: 16, top: 36, bottom: 28 },
    legend: { top: 0, textStyle: { color: "#cbd5e1" } },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: unknown) => (typeof v === "number" ? format(v) : "—"),
    },
    xAxis: { type: "category", data: years, ...AXIS },
    yAxis: { type: "value", ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: axisFormat } },
    series: series.map((s) => ({ name: s.name, type: s.type ?? "bar", data: s.data, connectNulls: true, smooth: false, barMaxWidth: 28 })),
  };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  );
}

export function Financials({ data }: { data: FinancialsData }) {
  const { years, income, balance, cashflow } = data;
  const pct = (v: number) => `${v.toFixed(1)}%`;
  const pctAxis = (v: number) => `${v.toFixed(0)}%`;
  const moneyAxis = (v: number) => compactMoney(v, 0);

  const charts = useMemo(
    () => ({
      revenue: chartOption(
        years,
        [
          { name: "Revenue", data: income.revenue },
          { name: "Net income", data: income.netIncome },
        ],
        compactMoney,
        moneyAxis,
      ),
      margins: chartOption(
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
        years,
        [
          { name: "Operating cash flow", data: cashflow.operatingCashFlow },
          { name: "Free cash flow", data: cashflow.freeCashFlow },
        ],
        compactMoney,
        moneyAxis,
      ),
      balance: chartOption(
        years,
        [
          { name: "Cash", data: balance.cash },
          { name: "Total debt", data: balance.totalDebt },
          { name: "Equity", data: balance.totalEquity },
        ],
        compactMoney,
        moneyAxis,
      ),
      eps: chartOption(years, [{ name: "Diluted EPS", data: income.eps }], (v) => `$${v.toFixed(2)}`),
    }),
    [years, income, balance, cashflow],
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
              <tr className="text-slate-500">
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
                <tr key={label} className="border-t border-slate-800">
                  <td className="py-2 pr-4 text-slate-300">{label}</td>
                  {values.map((v, i) => (
                    <td key={years[i]} className={`px-3 py-2 text-right ${v !== null && v < 0 ? "text-rose-400" : ""}`}>
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Figures in {data.currency}; {compact(1e9, 0)} = one billion.</p>
      </Card>
    </div>
  );
}
