import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import PortList from "./components/PortList";
import RenameDialog from "./components/RenameDialog";
import FilterToggle, { type PortFilter } from "./components/FilterToggle";
import ConfigPanel, { type ThemeMode } from "./components/ConfigPanel";
import { filterPortRecords } from "./portFilters";
import type { PortRecord, PortScanDebugInfo, StopResult } from "../electron/types/port";

interface UiDebugInfo extends PortScanDebugInfo {
  currentFilter: PortFilter;
  currentSearchQuery: string;
  showProtectedProcesses: boolean;
  visibleRecordsCount: number;
}

export default function App() {
  const [records, setRecords] = useState<PortRecord[]>([]);
  const [filter, setFilter] = useState<PortFilter>("common");
  const [searchQuery, setSearchQuery] = useState(
    () => localStorage.getItem("portpilot.searchQuery") ?? ""
  );
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("portpilot.theme");
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });
  const [showProtectedProcesses, setShowProtectedProcesses] = useState(() => {
    const stored = localStorage.getItem("portpilot.showProtectedProcesses");
    return stored === null ? true : stored === "true";
  });
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [configVisible, setConfigVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [lastScannedAt, setLastScannedAt] = useState<string | undefined>();
  const [renameRecord, setRenameRecord] = useState<PortRecord | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [debugInfo, setDebugInfo] = useState<UiDebugInfo | undefined>();
  const [debugLoading, setDebugLoading] = useState(false);

  const refresh = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const result = await window.portPilot.scanPorts();
      setRecords(result.records);
      setLastScannedAt(result.scannedAt);
      setError(result.error);
    } catch {
      setError("PortPilot could not scan local ports. Try Refresh again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const dispose = window.portPilot.onPortsUpdated((result) => {
      setRecords(result.records);
      setLastScannedAt(result.scannedAt);
      setError(result.error);
    });
    return dispose;
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem("portpilot.searchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("portpilot.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("portpilot.showProtectedProcesses", String(showProtectedProcesses));
  }, [showProtectedProcesses]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = useMemo(() => {
    if (theme !== "system") {
      return theme;
    }
    return systemTheme;
  }, [systemTheme, theme]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh(false);
      }
    }, 6000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const filteredRecords = useMemo(() => {
    return filterPortRecords(records, { filter, searchQuery, showProtectedProcesses });
  }, [filter, records, searchQuery, showProtectedProcesses]);

  const handleDebugScan = async () => {
    setDebugLoading(true);
    try {
      const result = await window.portPilot.debugScan();
      const visibleRecords = filterPortRecords(result.finalMergedRecords, {
        filter,
        searchQuery,
        showProtectedProcesses
      });
      setDebugInfo({
        ...result,
        currentFilter: filter,
        currentSearchQuery: searchQuery,
        showProtectedProcesses,
        visibleRecordsCount: visibleRecords.length
      });
      console.info("PortPilot Debug Scan", result);
    } finally {
      setDebugLoading(false);
    }
  };

  const updateStopState = (result: StopResult) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === result.id ? { ...record, stopState: result.state } : record
      )
    );
    setStatusMessage(result.message ?? (result.state === "stopped" ? "Stopped." : undefined));
    if (result.state === "stopped") {
      window.setTimeout(() => void refresh(false), 900);
    }
  };

  const handleStop = async (record: PortRecord, force = false) => {
    setRecords((current) =>
      current.map((item) => (item.id === record.id ? { ...item, stopState: "terminating" } : item))
    );
    const result = await window.portPilot.stopPort(record.id, force);
    updateStopState(result);
  };

  const handleAliasSave = async (record: PortRecord, alias: string) => {
    const nextRecords = await window.portPilot.setAlias(record.id, alias);
    setRecords(nextRecords);
    setRenameRecord(undefined);
  };

  const performAction = async (
    action: Promise<{ ok: boolean; message?: string }>,
    successMessage: string
  ) => {
    const result = await action;
    setStatusMessage(result.ok ? successMessage : result.message);
  };

  return (
    <main className="app-shell" data-theme={resolvedTheme}>
      <Header
        loading={loading}
        lastScannedAt={lastScannedAt}
        searchQuery={searchQuery}
        onRefresh={() => void refresh()}
        onSearchChange={setSearchQuery}
        onToggleConfig={() => setConfigVisible((visible) => !visible)}
        onQuit={() => void window.portPilot.quit()}
      />

      <div className="toolbar-row">
        <FilterToggle value={filter} onChange={setFilter} />
        {statusMessage ? <span className="status-message">{statusMessage}</span> : null}
      </div>

      {configVisible ? (
        <ConfigPanel
          theme={theme}
          showProtectedProcesses={showProtectedProcesses}
          debugInfo={debugInfo}
          debugLoading={debugLoading}
          onThemeChange={setTheme}
          onShowProtectedProcessesChange={setShowProtectedProcesses}
          onDebugScan={() => void handleDebugScan()}
        />
      ) : null}

      <PortList
        records={filteredRecords}
        totalRecords={records.length}
        error={error}
        loading={loading && records.length === 0}
        onOpen={(record) =>
          void performAction(window.portPilot.openUrl(record.id), "Opened localhost URL.")
        }
        onCopy={(record) => void performAction(window.portPilot.copyUrl(record.id), "Copied URL.")}
        onReveal={(record) =>
          void performAction(window.portPilot.revealFolder(record.id), "Revealed folder.")
        }
        onRename={setRenameRecord}
        onStop={(record) => void handleStop(record, false)}
        onForceStop={(record) => void handleStop(record, true)}
      />

      {renameRecord ? (
        <RenameDialog
          record={renameRecord}
          onCancel={() => setRenameRecord(undefined)}
          onSave={(alias) => void handleAliasSave(renameRecord, alias)}
        />
      ) : null}
    </main>
  );
}
