// The desktop app shares response types with the data service.
export type { Filing, Financials, Profile, Quote, SearchResult } from "../../../server/src/types";

export interface Me {
  userId: string;
  devMode: boolean;
  subscribed: boolean;
  subscription: { status: string; currentPeriodEnd: number | null } | null;
}
