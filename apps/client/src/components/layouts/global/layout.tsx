import { UserProvider } from "@/features/user/user-provider.tsx";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import GlobalAppShell from "@/components/layouts/global/global-app-shell.tsx";
import { SearchSpotlight } from "@/features/search/components/search-spotlight.tsx";
import React from "react";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import usePermission from "@/hooks/use-permission";
import { isClientRestrictedRoute } from "@/features/zeaatlas/client-mode/client-mode.utils";

export default function Layout() {
  const location = useLocation();
  const { spaceSlug } = useParams();
  const permission = usePermission();
  const { data: space, isFetched } = useGetSpaceBySlugQuery(spaceSlug);

  if (permission.isClient && isClientRestrictedRoute(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  if (permission.isClient && spaceSlug && isFetched && !space) {
    return <Navigate to="/home" replace />;
  }

  return (
    <UserProvider key={location.pathname}>
      <GlobalAppShell>
        <Outlet />
      </GlobalAppShell>

      <SearchSpotlight spaceId={space?.id} />
    </UserProvider>
  );
}
