import { atom } from "jotai";

const KEY = "zeaatlas_client_mode";

const getInitial = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
};

export const clientModeAtom = atom<boolean>(getInitial());

export const setClientModeAtom = atom(
  null,
  (_get, set, value: boolean) => {
    localStorage.setItem(KEY, String(value));
    set(clientModeAtom, value);
  }
);