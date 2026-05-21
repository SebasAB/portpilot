import Icon from "./Icon";

interface HeaderProps {
  loading: boolean;
  lastScannedAt?: string;
  searchQuery: string;
  onRefresh: () => void;
  onSearchChange: (query: string) => void;
  onToggleConfig: () => void;
  onQuit: () => void;
}

function formatScanTime(value?: string) {
  if (!value) {
    return "Not scanned";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export default function Header({
  loading,
  lastScannedAt,
  searchQuery,
  onRefresh,
  onSearchChange,
  onToggleConfig,
  onQuit
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-top-row">
        <div className="title-group">
          <div className="app-title">PortPilot</div>
          <div className="scan-time">Last scanned {formatScanTime(lastScannedAt)}</div>
        </div>

        <div className="header-actions">
          <button className="icon-button" type="button" onClick={onRefresh} title="Refresh">
            <Icon name="refresh" size={15} className={loading ? "spin" : undefined} />
          </button>
          <button className="icon-button" type="button" onClick={onToggleConfig} title="Settings">
            <Icon name="settings" size={15} />
          </button>
          <button className="icon-button danger-quiet" type="button" onClick={onQuit} title="Quit">
            <Icon name="power" size={15} />
          </button>
        </div>
      </div>

      <label className="search-input-wrap" title="Search ports">
        <Icon name="search" size={14} />
        <input
          className="search-input"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search ports, projects, commands"
          aria-label="Search ports"
          spellCheck={false}
        />
      </label>
    </header>
  );
}
