import type { PortScanDebugInfo } from "../../electron/types/port";

export type ThemeMode = "system" | "light" | "dark";

interface UiDebugInfo extends PortScanDebugInfo {
  currentFilter: string;
  currentSearchQuery: string;
  showProtectedProcesses: boolean;
  visibleRecordsCount: number;
}

interface ConfigPanelProps {
  theme: ThemeMode;
  showProtectedProcesses: boolean;
  debugInfo?: UiDebugInfo;
  debugLoading: boolean;
  onThemeChange: (theme: ThemeMode) => void;
  onShowProtectedProcessesChange: (show: boolean) => void;
  onDebugScan: () => void;
}

export default function ConfigPanel({
  theme,
  showProtectedProcesses,
  debugInfo,
  debugLoading,
  onThemeChange,
  onShowProtectedProcessesChange,
  onDebugScan
}: ConfigPanelProps) {
  return (
    <section className="config-panel" aria-label="Settings">
      <div className="config-row">
        <span>Theme</span>
        <div className="theme-options" role="radiogroup" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={theme === option ? "active" : ""}
              onClick={() => onThemeChange(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <label className="toggle-row">
        <span>Show protected processes</span>
        <input
          type="checkbox"
          checked={showProtectedProcesses}
          onChange={(event) => onShowProtectedProcessesChange(event.target.checked)}
        />
      </label>

      <button className="debug-button" type="button" onClick={onDebugScan} disabled={debugLoading}>
        {debugLoading ? "Scanning..." : "Debug Scan"}
      </button>

      {debugInfo?.docker.error ? (
        <div className="debug-warning">
          {debugInfo.docker.error ??
            "Docker CLI unavailable from PortPilot. This may happen in packaged macOS apps because PATH differs from your terminal."}
        </div>
      ) : null}

      {debugInfo ? (
        <details className="debug-details" open>
          <summary>Scan diagnostics</summary>
          <pre>
            {JSON.stringify(
              {
                rawLsofResultsCount: debugInfo.rawLsofResultsCount,
                rawLsofOutput: debugInfo.rawLsofOutput,
                normalizedProcessRecords: debugInfo.normalizedProcessRecords,
                docker: debugInfo.docker,
                finalMergedRecords: debugInfo.finalMergedRecords,
                currentFilter: debugInfo.currentFilter,
                currentSearchQuery: debugInfo.currentSearchQuery,
                showProtectedProcesses: debugInfo.showProtectedProcesses,
                visibleRecordsCount: debugInfo.visibleRecordsCount
              },
              null,
              2
            )}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
