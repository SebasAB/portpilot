import { describe, expect, it } from "vitest";
import { filterPortRecords, isCommonPort, recordMatchesSearch } from "../src/portFilters";
import type { PortRecord } from "../electron/types/port";

const dockerPostgresRecord: PortRecord = {
  id: "docker:c35aa3729f07:5432",
  port: 5432,
  protocol: "tcp",
  displayName: "portpilot-postgres-test",
  source: "docker",
  containerId: "c35aa3729f07",
  containerName: "portpilot-postgres-test",
  dockerImage: "postgres:16",
  url: "localhost:5432",
  canOpen: false,
  canCopyUrl: true,
  canReveal: false,
  canStop: true,
  isDangerousToStop: false
};

describe("port filtering", () => {
  it("search finds a Docker record by port", () => {
    expect(recordMatchesSearch(dockerPostgresRecord, "5432")).toBe(true);
  });

  it("search finds a Docker record by container metadata", () => {
    expect(recordMatchesSearch(dockerPostgresRecord, "postgres:16")).toBe(true);
    expect(recordMatchesSearch(dockerPostgresRecord, "portpilot-postgres")).toBe(true);
  });

  it("common dev ports include Docker Postgres on 5432", () => {
    expect(isCommonPort(5432)).toBe(true);
    expect(
      filterPortRecords([dockerPostgresRecord], {
        filter: "common",
        searchQuery: "5432",
        showProtectedProcesses: false
      })
    ).toEqual([dockerPostgresRecord]);
  });
});
