import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DockerDebugInfo, PortRecord } from "../types/port";

const execFileAsync = promisify(execFile);
const dockerCandidates = [
  "docker",
  "/usr/local/bin/docker",
  "/opt/homebrew/bin/docker",
  "/Applications/OrbStack.app/Contents/MacOS/docker"
];

interface DockerPsLine {
  ID?: string;
  Image?: string;
  Names?: string;
  Ports?: string;
  Status?: string;
}

export interface DockerPublishedPort {
  host: string;
  hostPort: number;
  containerPort: number;
  protocol: "tcp";
}

const httpLikePorts = new Set([
  80, 3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 4200, 5000, 5001, 5002,
  5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 8000,
  8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009, 8010, 8080, 8081, 8082, 8083, 8084, 8085,
  8086, 8087, 8088, 8089, 8090
]);

export function isHttpLikePort(port: number): boolean {
  return httpLikePorts.has(port);
}

export function localhostAddressForPort(port: number): string {
  return isHttpLikePort(port) ? `http://localhost:${port}` : `localhost:${port}`;
}

export function parseDockerPublishedPorts(portsText?: string): DockerPublishedPort[] {
  if (!portsText) {
    return [];
  }

  const ports = new Map<number, DockerPublishedPort>();

  for (const rawPart of portsText.split(",")) {
    const part = rawPart.trim();
    // docker can print ranges like 3000-3001->3000-3001/tcp; skip safely until range expansion is needed.
    const match = part.match(/^(?<host>.+):(?<hostPort>\d+)->(?<containerPort>\d+)\/tcp$/);
    if (!match?.groups) {
      continue;
    }

    const hostPort = Number(match.groups.hostPort);
    const containerPort = Number(match.groups.containerPort);
    if (
      Number.isInteger(hostPort) &&
      hostPort > 0 &&
      hostPort <= 65535 &&
      Number.isInteger(containerPort) &&
      containerPort > 0 &&
      containerPort <= 65535
    ) {
      ports.set(hostPort, {
        host: match.groups.host,
        hostPort,
        containerPort,
        protocol: "tcp"
      });
    }
  }

  return [...ports.values()].sort((a, b) => a.hostPort - b.hostPort);
}

export function parseDockerPsJsonLines(output: string): PortRecord[] {
  const records: PortRecord[] = [];

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    let container: DockerPsLine;
    try {
      container = JSON.parse(line) as DockerPsLine;
    } catch {
      continue;
    }

    const containerId = container.ID?.trim();
    if (!containerId) {
      continue;
    }

    const publishedPorts = parseDockerPublishedPorts(container.Ports);
    for (const publishedPort of publishedPorts) {
      const port = publishedPort.hostPort;
      const displayName = container.Names || container.Image || `Docker ${port}`;
      records.push({
        id: `docker:${containerId}:${port}`,
        port,
        protocol: "tcp",
        displayName,
        source: "docker",
        containerId,
        containerName: container.Names,
        dockerImage: container.Image,
        dockerStatus: container.Status,
        url: localhostAddressForPort(port),
        canOpen: isHttpLikePort(port),
        canCopyUrl: true,
        canReveal: false,
        canStop: true,
        isDangerousToStop: false,
        stopState: "idle"
      });
    }
  }

  return records;
}

function shouldTryDockerCandidate(executable: string) {
  return executable === "docker" || fs.existsSync(executable);
}

function isMissingExecutableError(message: string) {
  return message === "Executable does not exist." || message.includes("ENOENT");
}

async function runDockerCommand(args: string[], timeout: number) {
  const candidateErrors: Array<{ executable: string; message: string }> = [];
  let firstFoundExecutable: string | undefined;
  let firstFoundExecutableError: string | undefined;

  for (const executable of dockerCandidates) {
    if (!shouldTryDockerCandidate(executable)) {
      candidateErrors.push({ executable, message: "Executable does not exist." });
      continue;
    }

    try {
      const { stdout } = await execFileAsync(executable, args, {
        timeout,
        maxBuffer: 1024 * 1024
      });
      return { executable, stdout, candidateErrors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!firstFoundExecutable && !isMissingExecutableError(message)) {
        firstFoundExecutable = executable;
        firstFoundExecutableError = message;
      }
      candidateErrors.push({ executable, message });
    }
  }

  return {
    executable: firstFoundExecutable,
    stdout: "",
    error: firstFoundExecutableError,
    candidateErrors
  };
}

export async function scanDockerPortsDetailed(): Promise<DockerDebugInfo> {
  const result = await runDockerCommand(["ps", "--format", "{{json .}}"], 4500);
  const parsedRecords = result.stdout ? parseDockerPsJsonLines(result.stdout) : [];

  return {
    commandAvailable: Boolean(result.executable),
    executable: result.executable,
    rawOutput: result.stdout,
    parsedRecords,
    error: result.stdout
      ? undefined
      : result.executable
        ? `Docker CLI found but docker ps failed: ${result.error ?? "unknown error"}`
        : "Docker CLI not found from app environment.",
    candidateErrors: result.candidateErrors
  };
}

export async function scanDockerPorts(): Promise<PortRecord[]> {
  return (await scanDockerPortsDetailed()).parsedRecords;
}

export function isValidContainerId(containerId: unknown): containerId is string {
  return typeof containerId === "string" && /^[a-f0-9]{12,64}$/i.test(containerId);
}

export async function stopDockerContainer(containerId: string): Promise<boolean> {
  if (!isValidContainerId(containerId)) {
    return false;
  }

  try {
    const result = await runDockerCommand(["stop", containerId], 15000);
    return Boolean(result.executable);
  } catch {
    return false;
  }
}
