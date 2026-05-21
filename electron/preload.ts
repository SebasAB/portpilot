import { contextBridge, ipcRenderer } from "electron";
import type { PortRecord, PortScanDebugInfo, ScanResult, StopResult } from "./types/port";

contextBridge.exposeInMainWorld("portPilot", {
  scanPorts: (): Promise<ScanResult> => ipcRenderer.invoke("portpilot:scan"),
  debugScan: (): Promise<PortScanDebugInfo> => ipcRenderer.invoke("portpilot:debug-scan"),
  openUrl: (recordId: string): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke("portpilot:open-url", recordId),
  copyUrl: (recordId: string): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke("portpilot:copy-url", recordId),
  revealFolder: (recordId: string): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke("portpilot:reveal-folder", recordId),
  setAlias: (recordId: string, alias: string): Promise<PortRecord[]> =>
    ipcRenderer.invoke("portpilot:set-alias", recordId, alias),
  stopPort: (recordId: string, force?: boolean): Promise<StopResult> =>
    ipcRenderer.invoke("portpilot:stop", recordId, force),
  quit: (): Promise<void> => ipcRenderer.invoke("portpilot:quit"),
  onPortsUpdated: (callback: (result: ScanResult) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: ScanResult) => callback(result);
    ipcRenderer.on("portpilot:ports-updated", listener);
    return () => ipcRenderer.removeListener("portpilot:ports-updated", listener);
  }
});
