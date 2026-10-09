// Response shapes copied from FMP "stable" and SEC EDGAR APIs, trimmed to the fields InvestIQ reads.
export const fmpQuote = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 232.14,
    changePercentage: 1.23,
    change: 2.82,
    volume: 51234567,
    dayLow: 228.9,
    dayHigh: 233.1,
    yearHigh: 260.1,
    yearLow: 164.08,
    marketCap: 3450000000000,
    exchange: "NASDAQ",
    timestamp: 1791590400,
  },
];

export const fmpIncome = [
  { date: "2025-09-27", fiscalYear: "2025", reportedCurrency: "USD", revenue: 416e9, grossProfit: 195e9, operatingIncome: 133e9, netIncome: 112e9, epsDiluted: 7.46 },
  { date: "2024-09-28", fiscalYear: "2024", reportedCurrency: "USD", revenue: 391e9, grossProfit: 180e9, operatingIncome: 123e9, netIncome: 94e9, epsDiluted: 6.08 },
  { date: "2023-09-30", fiscalYear: "2023", reportedCurrency: "USD", revenue: 383e9, grossProfit: 169e9, operatingIncome: 114e9, netIncome: 97e9, epsDiluted: 6.13 },
];

export const fmpBalance = [
  { fiscalYear: "2025", totalAssets: 359e9, totalLiabilities: 285e9, totalStockholdersEquity: 74e9, cashAndCashEquivalents: 36e9, totalDebt: 99e9 },
  { fiscalYear: "2024", totalAssets: 365e9, totalLiabilities: 308e9, totalStockholdersEquity: 57e9, cashAndCashEquivalents: 30e9, totalDebt: 106e9 },
  { fiscalYear: "2023", totalAssets: 353e9, totalLiabilities: 290e9, totalStockholdersEquity: 62e9, cashAndCashEquivalents: 30e9, totalDebt: 111e9 },
];

export const fmpCashflow = [
  { fiscalYear: "2025", operatingCashFlow: 111e9, capitalExpenditure: -12e9, freeCashFlow: 99e9 },
  { fiscalYear: "2024", operatingCashFlow: 118e9, capitalExpenditure: -9e9, freeCashFlow: 109e9 },
  // FCF missing: the server derives it from operating cash flow plus (negative) capex.
  { fiscalYear: "2023", operatingCashFlow: 110e9, capitalExpenditure: -11e9 },
];

export const secTickers = {
  "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
  "1": { cik_str: 789019, ticker: "MSFT", title: "MICROSOFT CORP" },
};

export const secSubmissions = {
  cik: "0000320193",
  name: "Apple Inc.",
  filings: {
    recent: {
      accessionNumber: ["0000320193-25-000123", "0000320193-25-000110", "0000320193-25-000079"],
      filingDate: ["2025-10-31", "2025-10-30", "2025-08-01"],
      reportDate: ["2025-09-27", "2025-10-30", "2025-06-28"],
      form: ["10-K", "8-K", "10-Q"],
      primaryDocument: ["aapl-20250927.htm", "aapl-20251030.htm", "aapl-20250628.htm"],
      primaryDocDescription: ["10-K", "", "10-Q"],
    },
  },
};
