export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayLow: number | null;
  dayHigh: number | null;
  yearLow: number | null;
  yearHigh: number | null;
  marketCap: number | null;
  volume: number | null;
  pe: number | null;
  exchange: string;
  timestamp: number;
}

export interface Profile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  ceo: string;
  employees: number | null;
  country: string;
  image: string;
}

/** Annual series, oldest year first, aligned with `years`. Missing values are null. */
export interface Financials {
  symbol: string;
  currency: string;
  years: string[];
  income: {
    revenue: (number | null)[];
    grossProfit: (number | null)[];
    operatingIncome: (number | null)[];
    netIncome: (number | null)[];
    eps: (number | null)[];
  };
  balance: {
    totalAssets: (number | null)[];
    totalLiabilities: (number | null)[];
    totalEquity: (number | null)[];
    cash: (number | null)[];
    totalDebt: (number | null)[];
  };
  cashflow: {
    operatingCashFlow: (number | null)[];
    capitalExpenditure: (number | null)[];
    freeCashFlow: (number | null)[];
  };
}

export interface Filing {
  form: string;
  filingDate: string;
  reportDate: string;
  description: string;
  accessionNumber: string;
  url: string;
}
