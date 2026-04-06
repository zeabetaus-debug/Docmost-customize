import React, { useEffect } from "react";
import { UserProvider } from "@/features/user/user-provider";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import GlobalAppShell from "@/components/layouts/global/global-app-shell";
import { SearchSpotlight } from "@/features/search/components/search-spotlight";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query";
import usePermission from "@/hooks/use-permission";
import { isClientRestrictedRoute } from "@/features/zeaatlas/client-mode/client-mode.utils";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";

export default function Layout() {
  const location = useLocation();
  const { spaceSlug } = useParams();
  const permission = usePermission();

  const [currentUser] = useAtom(currentUserAtom);
  const isClientMode = currentUser?.user?.clientMode === true;

  const { data: space, isFetched } = useGetSpaceBySlugQuery(spaceSlug);

  // ✅ DEBUG
  useEffect(() => {
    if (isClientMode) {
      console.log("Client mode restored from storage");
    }
  }, [isClientMode]);

  // 🔒 CLIENT MODE ROUTE RESTRICTION
  if (isClientMode && isClientRestrictedRoute(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  // 🔒 SPACE ISOLATION
  if (isClientMode && spaceSlug && isFetched && !space) {
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