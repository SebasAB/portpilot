import type { PortRecord, StopResult } from "../types/port";
import { isValidContainerId, stopDockerContainer } from "./dockerScanner";
import { isDangerousProcess, isValidPid, processExists } from "./processInspector";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function stopPortRecord(record: PortRecord, force = false): Promise<StopResult> {
  if (record.source === "docker") {
    if (!isValidContainerId(record.containerId)) {
      return { id: record.id, state: "failed", message: "Docker container id is invalid." };
    }

    const stopped = await stopDockerContainer(record.containerId);
    return {
      id: record.id,
      state: stopped ? "stopped" : "failed",
      message: stopped ? undefined : "Docker did not stop the container."
    };
  }

  if (!isValidPid(record.pid)) {
    return { id: record.id, state: "failed", message: "PID is invalid." };
  }

  if (isDangerousProcess(record)) {
    return {
      id: record.id,
      state: "failed",
      message: "PortPilot will not stop a protected system process."
    };
  }

  if (force) {
    try {
      process.kill(record.pid, "SIGKILL");
      await wait(350);
      return {
        id: record.id,
        state: processExists(record.pid) ? "failed" : "stopped",
        message: processExists(record.pid) ? "Process is still running after SIGKILL." : undefined
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return {
        id: record.id,
        state: code === "ESRCH" ? "stopped" : "failed",
        message: code === "ESRCH" ? undefined : "Unable to force stop the process."
      };
    }
  }

  try {
    process.kill(record.pid, "SIGTERM");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return {
      id: record.id,
      state: code === "ESRCH" ? "stopped" : "failed",
      message: code === "ESRCH" ? undefined : "Unable to send SIGTERM to the process."
    };
  }

  await wait(900);
  if (processExists(record.pid)) {
    return {
      id: record.id,
      state: "needs-force",
      message: "Process is still running. Use Force Stop only if you are sure."
    };
  }

  return { id: record.id, state: "stopped" };
}
