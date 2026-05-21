import PortCard from "./PortCard";
import type { PortRecord } from "../../electron/types/port";

interface PortListProps {
  records: PortRecord[];
  totalRecords: number;
  loading: boolean;
  error?: string;
  onOpen: (record: PortRecord) => void;
  onCopy: (record: PortRecord) => void;
  onReveal: (record: PortRecord) => void;
  onRename: (record: PortRecord) => void;
  onStop: (record: PortRecord) => void;
  onForceStop: (record: PortRecord) => void;
}

export default function PortList({
  records,
  totalRecords,
  loading,
  error,
  onOpen,
  onCopy,
  onReveal,
  onRename,
  onStop,
  onForceStop
}: PortListProps) {
  if (error) {
    return <section className="state-panel error-state">{error}</section>;
  }

  if (loading) {
    return <section className="state-panel">Scanning local ports...</section>;
  }

  if (records.length === 0) {
    return (
      <section className="state-panel">
        {totalRecords > 0
          ? "No matching ports found for this filter."
          : "No active local development ports detected."}
      </section>
    );
  }

  return (
    <section className="port-list" aria-label="Active local ports">
      {records.map((record) => (
        <PortCard
          key={record.id}
          record={record}
          onOpen={onOpen}
          onCopy={onCopy}
          onReveal={onReveal}
          onRename={onRename}
          onStop={onStop}
          onForceStop={onForceStop}
        />
      ))}
    </section>
  );
}
