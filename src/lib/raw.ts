import { invoke } from "@tauri-apps/api/tauri";
import { isTauri } from "./vault";

export type RawEntry = {
  path: string;
  name: string;
  isDir: boolean;
  size?: number | null;
  modifiedMs?: number | null;
};

export async function listRawTree(args: {
  pluginId: string;
  accountId: string;
  subdir?: string;
}): Promise<RawEntry[]> {
  if (!isTauri()) return [];
  return invoke<RawEntry[]>("list_raw_tree", {
    args: {
      pluginId: args.pluginId,
      accountId: args.accountId,
      subdir: args.subdir ?? null
    }
  });
}

export async function readTextFile(args: {
  pluginId: string;
  accountId: string;
  relPath: string;
  maxBytes?: number;
}): Promise<string> {
  if (!isTauri()) return "";
  return invoke<string>("read_text_file", {
    pluginId: args.pluginId,
    accountId: args.accountId,
    relPath: args.relPath,
    maxBytes: args.maxBytes ?? null
  });
}

export async function openInOs(args: {
  pluginId: string;
  accountId: string;
  relPath: string;
}): Promise<void> {
  if (!isTauri()) return;
  await invoke("open_in_os", {
    pluginId: args.pluginId,
    accountId: args.accountId,
    relPath: args.relPath
  });
}

export async function revealInOs(args: {
  pluginId: string;
  accountId: string;
  relPath: string;
}): Promise<void> {
  if (!isTauri()) return;
  await invoke("reveal_in_os", {
    pluginId: args.pluginId,
    accountId: args.accountId,
    relPath: args.relPath
  });
}

