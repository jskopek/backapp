// Backwards-compatible wrapper around the plugin registry.
// Step 04 turns "services" into built-in plugins.
import { getBuiltInPlugins, getPluginById } from "../plugins/registry";

export type ServiceDescriptor = {
  id: string;
  name: string;
  description: string;
};

export const BUILT_IN_SERVICES: ServiceDescriptor[] = getBuiltInPlugins().map(
  (p) => ({
    id: p.metadata.id,
    name: p.metadata.name,
    description: p.metadata.description
  })
);

export function getServiceById(id: string): ServiceDescriptor | null {
  const plugin = getPluginById(id);
  if (!plugin) return null;
  return {
    id: plugin.metadata.id,
    name: plugin.metadata.name,
    description: plugin.metadata.description
  };
}
