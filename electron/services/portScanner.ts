import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PortRecord, PortScanDebugInfo } from "../types/port";
import { isHttpLikePort, localhostAddressForPort, scanDockerPortsDetailed } from "./dockerScanner";
import { detectProjectFromCwd } from "./projectDetector";
import {
  getProcessCwd,
  getProcessInfo,
  getProtectedProcessReason,
  isDangerousProcess,
  isValidPid
} from "./processInspector";

const execFileAsync = promisify(execFile);

export interface LsofEntry {
  commandName: string;
  pid: number;
  port: number;
  name: string;
}

export const commonDevPorts = [
  [3000, 3010],
  [4200, 4200],
  [5000, 5010],
  [5173, 5179],
  [5432, 5432],
  [6379, 6379],
  [8000, 8010],
  [8080, 8090],
  [27017, 27017]
] as const;

export function isCommonDevPort(port: number): boolean {
  return commonDevPorts.some(([min, max]) => port >= min && port <= max);
}

function extractPortFromLsofName(name: string): number | undefined {
  const endpoint = name.replace(/\s+\(LISTEN\).*$/i, "").trim();
  const match = endpoint.match(/:(\d+)$/) ?? endpoint.match(/\.(\d+)$/);
  if (!match) {
    return undefined;
  }

  const port = Number(match[1]);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : undefined;
}

export function parseLsofOutput(output: string): LsofEntry[] {
  const entries = new Map<string, LsofEntry>();

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("COMMAND")) {
      continue;
    }

    const parts = line.split(/\s+/);
    const commandName = parts[0];
    const pid = Number(parts[1]);
    const tcpIndex = parts.findIndex((part) => part === "TCP");

    if (!commandName || !isValidPid(pid) || tcpIndex === -1) {
      continue;
    }

    const name = parts.slice(tcpIndex + 1).join(" ");
    const port = extractPortFromLsofName(name);
    if (!port) {
      continue;
    }

    entries.set(`${pid}:${port}`, {
      commandName,
      pid,
      port,
      name
    });
  }

  return [...entries.values()].sort((a, b) => a.port - b.port || a.pid - b.pid);
}

async function enrichProcessEntry(entry: LsofEntry): Promise<PortRecord> {
  const processInfo = await getProcessInfo(entry.pid);
  const cwd = await getProcessCwd(entry.pid);
  const project = detectProjectFromCwd(cwd);
  const processName = processInfo?.processName ?? entry.commandName;
  const command = processInfo?.command;
  const baseRecord: PortRecord = {
    id: `process:${entry.pid}:${entry.port}`,
    port: entry.port,
    protocol: "tcp",
    pid: entry.pid,
    processName,
    command,
    cwd,
    projectPath: project.projectPath,
    detectedProjectName: project.detectedProjectName,
    displayName: project.detectedProjectName ?? processName ?? `Port ${entry.port}`,
    detectedFramework: project.detectedFramework,
    detectedPackageManager: project.detectedPackageManager,
    url: localhostAddressForPort(entry.port),
    source: "process",
    canOpen: isHttpLikePort(entry.port),
    canCopyUrl: true,
    canReveal: Boolean(project.projectPath ?? cwd),
    canStop: false,
    isDangerousToStop: false,
    stopState: "idle"
  };

  const dangerous = isDangerousProcess(baseRecord);
  return {
    ...baseRecord,
    canStop: !dangerous,
    isDangerousToStop: dangerous,
    protectionReason: dangerous ? getProtectedProcessReason(baseRecord) : undefined
  };
}

export async function scanProcessPorts(): Promise<PortRecord[]> {
  return (await scanProcessPortsDetailed()).records;
}

async function readLsofListeningTcp(): Promise<string> {
  let stdout = "";

  try {
    const result = await execFileAsync("lsof", ["-iTCP", "-sTCP:LISTEN", "-n", "-P"], {
      timeout: 5000,
      maxBuffer: 2 * 1024 * 1024
    });
    stdout = result.stdout;
  } catch (error) {
    const execError = error as { stdout?: string; code?: number };
    if (execError.stdout) {
      stdout = execError.stdout;
    } else if (execError.code === 1) {
      return "";
    } else {
      throw error;
    }
  }

  return stdout;
}

export async function scanProcessPortsDetailed(): Promise<{
  rawOutput: string;
  rawEntries: LsofEntry[];
  records: PortRecord[];
}> {
  const rawOutput = await readLsofListeningTcp();
  const rawEntries = parseLsofOutput(rawOutput);
  const records = await Promise.all(rawEntries.map((entry) => enrichProcessEntry(entry)));
  return { rawOutput, rawEntries, records };
}

export function mergePortRecords(
  processRecords: PortRecord[],
  dockerRecords: PortRecord[]
): PortRecord[] {
  const dockerPorts = new Set(dockerRecords.map((record) => record.port));
  const visibleProcessRecords = processRecords.filter((record) => !dockerPorts.has(record.port));
  return [...visibleProcessRecords, ...dockerRecords].sort(
    (a, b) => a.port - b.port || a.displayName.localeCompare(b.displayName)
  );
}

export async function scanPorts(): Promise<PortRecord[]> {
  return (await scanPortsDetailed()).finalMergedRecords;
}

export async function scanPortsDetailed(): Promise<PortScanDebugInfo> {
  const [processScan, dockerScan] = await Promise.all([
    scanProcessPortsDetailed(),
    scanDockerPortsDetailed()
  ]);
  const finalMergedRecords = mergePortRecords(processScan.records, dockerScan.parsedRecords);

  return {
    scannedAt: new Date().toISOString(),
    rawLsofResultsCount: processScan.rawEntries.length,
    rawLsofOutput: processScan.rawOutput,
    normalizedProcessRecords: processScan.records,
    docker: dockerScan,
    finalMergedRecords
  };
}
