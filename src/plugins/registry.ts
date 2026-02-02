import type { Plugin } from "./sdk";
import { googlePhotosTakeoutPlugin } from "./builtins/google-photos-takeout";
import { whatsappIosExportPlugin } from "./builtins/whatsapp-ios-export";

const BUILT_INS: Plugin[] = [googlePhotosTakeoutPlugin, whatsappIosExportPlugin];

export function getBuiltInPlugins(): Plugin[] {
  return BUILT_INS;
}

export function getPluginById(id: string): Plugin | null {
  return BUILT_INS.find((p) => p.metadata.id === id) ?? null;
}

