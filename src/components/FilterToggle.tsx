export type PortFilter = "common" | "all";

interface FilterToggleProps {
  value: PortFilter;
  onChange: (value: PortFilter) => void;
}

export default function FilterToggle({ value, onChange }: FilterToggleProps) {
  return (
    <div className="segmented-control" role="tablist" aria-label="Port filter">
      <button
        className={value === "common" ? "active" : ""}
        type="button"
        role="tab"
        aria-selected={value === "common"}
        onClick={() => onChange("common")}
      >
        Common dev ports
      </button>
      <button
        className={value === "all" ? "active" : ""}
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
      >
        All ports
      </button>
    </div>
  );
}
