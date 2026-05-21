import { describe, expect, it } from "vitest";
import {
  getProtectedProcessReason,
  isDangerousProcess,
  parseLsofCwdOutput,
  parsePsOutput
} from "../electron/services/processInspector";

describe("processInspector parsers", () => {
  it("parses ps metadata with a full command", () => {
    const parsed = parsePsOutput(
      "11111 222 node /usr/local/bin/node /Users/sebas/app/node_modules/.bin/vite --host 0.0.0.0\n"
    );
    expect(parsed).toEqual({
      pid: 11111,
      ppid: 222,
      processName: "node",
      command: "/usr/local/bin/node /Users/sebas/app/node_modules/.bin/vite --host 0.0.0.0"
    });
  });

  it("parses lsof cwd name output", () => {
    expect(parseLsofCwdOutput("p11111\nn/Users/sebas/Projects/city-rain\n")).toBe(
      "/Users/sebas/Projects/city-rain"
    );
  });

  it("protects OrbStack helper processes", () => {
    const record = {
      pid: 670,
      source: "process" as const,
      processName: "OrbStack Helper",
      command:
        "/Applications/OrbStack.app/Contents/Frameworks/OrbStack Helper.app/Contents/MacOS/OrbStack Helper vmgr",
      cwd: "/Applications/OrbStack.app"
    };

    expect(isDangerousProcess(record)).toBe(true);
    expect(getProtectedProcessReason(record)).toBe(
      "This looks like a Docker/OrbStack helper process. Stop the container from Docker/OrbStack instead."
    );
  });
});
