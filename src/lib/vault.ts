import { invoke } from "@tauri-apps/api/tauri";

export type Manifest = {
  schemaVersion: number;
  pluginId: string;
  accountId: string;
  displayName?: string | null;
  createdAt: string;
  lastImportAt?: string | null;
  lastImportStatus?: "success" | "failure" | string | null;
  sourceFingerprints: string[];
};

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as any).__TAURI__;
}

const DEV_VAULT_KEY = "backapp.dev.vaultPath";

export async function getVaultPath(): Promise<string> {
  if (!isTauri()) {
    return (
      window.localStorage.getItem(DEV_VAULT_KEY) ??
      "(browser dev) Set vault in Settings"
    );
  }
  return invoke<string>("get_vault_path");
}

export async function setVaultPath(path: string): Promise<void> {
  if (!isTauri()) {
    window.localStorage.setItem(DEV_VAULT_KEY, path);
    return;
  }
  await invoke("set_vault_path", { path });
}

export async function ensureAccountFolder(
  pluginId: string,
  accountId: string
): Promise<string> {
  if (!isTauri()) {
    return `Vault/${pluginId}/${accountId}`;
  }
  return invoke<string>("ensure_account_folder", { pluginId, accountId });
}

export async function readManifest(
  pluginId: string,
  accountId: string
): Promise<Manifest | null> {
  if (!isTauri()) return null;
  return invoke<Manifest | null>("read_manifest", { pluginId, accountId });
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  if (!isTauri()) return;
  await invoke("write_manifest", { manifest });
}

