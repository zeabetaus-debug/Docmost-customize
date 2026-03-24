import { Group, Text, Tooltip } from "@mantine/core";
import classes from "./app-header.module.css";
import React from "react";
import TopMenu from "@/components/layouts/global/top-menu.tsx";
import { Link, useLocation } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import { useAtom } from "jotai";
import {
  desktopSidebarAtom,
  mobileSidebarAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import SidebarToggle from "@/components/ui/sidebar-toggle-button.tsx";
import { useTranslation } from "react-i18next";

import {
  SearchControl,
  SearchMobileControl,
} from "@/features/search/components/search-control.tsx";

import { searchSpotlight } from "@/features/search/constants.ts";
import { NotificationPopover } from "@/features/notification/components/notification-popover.tsx";

const links = [{ link: APP_ROUTE.HOME, label: "Home" }];

export function AppHeader() {
  const { t } = useTranslation();
  const location = useLocation();

  const [mobileOpened] = useAtom(mobileSidebarAtom);
  const toggleMobile = useToggleSidebar(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const toggleDesktop = useToggleSidebar(desktopSidebarAtom);

  const isHomeRoute = location.pathname.startsWith("/home");
  const isSpacesRoute = location.pathname === "/spaces";
  const hideSidebar = isHomeRoute || isSpacesRoute;

  const items = links.map((link) => (
    <Link key={link.label} to={link.link} className={classes.link}>
      {t(link.label)}
    </Link>
  ));

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      
      {/* LEFT SIDE */}
      <Group gap="sm">
        {!hideSidebar && (
          <>
            <Tooltip label="Sidebar toggle">
              <SidebarToggle
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
              />
            </Tooltip>

            <Tooltip label="Sidebar toggle">
              <SidebarToggle
                opened={desktopOpened}
                onClick={toggleDesktop}
                visibleFrom="sm"
                size="sm"
              />
            </Tooltip>
          </>
        )}

        {/* ✅ BRAND */}
        <Text
          size="lg"
          fw={700}
          component={Link}
          to="/home"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          ZeaAtlas
        </Text>

        {/* NAV LINKS */}
        <Group gap={10} ml={20} visibleFrom="sm">
          {items}
        </Group>
      </Group>

      {/* CENTER (FIXED WIDTH SEARCH) */}
      <Group style={{ width: 320, maxWidth: "40%" }} justify="center">
        <SearchControl onClick={searchSpotlight.open} />
      </Group>

      {/* RIGHT SIDE */}
      <Group gap="md" wrap="nowrap">
        <NotificationPopover />
        <TopMenu />
      </Group>
    </Group>
  );
}