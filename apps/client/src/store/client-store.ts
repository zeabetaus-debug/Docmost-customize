import { atom } from "jotai";

// existing (keep if needed)
export const clientAtom = atom<string>("client-a");

// ✅ NEW
export const clientModeAtom = atom<boolean>(false);