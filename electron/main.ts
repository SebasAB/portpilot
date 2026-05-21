import fs from "node:fs";
import path from "node:path";
import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  session,
  shell,
  Tray
} from "electron";
import { AliasStore } from "./services/aliasStore";
import { scanPorts, scanPortsDetailed } from "./services/portScanner";
import { stopPortRecord } from "./services/processStopper";
import type { PortRecord, ScanResult, StopResult } from "./types/port";

const panelSize = {
  width: 390,
  height: 560
};

let tray: Tray | null = null;
let panelWindow: BrowserWindow | null = null;
let aliasStore: AliasStore;
let latestRecords = new Map<string, PortRecord>();
let isQuitting = false;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function logMain(message: string, data?: Record<string, unknown>) {
  const line = `[PortPilot main] ${message}${data ? ` ${JSON.stringify(data)}` : ""}`;
  // eslint-disable-next-line no-console -- main-process diagnostic log; mirrored to userData/main.log below.
  console.log(line);

  if (!app.isReady()) {
    return;
  }

  try {
    fs.appendFileSync(path.join(app.getPath("userData"), "main.log"), `${line}\n`, "utf8");
  } catch {
    // Logging must not interfere with the menu bar app startup path.
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showRendererErrorPage(reason: string, attemptedPath: string) {
  if (!panelWindow || panelWindow.isDestroyed()) {
    return;
  }

  const html = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>PortPilot Renderer Error</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f8fafc;
            color: #17202a;
            font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main {
            width: min(360px, calc(100vw - 32px));
            border: 1px solid #e0b4b4;
            border-radius: 8px;
            background: #fff7f5;
            padding: 16px;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 15px;
          }
          code {
            display: block;
            margin-top: 8px;
            padding: 8px;
            overflow-wrap: anywhere;
            border-radius: 6px;
            background: #ffffff;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>PortPilot could not load the renderer.</h1>
          <p>${escapeHtml(reason)}</p>
          <code>${escapeHtml(attemptedPath)}</code>
        </main>
      </body>
    </html>`;

  void panelWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function verifyRendererMounted(expectedTarget: string) {
  if (!panelWindow || panelWindow.isDestroyed()) {
    return;
  }

  setTimeout(() => {
    if (!panelWindow || panelWindow.isDestroyed()) {
      return;
    }

    void panelWindow.webContents
      .executeJavaScript(
        `(() => ({
          url: location.href,
          rootChildren: document.getElementById("root")?.childElementCount ?? -1,
          scripts: Array.from(document.scripts).map((script) => script.src),
          styles: Array.from(document.querySelectorAll("link[rel='stylesheet']")).map((link) => link.href)
        }))()`
      )
      .then((state: { url: string; rootChildren: number; scripts: string[]; styles: string[] }) => {
        logMain("renderer mount check", {
          expectedTarget,
          currentUrl: state.url,
          rootChildren: state.rootChildren,
          scripts: state.scripts,
          styles: state.styles
        });

        if (state.rootChildren === 0 && state.url.startsWith("file:")) {
          showRendererErrorPage(
            "The renderer HTML loaded, but React did not mount. Check whether bundled JS/CSS asset paths resolve correctly.",
            `${expectedTarget}\nScripts: ${state.scripts.join(", ")}\nStyles: ${state.styles.join(", ")}`
          );
        }
      })
      .catch((error) => {
        logMain("renderer mount check failed", {
          expectedTarget,
          error: error instanceof Error ? error.message : String(error)
        });
      });
  }, 1500);
}

function getRendererTarget() {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl && !app.isPackaged) {
    return {
      type: "url" as const,
      target: devServerUrl,
      exists: true
    };
  }

  const rendererFile = path.join(app.getAppPath(), "dist", "index.html");
  return {
    type: "file" as const,
    target: rendererFile,
    exists: fs.existsSync(rendererFile)
  };
}

async function loadRenderer() {
  if (!panelWindow) {
    return;
  }

  const target = getRendererTarget();
  logMain("renderer target resolved", {
    appIsPackaged: app.isPackaged,
    dirname: __dirname,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    viteDevServerUrlPresent: Boolean(process.env.VITE_DEV_SERVER_URL),
    rendererType: target.type,
    rendererTarget: target.target,
    rendererFileExists: target.exists
  });

  if (target.type === "url") {
    try {
      await panelWindow.loadURL(target.target);
      logMain("renderer loadURL succeeded", { target: target.target });
      verifyRendererMounted(target.target);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logMain("renderer loadURL failed", { target: target.target, error: message });
      showRendererErrorPage(`Development renderer failed to load: ${message}`, target.target);
    }
    return;
  }

  if (!target.exists) {
    logMain("renderer file missing", { target: target.target });
    showRendererErrorPage(
      "The packaged renderer file does not exist at the expected path.",
      target.target
    );
    return;
  }

  try {
    await panelWindow.loadFile(target.target);
    logMain("renderer loadFile succeeded", { target: target.target });
    verifyRendererMounted(target.target);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logMain("renderer loadFile failed", { target: target.target, error: message });
    showRendererErrorPage(`Packaged renderer failed to load: ${message}`, target.target);
  }
}

function createFallbackTrayImage() {
  const svg = `
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="19" fill="#101820"/>
      <path d="M15 32V12h10.5c4.2 0 7.1 2.9 7.1 6.7s-2.9 6.7-7.1 6.7H20v6.6h-5zm5-11h5.1c1.6 0 2.5-.9 2.5-2.3s-.9-2.3-2.5-2.3H20V21z" fill="#ffffff"/>
      <circle cx="32" cy="32" r="4" fill="#22c55e"/>
    </svg>`;
  const image = nativeImage.createFromDataURL(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  );
  image.setTemplateImage(false);
  return image.resize({ width: 18, height: 18 });
}

function resolveTrayIconPath() {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, "assets", "tray.png"),
        path.join(app.getAppPath(), "assets", "tray.png")
      ]
    : [
        path.join(app.getAppPath(), "assets", "tray.png"),
        path.join(__dirname, "..", "assets", "tray.png")
      ];

  const checkedCandidates = candidates.map((candidate) => ({
    path: candidate,
    exists: fs.existsSync(candidate)
  }));
  const match = checkedCandidates.find((candidate) => candidate.exists);

  logMain("tray icon candidates checked", {
    appIsPackaged: app.isPackaged,
    dirname: __dirname,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    candidates: checkedCandidates,
    selectedPath: match?.path
  });

  return match?.path;
}

function createTrayImage() {
  const iconPath = resolveTrayIconPath();
  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);
    image.setTemplateImage(false);
    if (!image.isEmpty()) {
      logMain("tray icon loaded", {
        iconPath,
        isTemplate: image.isTemplateImage(),
        size: image.getSize()
      });
      return image.resize({ width: 18, height: 18 });
    }
    logMain("tray icon file produced an empty NativeImage", { iconPath });
  }

  logMain("using fallback generated tray icon");
  return createFallbackTrayImage();
}

function positionPanel() {
  if (!panelWindow || !tray) {
    return;
  }

  const trayBounds = tray.getBounds();
  const display = screen.getDisplayNearestPoint({
    x: trayBounds.x,
    y: trayBounds.y
  });
  const x = Math.round(
    Math.min(
      Math.max(trayBounds.x + trayBounds.width / 2 - panelSize.width / 2, display.workArea.x + 8),
      display.workArea.x + display.workArea.width - panelSize.width - 8
    )
  );
  const y = Math.round(trayBounds.y + trayBounds.height + 6);
  panelWindow.setBounds({ x, y, ...panelSize });
}

function showPanel() {
  if (!panelWindow) {
    return;
  }

  positionPanel();
  panelWindow.show();
  panelWindow.focus();
}

function togglePanel() {
  if (!panelWindow) {
    return;
  }

  if (panelWindow.isVisible()) {
    panelWindow.hide();
  } else {
    showPanel();
  }
}

async function refreshPorts(): Promise<ScanResult> {
  const scannedAt = new Date().toISOString();

  try {
    const scannedRecords = await scanPorts();
    const previousRecords = latestRecords;
    const withState = scannedRecords.map((record) => {
      const previous = previousRecords.get(record.id);
      if (previous?.stopState && previous.stopState !== "idle") {
        return {
          ...record,
          stopState: previous.stopState
        };
      }
      return record;
    });
    const records = aliasStore.applyAliases(withState);
    latestRecords = new Map(records.map((record) => [record.id, record]));
    return { records, scannedAt };
  } catch {
    return {
      records: [],
      scannedAt,
      error: "PortPilot could not scan local ports. Check macOS permissions and try Refresh."
    };
  }
}

async function findKnownRecord(recordId: string): Promise<PortRecord | undefined> {
  if (typeof recordId !== "string" || recordId.length > 200) {
    return undefined;
  }

  const existing = latestRecords.get(recordId);
  if (existing) {
    return existing;
  }

  await refreshPorts();
  return latestRecords.get(recordId);
}

function updateKnownRecord(recordId: string, patch: Partial<PortRecord>) {
  const record = latestRecords.get(recordId);
  if (!record) {
    return;
  }
  latestRecords.set(recordId, {
    ...record,
    ...patch
  });
}

function sendPortsUpdated(result: ScanResult) {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send("portpilot:ports-updated", result);
  }
}

function isSafeOpenUrl(record: PortRecord) {
  return Boolean(
    record.canOpen && record.url && record.url.startsWith(`http://localhost:${record.port}`)
  );
}

function isSafeCopyTarget(record: PortRecord) {
  return Boolean(
    record.canCopyUrl &&
    record.url &&
    (record.url === `localhost:${record.port}` ||
      record.url.startsWith(`http://localhost:${record.port}`))
  );
}

function createPanelWindow() {
  panelWindow = new BrowserWindow({
    width: panelSize.width,
    height: panelSize.height,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: app.isPackaged,
    title: "PortPilot",
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  panelWindow.setAlwaysOnTop(true, "floating");
  panelWindow.on("blur", () => {
    panelWindow?.hide();
  });
  panelWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      panelWindow?.hide();
    }
  });

  panelWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      logMain("renderer did-fail-load", {
        errorCode,
        errorDescription,
        validatedURL
      });
    }
  );

  panelWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    logMain("renderer console-message", {
      level,
      message,
      line,
      sourceId
    });
  });

  void loadRenderer();
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: "Open PortPilot",
      click: showPanel
    },
    {
      label: "Refresh",
      click: async () => {
        const result = await refreshPorts();
        sendPortsUpdated(result);
        showPanel();
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
}

function createTray() {
  tray = new Tray(createTrayImage());
  tray.setToolTip("PortPilot");
  tray.on("click", togglePanel);
  tray.on("right-click", () => {
    tray?.popUpContextMenu(buildTrayMenu());
  });
}

function registerIpcHandlers() {
  ipcMain.handle("portpilot:scan", refreshPorts);
  ipcMain.handle("portpilot:debug-scan", scanPortsDetailed);

  ipcMain.handle("portpilot:open-url", async (_event, recordId: string) => {
    const record = await findKnownRecord(recordId);
    if (!record || !isSafeOpenUrl(record)) {
      return { ok: false, message: "No safe localhost URL is available for this record." };
    }

    await shell.openExternal(record.url as string);
    return { ok: true };
  });

  ipcMain.handle("portpilot:copy-url", async (_event, recordId: string) => {
    const record = await findKnownRecord(recordId);
    if (!record || !isSafeCopyTarget(record)) {
      return { ok: false, message: "No safe localhost address is available for this record." };
    }

    clipboard.writeText(record.url as string);
    return { ok: true };
  });

  ipcMain.handle("portpilot:reveal-folder", async (_event, recordId: string) => {
    const record = await findKnownRecord(recordId);
    const targetPath = record?.projectPath ?? record?.cwd;
    if (!record?.canReveal || !targetPath || !fs.existsSync(targetPath)) {
      return { ok: false, message: "No project folder is available for this record." };
    }

    shell.showItemInFolder(targetPath);
    return { ok: true };
  });

  ipcMain.handle("portpilot:set-alias", async (_event, recordId: string, alias: string) => {
    const record = await findKnownRecord(recordId);
    if (!record) {
      return [...latestRecords.values()];
    }

    aliasStore.setAlias(record, typeof alias === "string" ? alias : "");
    const records = aliasStore.applyAliases([...latestRecords.values()]);
    latestRecords = new Map(records.map((nextRecord) => [nextRecord.id, nextRecord]));
    return records;
  });

  ipcMain.handle(
    "portpilot:stop",
    async (_event, recordId: string, force?: boolean): Promise<StopResult> => {
      const record = await findKnownRecord(recordId);
      if (!record) {
        return {
          id: recordId,
          state: "failed",
          message: "The port record is no longer available."
        };
      }

      if (record.source !== "docker" && force && record.stopState !== "needs-force") {
        return {
          id: record.id,
          state: "failed",
          message: "Force Stop is only available after SIGTERM did not stop the process."
        };
      }

      updateKnownRecord(record.id, { stopState: "terminating" });
      const result = await stopPortRecord(record, Boolean(force));
      updateKnownRecord(record.id, { stopState: result.state });
      return result;
    }
  );

  ipcMain.handle("portpilot:quit", () => {
    isQuitting = true;
    app.quit();
  });
}

function installContentSecurityPolicy() {
  if (process.env.VITE_DEV_SERVER_URL) {
    return;
  }

  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [policy]
      }
    });
  });
}

app.whenReady().then(() => {
  aliasStore = AliasStore.fromUserDataPath(app.getPath("userData"));
  logMain("app ready", {
    appIsPackaged: app.isPackaged,
    dirname: __dirname,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath
  });

  if (process.platform === "darwin" && app.isPackaged) {
    app.dock?.hide();
  }

  installContentSecurityPolicy();
  registerIpcHandlers();
  createPanelWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
