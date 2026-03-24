import { Atom } from "jotai";

declare global {
  const entitlementAtom: any;
  const Feature: { [key: string]: string };
  function useHasFeature(feature: string): boolean;
  function useUpgradeLabel(): string;
  function useEntitlements(): { data?: { features?: string[]; tier?: string } };
  function useTrial(): { isTrial: boolean };
}

export {};
