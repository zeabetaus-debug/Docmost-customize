import { UserRole } from "@/lib/types";

export const CLIENT_READ_ONLY_MESSAGE = "Read-only access";

export function isClientUser(role?: string | null) {
  return role === UserRole.CLIENT;
}

export function isClientAllowedSpace(space?: { isClientAllowed?: boolean } | null) {
  return space?.isClientAllowed === true;
}

export function filterClientAllowedSpaces<T extends { isClientAllowed?: boolean }>(
  spaces: T[] | undefined,
  isClient: boolean,
) {
  if (!spaces) {
    return [];
  }

  if (!isClient) {
    return spaces;
  }

  return spaces.filter((space) => isClientAllowedSpace(space));
}

export function isClientRestrictedRoute(pathname: string) {
  return (
    pathname.startsWith("/settings") ||
    /^\/s\/[^/]+\/trash(?:\/|$)/.test(pathname)
  );
}
