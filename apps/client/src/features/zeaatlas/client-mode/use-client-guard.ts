import { notifications } from "@mantine/notifications";
import usePermission from "@/hooks/use-permission";
import { CLIENT_READ_ONLY_MESSAGE } from "./client-mode.utils";

export function useClientGuard() {
  const permission = usePermission();

  const guardClientAction = <T,>(
    action: (() => T) | undefined,
    message = CLIENT_READ_ONLY_MESSAGE,
  ) => {
    if (permission.isClient) {
      notifications.show({
        message,
        color: "gray",
      });
      return undefined;
    }

    return action?.();
  };

  return {
    ...permission,
    guardClientAction,
  };
}
