import { describe, expect, it } from "vitest";
import {
  parseDockerPsJsonLines,
  parseDockerPublishedPorts
} from "../electron/services/dockerScanner";
import {
  dockerHttpJsonLine,
  dockerPostgresJsonLine,
  dockerRedisJsonLine,
  dockerUnpublishedPostgresJsonLine,
  dockerViteIpv6JsonLine
} from "./fixtures/docker";

describe("dockerScanner parser", () => {
  it("extracts published TCP local port mappings", () => {
    expect(parseDockerPublishedPorts("0.0.0.0:5432->5432/tcp, :::5432->5432/tcp")).toEqual([
      expect.objectContaining({
        hostPort: 5432,
        containerPort: 5432,
        protocol: "tcp"
      })
    ]);
    expect(parseDockerPublishedPorts("127.0.0.1:8080->80/tcp")).toEqual([
      expect.objectContaining({
        host: "127.0.0.1",
        hostPort: 8080,
        containerPort: 80
      })
    ]);
    expect(parseDockerPublishedPorts("127.0.0.1:5432->5432/tcp")).toEqual([
      expect.objectContaining({
        host: "127.0.0.1",
        hostPort: 5432,
        containerPort: 5432
      })
    ]);
    expect(parseDockerPublishedPorts(":::3000->3000/tcp")).toEqual([
      expect.objectContaining({
        hostPort: 3000,
        containerPort: 3000
      })
    ]);
    expect(parseDockerPublishedPorts("[::]:5432->5432/tcp")).toEqual([
      expect.objectContaining({
        host: "[::]",
        hostPort: 5432,
        containerPort: 5432
      })
    ]);
  });

  it("extracts host-published ports from mixed docker port entries", () => {
    expect(parseDockerPublishedPorts("5432/tcp, 0.0.0.0:8080->80/tcp")).toEqual([
      expect.objectContaining({
        hostPort: 8080,
        containerPort: 80
      })
    ]);
  });

  it("skips published port ranges without crashing", () => {
    expect(parseDockerPublishedPorts("0.0.0.0:3000-3001->3000-3001/tcp")).toEqual([]);
  });

  it("ignores container-only exposed ports without host publishing", () => {
    expect(parseDockerPublishedPorts("5432/tcp")).toEqual([]);
    expect(parseDockerPsJsonLines(dockerUnpublishedPostgresJsonLine)).toEqual([]);
  });

  it("creates docker port records from JSON lines", () => {
    const records = parseDockerPsJsonLines(
      `${dockerPostgresJsonLine}\n${dockerRedisJsonLine}\n${dockerHttpJsonLine}\n${dockerViteIpv6JsonLine}\n`
    );
    expect(records).toHaveLength(4);
    expect(records.find((record) => record.port === 5432)).toEqual(
      expect.objectContaining({
        port: 5432,
        source: "docker",
        containerName: "portpilot-postgres-test",
        dockerImage: "postgres:16",
        dockerStatus: "Up 2 minutes",
        url: "localhost:5432",
        canOpen: false,
        canStop: true
      })
    );
    expect(records.find((record) => record.port === 6379)).toEqual(
      expect.objectContaining({ containerName: "cache" })
    );
    expect(records.find((record) => record.port === 3000)).toEqual(
      expect.objectContaining({ containerName: "vite", canOpen: true })
    );
    expect(records.find((record) => record.port === 8080)).toEqual(
      expect.objectContaining({ containerName: "web", canOpen: true })
    );
  });

  it("parses OrbStack docker ps JSON output for Postgres on 5432", () => {
    const output =
      '{"Command":"\\"docker-entrypoint.s…\\"","CreatedAt":"2026-05-19 23:18:16 -0500 -05","ID":"c35aa3729f07","Image":"postgres:16","Labels":"","LocalVolumes":"1","Mounts":"216f3d646f3be7…","Names":"portpilot-postgres-test","Networks":"bridge","Ports":"0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp","State":"running","Status":"Up 12 minutes"}';
    expect(parseDockerPsJsonLines(output)).toEqual([
      expect.objectContaining({
        port: 5432,
        source: "docker",
        containerName: "portpilot-postgres-test",
        dockerImage: "postgres:16",
        canStop: true,
        canCopyUrl: true,
        canOpen: false
      })
    ]);
  });
});
