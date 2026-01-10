import { createContext } from "react";
import type { RelayConfig } from "@/config/relays";

export type Theme = "dark" | "light" | "system";

export interface AppConfig {
  /** Current theme */
  theme: Theme;
  /** Selected relay URLs (multi-relay support) */
  relayUrls: string[];
  /** Active relay for publishing */
  activeRelay: string;
  /** Maximum number of relays to query from */
  maxRelays: number;
  /** Enable event deduplication */
  enableDeduplication: boolean;
  /** Query timeout in milliseconds */
  queryTimeout: number;
}

export interface AppContextType {
  /** Current application configuration */
  config: AppConfig;
  /** Update configuration using a callback that receives current config and returns new config */
  updateConfig: (updater: (currentConfig: AppConfig) => AppConfig) => void;
  /** Available relays for selection */
  availableRelays: RelayConfig[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
