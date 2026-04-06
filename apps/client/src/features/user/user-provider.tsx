import React, { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { io, Socket } from "socket.io-client";

import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { setClientModeAtom } from "@/store/client-store";
import useCurrentUser from "@/features/user/hooks/use-current-user";
import { useTranslation } from "react-i18next";
import { socketAtom } from "@/features/websocket/atoms/socket-atom";
import { SOCKET_URL } from "@/features/websocket/types";

import { useQuerySubscription } from "@/features/websocket/use-query-subscription";
import { useTreeSocket } from "@/features/websocket/use-tree-socket";
import { useNotificationSocket } from "@/features/notification/hooks/use-notification-socket";

import { Error404 } from "@/components/ui/error-404";

export function UserProvider({ children }: React.PropsWithChildren) {
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const setClientMode = useSetAtom(setClientModeAtom);

  // ✅ socket state
  const [, setSocket] = useAtom(socketAtom);

  const { data, isLoading, error, isError } = useCurrentUser();
  const { i18n } = useTranslation();

  // 🔥 SOCKET CONNECTION
  useEffect(() => {
    if (isLoading || isError) return;

    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(socket);

    socket.on("connect", () => {
      console.log("✅ ws connected");
    });

    socket.on("disconnect", () => {
      console.log("❌ ws disconnected");
    });

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [isLoading, isError, setSocket]);

  // 🔥 SOCKET FEATURES
  useQuerySubscription();
  useTreeSocket();
  useNotificationSocket();

  // 🔥 USER DATA SYNC (NO CLIENT MODE OVERRIDE)
  useEffect(() => {
    if (!data?.user || !data?.workspace) return;

    setCurrentUser((prev) => {
      const safePrev = prev ?? {
        user: null,
        workspace: null,
      };

      return {
        ...safePrev,
        ...data,
        user: {
          ...safePrev.user,
          ...data.user,

          // ✅ DO NOT override client mode from backend
          clientMode:
            safePrev.user?.clientMode ??
            data.user.clientMode ??
            false,
        },
      };
    });

    // ❌ DO NOT DO THIS (REMOVED)
    // setClientMode(data.user.clientMode)

    // 🌐 Language sync
    i18n.changeLanguage(
      data.user.locale === "en" ? "en-US" : data.user.locale
    );
  }, [data, setCurrentUser, i18n]);

  // ⏳ LOADING
  if (isLoading) return null;

  // ❌ 404
  if (isError && error?.["response"]?.status === 404) {
    return <Error404 />;
  }

  // ❌ OTHER ERRORS
  if (error) return null;

  return <>{children}</>;
}