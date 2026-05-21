/// <reference types="vite/client" />

import type { PortRecord, PortScanDebugInfo, ScanResult, StopResult } from "../electron/types/port";

declare global {
  interface Window {
    portPilot: {
      scanPorts: () => Promise<ScanResult>;
      debugScan: () => Promise<PortScanDebugInfo>;
      openUrl: (recordId: string) => Promise<{ ok: boolean; message?: string }>;
      copyUrl: (recordId: string) => Promise<{ ok: boolean; message?: string }>;
      revealFolder: (recordId: string) => Promise<{ ok: boolean; message?: string }>;
      setAlias: (recordId: string, alias: string) => Promise<PortRecord[]>;
      stopPort: (recordId: string, force?: boolean) => Promise<StopResult>;
      quit: () => Promise<void>;
      onPortsUpdated: (callback: (result: ScanResult) => void) => () => void;
    };
  }
}
