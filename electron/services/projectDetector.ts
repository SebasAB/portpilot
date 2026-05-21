import fs from "node:fs";
import path from "node:path";
import type { PackageManager } from "../types/port";

export interface PackageJsonShape {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ProjectDetection {
  projectPath?: string;
  detectedProjectName?: string;
  detectedFramework?: string;
  detectedPackageManager: PackageManager;
}

const frameworkChecks: Array<{ name: string; packages: string[]; scriptHints: string[] }> = [
  { name: "Next.js", packages: ["next"], scriptHints: ["next"] },
  { name: "Vite", packages: ["vite"], scriptHints: ["vite"] },
  { name: "Astro", packages: ["astro"], scriptHints: ["astro"] },
  { name: "Expo", packages: ["expo"], scriptHints: ["expo"] },
  { name: "React Native", packages: ["react-native"], scriptHints: ["react-native"] },
  { name: "Nuxt", packages: ["nuxt"], scriptHints: ["nuxt"] },
  { name: "SvelteKit", packages: ["@sveltejs/kit"], scriptHints: ["svelte-kit", "sveltekit"] },
  { name: "Express/Node", packages: ["express"], scriptHints: ["express"] }
];

export function detectFrameworkFromPackageJson(packageJson: PackageJsonShape): string | undefined {
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {})
  };
  const scriptText = Object.values(packageJson.scripts ?? {})
    .join(" ")
    .toLowerCase();

  for (const check of frameworkChecks) {
    const hasPackage = check.packages.some(
      (packageName) => dependencies[packageName] !== undefined
    );
    const hasScriptHint = check.scriptHints.some((hint) => scriptText.includes(hint));
    if (hasPackage || hasScriptHint) {
      return check.name;
    }
  }

  return undefined;
}

export function detectPackageManager(projectPath: string): PackageManager {
  if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (fs.existsSync(path.join(projectPath, "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.join(projectPath, "package-lock.json"))) {
    return "npm";
  }
  if (
    fs.existsSync(path.join(projectPath, "bun.lockb")) ||
    fs.existsSync(path.join(projectPath, "bun.lock"))
  ) {
    return "bun";
  }
  return "unknown";
}

export function findPackageRoot(startDir?: string): string | undefined {
  if (!startDir) {
    return undefined;
  }

  let current: string;
  try {
    current = path.resolve(startDir);
    if (!fs.existsSync(current)) {
      return undefined;
    }

    const stat = fs.statSync(current);
    if (!stat.isDirectory()) {
      current = path.dirname(current);
    }
  } catch {
    // Path resolution / stat failed (permissions, missing path). Project
    // detection is best-effort; fall through to "unknown project".
    return undefined;
  }

  for (let depth = 0; depth < 64; depth += 1) {
    try {
      if (fs.existsSync(path.join(current, "package.json"))) {
        return current;
      }
    } catch {
      // existsSync threw on a parent we cannot read. Stop walking.
      return undefined;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }

  return undefined;
}

export function readPackageJson(projectPath: string): PackageJsonShape | undefined {
  try {
    const packageJsonPath = path.join(projectPath, "package.json");
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJsonShape;
  } catch {
    // Malformed JSON or unreadable file. Detection is best-effort.
    return undefined;
  }
}

export function detectProjectFromCwd(cwd?: string): ProjectDetection {
  const projectPath = findPackageRoot(cwd);
  if (!projectPath) {
    return {
      detectedPackageManager: "unknown"
    };
  }

  const packageJson = readPackageJson(projectPath);
  return {
    projectPath,
    detectedProjectName: packageJson?.name,
    detectedFramework: packageJson ? detectFrameworkFromPackageJson(packageJson) : undefined,
    detectedPackageManager: detectPackageManager(projectPath)
  };
}
