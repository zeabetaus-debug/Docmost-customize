export function hasScope(scopes: string[] = [], requiredScope: string) {
  return scopes.includes(requiredScope);
}

export function hasAnyScope(scopes: string[] = [], requiredScopes: string[]) {
  return requiredScopes.some((scope) => scopes.includes(scope));
}

export function isSpaceAllowed(scopes: string[] = [], spaceId?: string) {
  if (!spaceId) return true;

  return scopes.includes(`space:${spaceId}`) || scopes.includes("space:*");
}
