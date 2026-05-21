import Icon from "./Icon";
import type { PortRecord } from "../../electron/types/port";

interface PortCardProps {
  record: PortRecord;
  onOpen: (record: PortRecord) => void;
  onCopy: (record: PortRecord) => void;
  onReveal: (record: PortRecord) => void;
  onRename: (record: PortRecord) => void;
  onStop: (record: PortRecord) => void;
  onForceStop: (record: PortRecord) => void;
}

function detailValue(value?: string | number) {
  return value === undefined || value === "" ? "Unknown" : value;
}

function shortContainerId(containerId?: string) {
  return containerId ? containerId.slice(0, 12) : undefined;
}

export default function PortCard({
  record,
  onOpen,
  onCopy,
  onReveal,
  onRename,
  onStop,
  onForceStop
}: PortCardProps) {
  const stopping = record.stopState === "terminating";
  const stopped = record.stopState === "stopped";
  const needsForce = record.stopState === "needs-force" && record.source === "process";
  const stopDisabled = stopping || stopped || record.isDangerousToStop || !record.canStop;

  return (
    <article className={`port-card ${record.isDangerousToStop ? "danger-card" : ""}`}>
      <div className="port-card-header">
        <div className="port-title-block">
          <h2>
            {record.displayName ||
              record.detectedProjectName ||
              record.processName ||
              `Port ${record.port}`}
          </h2>
          <div className="url-line">{record.url ?? `localhost:${record.port}`}</div>
        </div>
        <div className="port-badge">{record.port}</div>
      </div>

      <div className="meta-row">
        {record.detectedFramework ? (
          <span className="meta-pill">{record.detectedFramework}</span>
        ) : null}
        <span className="meta-pill">{record.detectedPackageManager ?? "unknown"}</span>
        {record.source === "docker" ? (
          <span className="meta-pill docker-pill">
            <Icon name="server" size={12} />
            Docker
          </span>
        ) : null}
        {record.dockerImage ? <span className="meta-pill">{record.dockerImage}</span> : null}
        {record.containerId ? (
          <span className="meta-pill">CID {shortContainerId(record.containerId)}</span>
        ) : null}
        {record.pid ? <span className="meta-pill">PID {record.pid}</span> : null}
      </div>

      <dl className="details-grid">
        <div>
          <dt>Command</dt>
          <dd title={record.command}>{detailValue(record.command ?? record.processName)}</dd>
        </div>
        <div>
          <dt>Project</dt>
          <dd title={record.projectPath ?? record.cwd}>
            {detailValue(record.projectPath ?? record.cwd)}
          </dd>
        </div>
        {record.source === "docker" ? (
          <div>
            <dt>Container</dt>
            <dd title={`${record.containerName ?? ""} ${record.dockerImage ?? ""}`.trim()}>
              {detailValue(record.containerName)} · {detailValue(record.dockerImage)} ·{" "}
              {detailValue(shortContainerId(record.containerId))}
            </dd>
          </div>
        ) : null}
        {record.dockerStatus ? (
          <div>
            <dt>Status</dt>
            <dd title={record.dockerStatus}>{record.dockerStatus}</dd>
          </div>
        ) : null}
      </dl>

      {record.isDangerousToStop ? (
        <div className="warning-row">
          <Icon name="shield" size={14} />
          {record.protectionReason ?? "Protected process. Stop is disabled."}
        </div>
      ) : null}

      {needsForce ? (
        <div className="warning-row force-row">
          <Icon name="alert" size={14} />
          SIGTERM did not stop this process.
        </div>
      ) : null}

      <div className="action-row">
        <button
          type="button"
          onClick={() => onOpen(record)}
          disabled={!record.canOpen}
          title="Open"
        >
          <Icon name="external" size={14} />
          Open
        </button>
        <button
          type="button"
          onClick={() => onCopy(record)}
          disabled={!record.canCopyUrl}
          title="Copy URL"
        >
          <Icon name="copy" size={14} />
          Copy
        </button>
        <button
          type="button"
          onClick={() => onReveal(record)}
          disabled={!record.canReveal}
          title="Reveal Folder"
        >
          <Icon name="folder" size={14} />
          Reveal
        </button>
        <button type="button" onClick={() => onRename(record)} title="Rename">
          <Icon name="pencil" size={14} />
          Alias
        </button>
      </div>

      <div className="stop-row">
        <button
          className="stop-button"
          type="button"
          onClick={() => onStop(record)}
          disabled={stopDisabled}
          title="Stop"
        >
          <Icon name="square" size={13} />
          {stopping ? "Stopping" : stopped ? "Stopped" : "Stop"}
        </button>
        {needsForce ? (
          <button
            className="force-button"
            type="button"
            onClick={() => onForceStop(record)}
            title="Force Stop"
          >
            <Icon name="x" size={14} />
            Force Stop
          </button>
        ) : null}
      </div>
    </article>
  );
}
