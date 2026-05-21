import fs from "node:fs";
import path from "node:path";
import type { AliasEntry, PortRecord } from "../types/port";

interface AliasStoreData {
  aliases: Record<string, AliasEntry>;
}

export class AliasStore {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  static fromUserDataPath(userDataPath: string): AliasStore {
    return new AliasStore(path.join(userDataPath, "aliases.json"));
  }

  getAliasKey(record: PortRecord): string {
    if (record.projectPath) {
      return record.projectPath;
    }

    if (record.source === "docker") {
      return `docker:${record.containerName || record.containerId || record.id}`;
    }

    return `process:${record.command || record.processName || record.pid || record.id}:${record.port}`;
  }

  getAlias(record: PortRecord): string | undefined {
    return this.read().aliases[this.getAliasKey(record)]?.alias;
  }

  setAlias(record: PortRecord, alias: string): void {
    const key = this.getAliasKey(record);
    const cleanAlias = alias.trim();
    const data = this.read();

    if (!cleanAlias) {
      delete data.aliases[key];
    } else {
      data.aliases[key] = {
        key,
        alias: cleanAlias,
        updatedAt: new Date().toISOString()
      };
    }

    this.write(data);
  }

  applyAliases(records: PortRecord[]): PortRecord[] {
    const data = this.read();
    return records.map((record) => {
      const alias = data.aliases[this.getAliasKey(record)]?.alias;
      if (!alias) {
        return record;
      }

      return {
        ...record,
        alias,
        displayName: alias
      };
    });
  }

  private read(): AliasStoreData {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<AliasStoreData>;
      return {
        aliases: parsed.aliases ?? {}
      };
    } catch {
      return { aliases: {} };
    }
  }

  private write(data: AliasStoreData): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}
