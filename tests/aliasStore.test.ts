import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AliasStore } from "../electron/services/aliasStore";
import type { PortRecord } from "../electron/types/port";

let tempDir = "";
let store: AliasStore;

const baseRecord: PortRecord = {
  id: "process:11111:3000",
  port: 3000,
  protocol: "tcp",
  pid: 11111,
  processName: "node",
  projectPath: "/Users/sebas/Projects/city-rain",
  displayName: "city-rain",
  source: "process",
  canOpen: true,
  canCopyUrl: true,
  canReveal: true,
  canStop: true,
  isDangerousToStop: false
};

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "portpilot-alias-"));
  store = new AliasStore(path.join(tempDir, "aliases.json"));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("AliasStore", () => {
  it("persists and applies aliases by project path", () => {
    store.setAlias(baseRecord, "City Rain PWA");
    expect(store.getAlias(baseRecord)).toBe("City Rain PWA");

    const [aliased] = store.applyAliases([baseRecord]);
    expect(aliased.displayName).toBe("City Rain PWA");
    expect(aliased.alias).toBe("City Rain PWA");
  });

  it("removes an alias when the saved value is empty", () => {
    store.setAlias(baseRecord, "City Rain PWA");
    store.setAlias(baseRecord, "  ");
    expect(store.getAlias(baseRecord)).toBeUndefined();
  });

  it("uses Docker container identity when no project path exists", () => {
    const dockerRecord: PortRecord = {
      ...baseRecord,
      id: "docker:9f86d081884c:5432",
      source: "docker",
      projectPath: undefined,
      containerId: "9f86d081884c",
      containerName: "city-db",
      displayName: "city-db"
    };
    store.setAlias(dockerRecord, "Local Postgres");
    expect(store.applyAliases([dockerRecord])[0].displayName).toBe("Local Postgres");
  });
});
