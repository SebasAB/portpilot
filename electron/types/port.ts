export type PortSource = "process" | "docker" | "unknown";
export type PortProtocol = "tcp";
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";
export type StopState = "idle" | "terminating" | "needs-force" | "stopped" | "failed";

export interface PortRecord {
  id: string;
  port: number;
  protocol: PortProtocol;
  pid?: number;
  processName?: string;
  command?: string;
  cwd?: string;
  projectPath?: string;
  detectedProjectName?: string;
  displayName: string;
  alias?: string;
  detectedFramework?: string;
  detectedPackageManager?: PackageManager;
  url?: string;
  source: PortSource;
  canOpen: boolean;
  canCopyUrl: boolean;
  canReveal: boolean;
  canStop: boolean;
  isDangerousToStop: boolean;
  stopState?: StopState;
  containerId?: string;
  containerName?: string;
  dockerImage?: string;
  dockerStatus?: string;
  protectionReason?: string;
}

export interface ScanResult {
  records: PortRecord[];
  scannedAt: string;
  error?: string;
}

export interface DockerDebugInfo {
  commandAvailable: boolean;
  executable?: string;
  rawOutput: string;
  error?: string;
  parsedRecords: PortRecord[];
  candidateErrors: Array<{
    executable: string;
    message: string;
  }>;
}

export interface PortScanDebugInfo {
  scannedAt: string;
  rawLsofResultsCount: number;
  rawLsofOutput: string;
  normalizedProcessRecords: PortRecord[];
  docker: DockerDebugInfo;
  finalMergedRecords: PortRecord[];
}

export interface StopResult {
  id: string;
  state: StopState;
  message?: string;
}

export interface AliasEntry {
  key: string;
  alias: string;
  updatedAt: string;
}
