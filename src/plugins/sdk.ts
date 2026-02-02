import type { ComponentType } from "react";

export type PluginMetadata = {
  id: string;
  name: string;
  description: string;
  icon?: string;
};

export type PluginInstructionsProps = {
  pluginId: string;
};

export type PluginViewerProps = {
  pluginId: string;
};

export type ImporterContext = {
  pluginId: string;
  // Step 05 introduces a real import wizard + file pickers.
};

export type PluginImporter = (context: ImporterContext) => Promise<void>;

export type RawBrowserHints = {
  rootLabel?: string;
};

export type Plugin = {
  metadata: PluginMetadata;
  Instructions: ComponentType<PluginInstructionsProps>;
  Viewer: ComponentType<PluginViewerProps>;
  importer: PluginImporter;
  rawBrowserHints?: RawBrowserHints;
};

