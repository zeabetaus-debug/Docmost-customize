import { useAtom } from "jotai";
import { UserRole } from "@/lib/types.ts";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";

export const useUserRole = () => {
  const [currentUser] = useAtom(currentUserAtom);

  const role = currentUser?.user?.role;

  const isAdmin = role === UserRole.ADMIN || role === UserRole.OWNER;

  const isOwner = role === UserRole.OWNER;

  const isMember = role === UserRole.MEMBER;

  const isClient = role === UserRole.CLIENT;

  return { isAdmin, isOwner, isMember, isClient };
};

export default useUserRole;
