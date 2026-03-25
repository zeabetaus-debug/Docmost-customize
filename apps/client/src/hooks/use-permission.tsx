import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { isClientUser } from "@/features/zeaatlas/client-mode/client-mode.utils";

export default function usePermission() {
  const [currentUser] = useAtom(currentUserAtom);
  const role = currentUser?.user?.role;

  const isClient = isClientUser(role);

  const canEdit = !isClient;
  const canDelete = !isClient;
  const canShare = !isClient;
  const canComment = !isClient;
  const canExport = !isClient;

  return {
    isClient,
    canEdit,
    canDelete,
    canShare,
    canComment,
    canExport,
    isReadOnly: isClient,
  };
}
