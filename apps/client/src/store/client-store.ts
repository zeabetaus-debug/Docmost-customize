import { atom } from "jotai";

// 🔹 Main state
export const clientModeAtom = atom<boolean>(false);

// 🔹 Derived helpers (optional but powerful)
export const isClientModeOnAtom = atom((get) => get(clientModeAtom));

// 🔹 Toggle action (clean way)
export const toggleClientModeAtom = atom(
  null,
  (get, set) => {
    const current = get(clientModeAtom);
    set(clientModeAtom, !current);
  }
);

// 🔹 Set explicitly (used for API sync)
export const setClientModeAtom = atom(
  null,
  (_get, set, value: boolean) => {
    set(clientModeAtom, value);
  }
);