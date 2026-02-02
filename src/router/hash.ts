import { useEffect, useMemo, useState } from "react";

function getHashPath(): string {
  const hash = window.location.hash;
  if (!hash) return "/services";
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!value.startsWith("/")) return `/${value}`;
  return value;
}

export function navigate(to: string) {
  const normalized = to.startsWith("/") ? to : `/${to}`;
  window.location.hash = normalized;
}

export function useHashPath(): string {
  const [path, setPath] = useState(getHashPath);

  useEffect(() => {
    const handler = () => setPath(getHashPath());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return path;
}

export type RouteMatch =
  | { name: "services" }
  | { name: "serviceDetail"; serviceId: string }
  | { name: "importWizard"; serviceId: string }
  | { name: "settings" }
  | { name: "notFound"; path: string };

export function matchRoute(path: string): RouteMatch {
  const cleaned = path.split("?")[0].split("#")[0];
  const parts = cleaned.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "services" };

  if (parts[0] === "services") {
    if (parts.length === 1) return { name: "services" };
    if (parts.length === 2) return { name: "serviceDetail", serviceId: parts[1] };
    if (parts.length === 3 && parts[2] === "import") {
      return { name: "importWizard", serviceId: parts[1] };
    }
  }

  if (parts[0] === "settings" && parts.length === 1) {
    return { name: "settings" };
  }

  return { name: "notFound", path };
}

export function useRoute(): RouteMatch {
  const path = useHashPath();
  return useMemo(() => matchRoute(path), [path]);
}
