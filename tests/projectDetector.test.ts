import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  detectFrameworkFromPackageJson,
  detectPackageManager,
  detectProjectFromCwd,
  findPackageRoot
} from "../electron/services/projectDetector";
import { expoPackageJson, nextPackageJson, vitePackageJson } from "./fixtures/packageJson";

const tempDirs: string[] = [];

function createTempProject(lockFile: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portpilot-project-"));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(vitePackageJson), "utf8");
  fs.writeFileSync(path.join(dir, lockFile), "", "utf8");
  fs.mkdirSync(path.join(dir, "src"));
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("projectDetector", () => {
  it("detects supported frameworks from package.json content", () => {
    expect(detectFrameworkFromPackageJson(nextPackageJson)).toBe("Next.js");
    expect(detectFrameworkFromPackageJson(vitePackageJson)).toBe("Vite");
    expect(detectFrameworkFromPackageJson(expoPackageJson)).toBe("Expo");
  });

  it("detects package managers from lock files", () => {
    expect(detectPackageManager(createTempProject("pnpm-lock.yaml"))).toBe("pnpm");
    expect(detectPackageManager(createTempProject("yarn.lock"))).toBe("yarn");
    expect(detectPackageManager(createTempProject("package-lock.json"))).toBe("npm");
    expect(detectPackageManager(createTempProject("bun.lock"))).toBe("bun");
  });

  it("walks upward to find a package root", () => {
    const project = createTempProject("package-lock.json");
    const nested = path.join(project, "src");
    expect(findPackageRoot(nested)).toBe(project);
    expect(detectProjectFromCwd(nested)).toEqual(
      expect.objectContaining({
        projectPath: project,
        detectedProjectName: "portpilot-ui",
        detectedFramework: "Vite",
        detectedPackageManager: "npm"
      })
    );
  });
});
