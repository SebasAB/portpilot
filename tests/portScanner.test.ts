import { describe, expect, it } from "vitest";
import {
  isCommonDevPort,
  mergePortRecords,
  parseLsofOutput
} from "../electron/services/portScanner";
import type { PortRecord } from "../electron/types/port";
import { lsofCombined, lsofNodeOn3000, lsofPostgresOn5432, lsofViteOn5173 } from "./fixtures/lsof";

describe("portScanner lsof parser", () => {
  it("parses a node listener on port 3000", () => {
    const entries = parseLsofOutput(lsofNodeOn3000);
    expect(entries).toEqual([
      expect.objectContaining({
        commandName: "node",
        pid: 11111,
        port: 3000
      })
    ]);
  });

  it("parses Vite and postgres listener formats", () => {
    expect(parseLsofOutput(lsofViteOn5173)[0]).toEqual(
      expect.objectContaining({
        commandName: "node",
        pid: 22222,
        port: 5173
      })
    );
    expect(parseLsofOutput(lsofPostgresOn5432)[0]).toEqual(
      expect.objectContaining({
        commandName: "postgres",
        pid: 33333,
        port: 5432
      })
    );
  });

  it("returns sorted unique entries", () => {
    const entries = parseLsofOutput(lsofCombined);
    expect(entries.map((entry) => entry.port)).toEqual([3000, 5173, 5432]);
  });

  it("recognizes common development ports", () => {
    expect(isCommonDevPort(3000)).toBe(true);
    expect(isCommonDevPort(5173)).toBe(true);
    expect(isCommonDevPort(27017)).toBe(true);
    expect(isCommonDevPort(9000)).toBe(false);
  });

  it("prefers Docker records over OrbStack helper processes on the same local port", () => {
    const processRecord: PortRecord = {
      id: "process:670:5432",
      port: 5432,
      protocol: "tcp",
      pid: 670,
      processName: "OrbStack Helper",
      command:
        "/Applications/OrbStack.app/Contents/Frameworks/OrbStack Helper.app/Contents/MacOS/OrbStack Helper vmgr",
      cwd: "/Applications/OrbStack.app",
      displayName: "/Applications/OrbStack.app/Contents/Frameworks/OrbStack Helper.app",
      source: "process",
      canOpen: false,
      canCopyUrl: true,
      canReveal: true,
      canStop: false,
      isDangerousToStop: true
    };
    const dockerRecord: PortRecord = {
      id: "docker:9f86d081884c:5432",
      port: 5432,
      protocol: "tcp",
      displayName: "portpilot-postgres-test",
      source: "docker",
      containerId: "9f86d081884c",
      containerName: "portpilot-postgres-test",
      dockerImage: "postgres:16",
      url: "localhost:5432",
      canOpen: false,
      canCopyUrl: true,
      canReveal: false,
      canStop: true,
      isDangerousToStop: false
    };

    expect(mergePortRecords([processRecord], [dockerRecord])).toEqual([dockerRecord]);
  });
});
