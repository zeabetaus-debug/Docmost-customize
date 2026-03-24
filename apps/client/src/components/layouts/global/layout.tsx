import { UserProvider } from "@/features/user/user-provider.tsx";
import { Outlet, useParams, useLocation } from "react-router-dom";
import GlobalAppShell from "@/components/layouts/global/global-app-shell.tsx";

import { SearchSpotlight } from "@/features/search/components/search-spotlight.tsx";
import React from "react";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";

export default function Layout() {
  const location = useLocation(); // 🔥 IMPORTANT
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  return (
    <UserProvider key={location.pathname}>  {/* 🔥 FORCE FULL RESET */}
      <GlobalAppShell>
        <Outlet />   {/* ✅ keep clean */}
      </GlobalAppShell>

      <SearchSpotlight spaceId={space?.id} />
    </UserProvider>
  );
}