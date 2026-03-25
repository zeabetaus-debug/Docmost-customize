import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { UserRole } from "@/lib/types";

export default function usePermission() {
  const [currentUser] = useAtom(currentUserAtom);
  const role = currentUser?.user?.role;

  const isClient = role === UserRole.CLIENT;

  const canEdit = !isClient;
  const canDelete = !isClient;
  const canShare = !isClient;
  const canComment = !isClient;

  return {
    isClient,
    canEdit,
    canDelete,
    canShare,
    canComment,
    isReadOnly: isClient,
  };
}
