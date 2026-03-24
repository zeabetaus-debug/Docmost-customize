import { atom } from "jotai";

export const entitlementAtom = atom({ features: [] as string[], tier: "free" });

export const Feature = {
  COMMENT_RESOLUTION: "comment:resolution",
  CONFLUENCE_IMPORT: "import:confluence",
  DOCX_IMPORT: "import:docx",
  ATTACHMENT_INDEXING: "search:attachment_indexing",
  AI: "ai",
  API_KEYS: "api:keys",
  SECURITY_SETTINGS: "security:settings",
  AUDIT_LOGS: "audit:logs",
} as const;

export function useHasFeature(_f: string): boolean {
  return false;
}

export function useUpgradeLabel(): string {
  return "Upgrade your plan to unlock this feature";
}

export function useEntitlements() {
  return { data: undefined } as { data?: { features?: string[]; tier?: string } | undefined };
}

export function useTrial() {
  return { isTrial: false };
}

// Attach to global so legacy code that references these names without imports still works
(globalThis as any).entitlementAtom = entitlementAtom;
(globalThis as any).Feature = Feature;
(globalThis as any).useHasFeature = useHasFeature;
(globalThis as any).useUpgradeLabel = useUpgradeLabel;
(globalThis as any).useEntitlements = useEntitlements;
(globalThis as any).useTrial = useTrial;

export default {};
