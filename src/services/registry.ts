export type BuiltInServiceId = "google-photos" | "whatsapp";

export type ServiceDescriptor = {
  id: BuiltInServiceId;
  name: string;
  description: string;
};

export const BUILT_IN_SERVICES: ServiceDescriptor[] = [
  {
    id: "google-photos",
    name: "Google Photos",
    description: "Import via Google Takeout (offline export)."
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Import via iOS chat export (offline export)."
  }
];

export function getServiceById(id: string): ServiceDescriptor | null {
  return BUILT_IN_SERVICES.find((s) => s.id === id) ?? null;
}

