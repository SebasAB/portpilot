import type { PortRecord } from "../electron/types/port";
import type { PortFilter } from "./components/FilterToggle";

export const isCommonPort = (port: number) =>
  (port >= 3000 && port <= 3010) ||
  port === 4200 ||
  (port >= 5000 && port <= 5010) ||
  (port >= 5173 && port <= 5179) ||
  port === 5432 ||
  port === 6379 ||
  (port >= 8000 && port <= 8010) ||
  (port >= 8080 && port <= 8090) ||
  port === 27017;

export function recordMatchesSearch(record: PortRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchable = [
    record.port,
    record.pid,
    record.displayName,
    record.alias,
    record.url,
    record.processName,
    record.command,
    record.cwd,
    record.projectPath,
    record.detectedProjectName,
    record.detectedFramework,
    record.detectedPackageManager,
    record.source,
    record.containerName,
    record.containerId,
    record.dockerImage
  ]
    .filter((value) => value !== undefined && value !== null)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export function filterPortRecords(
  records: PortRecord[],
  options: {
    filter: PortFilter;
    searchQuery: string;
    showProtectedProcesses: boolean;
  }
) {
  const visibleRecords = records.filter(
    (record) => options.showProtectedProcesses || !record.isDangerousToStop
  );
  const portFiltered =
    options.filter === "all"
      ? visibleRecords
      : visibleRecords.filter((record) => isCommonPort(record.port));
  return portFiltered.filter((record) => recordMatchesSearch(record, options.searchQuery));
}
