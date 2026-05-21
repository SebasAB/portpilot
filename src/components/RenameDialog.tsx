import { FormEvent, useEffect, useRef, useState } from "react";
import type { PortRecord } from "../../electron/types/port";

interface RenameDialogProps {
  record: PortRecord;
  onCancel: () => void;
  onSave: (alias: string) => void;
}

export default function RenameDialog({ record, onCancel, onSave }: RenameDialogProps) {
  const [alias, setAlias] = useState(record.alias ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave(alias);
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <form
        className="rename-dialog"
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Rename Port</h2>
        <p>
          {record.projectPath ??
            record.containerName ??
            record.command ??
            `localhost:${record.port}`}
        </p>
        <label>
          Alias
          <input
            ref={inputRef}
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            placeholder="City Rain PWA"
          />
        </label>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
