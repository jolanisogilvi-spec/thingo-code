#!/usr/bin/env node
/**
 * Install a pinned managed Python runtime and pre-install its package trees
 * into the uv cache used by the desktop bundle. This runs at release-build
 * time so a fresh install does not spend its first launch resolving and
 * downloading the Agent Server and automation dependencies.
 *
 * The cache is intentionally generated per platform by the desktop build. It
 * is not committed to source control: uv environments contain platform
 * specific wheels and can be several hundred megabytes.
 */

import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import defaults from "../config/defaults.json" with { type: "json" };
import { buildAgentServerCommand } from "./dev-safe.mjs";
import { buildAutomationCommand } from "./dev-with-automation.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(projectRoot, "resources", "uv-cache");
const pythonDir = join(projectRoot, "resources", "python");
const pythonVersion = defaults.versions.python;
let managedPythonExecutable;

function findManagedPythonExecutable() {
  const installName = readdirSync(pythonDir).find((name) =>
    name.startsWith(`cpython-${pythonVersion}.`),
  );
  if (!installName) {
    throw new Error(
      `Managed Python ${pythonVersion} was not installed in ${pythonDir}`,
    );
  }
  const executable =
    process.platform === "win32"
      ? join(pythonDir, installName, "python.exe")
      : join(pythonDir, installName, "bin", "python3");
  if (!existsSync(executable)) {
    throw new Error(`Managed Python executable not found at ${executable}`);
  }
  return executable;
}

function removeManagedPythonAliases() {
  for (const name of readdirSync(pythonDir)) {
    const path = join(pythonDir, name);
    if (
      name.startsWith(`cpython-${pythonVersion}-`) &&
      lstatSync(path).isSymbolicLink()
    ) {
      rmSync(path, { recursive: true, force: true });
    }
  }
}

function resolveUv() {
  const bundledName = process.platform === "win32" ? "uv.exe" : "uv";
  const bundledPath = join(projectRoot, "resources", "bin", bundledName);
  return existsSync(bundledPath) ? bundledPath : "uv";
}

function resolveUvx() {
  const bundledName = process.platform === "win32" ? "uvx.exe" : "uvx";
  const bundledPath = join(projectRoot, "resources", "bin", bundledName);
  return existsSync(bundledPath) ? bundledPath : "uvx";
}

function cleanBuildOverrides(env) {
  const clean = { ...env };
  for (const key of [
    "OH_AGENT_SERVER_LOCAL_PATH",
    "OH_AGENT_SERVER_GIT_REF",
    "OH_AGENT_SERVER_VERSION",
    "OH_AUTOMATION_LOCAL_PATH",
    "OH_AUTOMATION_GIT_REF",
    "OH_AUTOMATION_VERSION",
    "OH_AUTOMATION_REPO",
  ]) {
    delete clean[key];
  }
  return clean;
}

function buildUvEnvironment({ offline = false } = {}) {
  const env = {
    ...process.env,
    UV_CACHE_DIR: cacheDir,
    UV_HTTP_TIMEOUT: process.env.UV_HTTP_TIMEOUT || "60",
    UV_MANAGED_PYTHON: "1",
    UV_PYTHON: managedPythonExecutable,
    UV_PYTHON_DOWNLOADS: "never",
    UV_PYTHON_INSTALL_DIR: pythonDir,
  };
  if (offline) env.UV_OFFLINE = "1";
  else delete env.UV_OFFLINE;
  return env;
}

function installPythonRuntime() {
  const uv = resolveUv();
  console.log(
    `[prewarm-uv-cache] Installing managed Python ${pythonVersion} into ${pythonDir}...`,
  );
  execFileSync(
    uv,
    [
      "python",
      "install",
      pythonVersion,
      "--install-dir",
      pythonDir,
      "--no-bin",
      "--no-registry",
    ],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        UV_CACHE_DIR: cacheDir,
        UV_HTTP_TIMEOUT: process.env.UV_HTTP_TIMEOUT || "60",
      },
      stdio: "inherit",
      timeout: 20 * 60_000,
    },
  );
  managedPythonExecutable = findManagedPythonExecutable();
}

function runUvx(label, args, { offline = false } = {}) {
  const uvx = resolveUvx();
  console.log(
    `[prewarm-uv-cache] ${offline ? "Verifying offline" : "Preparing"} ${label}...`,
  );
  console.log(`[prewarm-uv-cache] ${uvx} ${args.join(" ")}`);
  execFileSync(uvx, args, {
    cwd: projectRoot,
    env: buildUvEnvironment({ offline }),
    stdio: "inherit",
    timeout: 20 * 60_000,
  });
}

function main() {
  // Remove an incomplete cache left by an interrupted build. uv's cache is
  // content addressed, so deleting it is safe and avoids packaging a partial
  // tool environment that would still require a network request at startup.
  if (process.env.PREWARM_UV_CACHE_CLEAN !== "0") {
    rmSync(cacheDir, { recursive: true, force: true });
  }
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(pythonDir, { recursive: true });
  installPythonRuntime();

  const env = cleanBuildOverrides(process.env);
  const agentCommand = buildAgentServerCommand(env).args;
  const agentExecutableIndex = agentCommand.indexOf("agent-server");
  const agentArgs = agentCommand.slice(0, agentExecutableIndex);
  // `agent-server --help` starts the service in some released versions. A
  // short metadata query still makes uv resolve/install the exact same
  // package tree, but always exits and never binds a port.
  agentArgs.push(
    "python",
    "-c",
    "import importlib.metadata; print(importlib.metadata.version('openhands-agent-server'))",
  );

  const automationCommand = buildAutomationCommand(env).args;
  const automationExecutableIndex = automationCommand.indexOf("uvicorn");
  const automationArgs = automationCommand.slice(0, automationExecutableIndex);
  automationArgs.push(
    "python",
    "-c",
    "import importlib.metadata; print(importlib.metadata.version('openhands-automation'))",
  );

  console.log(
    `[prewarm-uv-cache] Pinned Agent Server ${defaults.versions.agentServer}; ` +
      `automation ${defaults.versions.automation}; Python ${pythonVersion}`,
  );
  runUvx("Agent Server", agentArgs);
  runUvx("automation backend", automationArgs);
  // This is the same mode used by the installed application. Failing the
  // release build here prevents shipping a cache that silently needs PyPI on
  // first launch (for example cp312 wheels paired with a host CPython 3.13).
  runUvx("Agent Server", agentArgs, { offline: true });
  runUvx("automation backend", automationArgs, { offline: true });
  // uv creates a convenience junction/symlink named only by the minor
  // version. It points to an absolute build-machine path on Windows, so it
  // must not be copied into the installer. Runtime selection uses the real
  // versioned executable above and remains relocatable.
  removeManagedPythonAliases();
  console.log(
    `[prewarm-uv-cache] Offline runtime ready: Python ${pythonVersion} at ${pythonDir}; cache at ${cacheDir}`,
  );
}

try {
  main();
} catch (error) {
  console.error(
    "[prewarm-uv-cache] Failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
