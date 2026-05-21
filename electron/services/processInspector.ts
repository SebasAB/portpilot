import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PortRecord } from "../types/port";

const execFileAsync = promisify(execFile);

export interface ProcessInfo {
  pid: number;
  ppid?: number;
  processName?: string;
  command?: string;
}

export function isValidPid(pid: unknown): pid is number {
  return Number.isInteger(pid) && Number(pid) > 1 && Number(pid) < 1_000_000;
}

export function parsePsOutput(output: string): ProcessInfo | undefined {
  const line = output
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find(Boolean);

  if (!line) {
    return undefined;
  }

  const match = line.match(/^(\d+)\s+(\d+)\s+(\S+)(?:\s+(.*))?$/);
  if (!match) {
    return undefined;
  }

  const pid = Number(match[1]);
  const ppid = Number(match[2]);
  if (!isValidPid(pid)) {
    return undefined;
  }

  return {
    pid,
    ppid: Number.isInteger(ppid) ? ppid : undefined,
    processName: match[3],
    command: match[4]?.trim()
  };
}

export function parseLsofCwdOutput(output: string): string | undefined {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("n"))
    ?.slice(1);
}

export async function getProcessInfo(pid: number): Promise<ProcessInfo | undefined> {
  if (!isValidPid(pid)) {
    return undefined;
  }

  try {
    const { stdout } = await execFileAsync(
      "ps",
      ["-p", String(pid), "-o", "pid=,ppid=,comm=,command="],
      {
        timeout: 3000,
        maxBuffer: 512 * 1024
      }
    );
    return parsePsOutput(stdout);
  } catch {
    return undefined;
  }
}

export async function getProcessCwd(pid: number): Promise<string | undefined> {
  if (!isValidPid(pid)) {
    return undefined;
  }

  try {
    const { stdout } = await execFileAsync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], {
      timeout: 3000,
      maxBuffer: 512 * 1024
    });
    return parseLsofCwdOutput(stdout);
  } catch {
    return undefined;
  }
}

type ProcessSafetyRecord = Pick<PortRecord, "pid" | "processName" | "command" | "source"> &
  Partial<Pick<PortRecord, "cwd" | "projectPath">>;

export function getProtectedProcessReason(record: ProcessSafetyRecord): string | undefined {
  if (record.source === "docker") {
    return undefined;
  }

  if (!isValidPid(record.pid)) {
    return "This process has an invalid or protected PID.";
  }

  const processText =
    `${record.processName ?? ""} ${record.command ?? ""} ${record.cwd ?? ""} ${record.projectPath ?? ""}`.trim();
  const lowerText = processText.toLowerCase();
  const lowerName = (record.processName ?? "").toLowerCase();

  if (!processText) {
    return "PortPilot could not identify this process safely.";
  }

  const exactDangerousNames = new Set([
    "launchd",
    "kernel_task",
    "controlcenter",
    "finder",
    "windowserver"
  ]);
  if (exactDangerousNames.has(lowerName)) {
    return "This is a protected macOS system process.";
  }

  if (lowerName.startsWith("com.apple.") || lowerText.includes("/system/library/")) {
    return "This is a protected macOS system process.";
  }

  if (
    lowerName.startsWith("com.docker") ||
    lowerText.includes("docker desktop.app") ||
    lowerText.includes("com.docker.backend") ||
    lowerText.includes("com.docker.hyperkit") ||
    lowerText.includes("com.docker.vmnetd") ||
    lowerText.includes("orbstack.app") ||
    lowerText.includes("orbstack helper") ||
    lowerName.includes("orbstack") ||
    lowerText.includes("/applications/orbstack.app") ||
    lowerText.includes("colima") ||
    lowerText.includes("lima")
  ) {
    return "This looks like a Docker/OrbStack helper process. Stop the container from Docker/OrbStack instead.";
  }

  return undefined;
}

export function isDangerousProcess(record: ProcessSafetyRecord): boolean {
  return Boolean(getProtectedProcessReason(record));
}

export function processExists(pid: number): boolean {
  if (!isValidPid(pid)) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}
