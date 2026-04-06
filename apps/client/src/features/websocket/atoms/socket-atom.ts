import { atom } from "jotai";
import { Socket } from "socket.io-client";

// ✅ Explicit writable atom (THIS FIXES NEVER ERROR)
export const socketAtom = atom<Socket | null, [Socket | null], void>(
  null,
  (_get, set, newSocket) => {
    set(socketAtom, newSocket);
  }
);