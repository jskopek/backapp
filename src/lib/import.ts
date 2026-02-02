import { invoke } from "@tauri-apps/api/tauri";
import type { EventCallback, UnlistenFn } from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "./vault";

export type ImportProgress = {
  phase: string;
  message: string;
  percent?: number | null;
};

export type RunImportArgs = {
  pluginId: string;
  accountId: string;
  displayName?: string | null;
  sourcePath: string;
};

export type RunImportResult = {
  runId: string;
  logPath: string;
  accountRoot: string;
};

export async function listenImportProgress(
  handler: EventCallback<ImportProgress>
): Promise<UnlistenFn> {
  if (!isTauri()) {
    return async () => {};
  }
  return listen<ImportProgress>("import://progress", handler);
}

export async function runImport(args: RunImportArgs): Promise<RunImportResult | null> {
  if (!isTauri()) {
    // Browser-dev stub.
    await new Promise((r) => setTimeout(r, 300));
    return null;
  }
  return invoke<RunImportResult>("run_import", { args });
}
