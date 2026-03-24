import { AppShell, Container } from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAtom } from "jotai";

import SettingsSidebar from "@/components/settings/settings-sidebar.tsx";
import { SpaceSidebar } from "@/features/space/components/sidebar/space-sidebar.tsx";
import { AppHeader } from "@/components/layouts/global/app-header.tsx";
import Aside from "@/components/layouts/global/aside.tsx";

import {
  asideStateAtom,
  desktopSidebarAtom,
  mobileSidebarAtom,
  sidebarWidthAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";

import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";

// ✅ CLIENT MODE
import { clientModeAtom } from "@/store/client-store";

import classes from "./app-shell.module.css";

export default function GlobalAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const [mobileOpened] = useAtom(mobileSidebarAtom);
  const toggleMobile = useToggleSidebar(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const [{ isAsideOpen }] = useAtom(asideStateAtom);

  const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);
  const [clientMode] = useAtom(clientModeAtom);

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // ---------------- RESIZE ----------------
  const startResizing = React.useCallback((e: any) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: any) => {
      if (isResizing && sidebarRef.current) {
        const newWidth =
          e.clientX -
          sidebarRef.current.getBoundingClientRect().left;

        if (newWidth < 220) return setSidebarWidth(220);
        if (newWidth > 600) return setSidebarWidth(600);

        setSidebarWidth(newWidth);
      }
    },
    [isResizing, setSidebarWidth],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // ---------------- ROUTES ----------------
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const isSpaceRoute = location.pathname.startsWith("/s/");
  const isHomeRoute = location.pathname.startsWith("/home");
  const isSpacesRoute = location.pathname === "/spaces";
  const isPageRoute = location.pathname.includes("/p/");
  const hideSidebar = isHomeRoute || isSpacesRoute;

  return (
    <AppShell
      header={{ height: 45 }}
      padding="md"
      navbar={
        !hideSidebar && {
          width: isSpaceRoute ? sidebarWidth : 300,
          breakpoint: "sm",
          collapsed: {
            mobile: !mobileOpened,
            desktop: !desktopOpened,
          },
        }
      }
      aside={
        isPageRoute && {
          width: 350,
          breakpoint: "sm",
          collapsed: { mobile: !isAsideOpen, desktop: !isAsideOpen },
        }
      }
    >
      {/* HEADER */}
      <AppShell.Header px="md" className={classes.header}>
        <AppHeader />
      </AppShell.Header>

      {/* NAVBAR */}
      {!hideSidebar && (
        <AppShell.Navbar
          ref={sidebarRef}
          className={classes.navbar}
          withBorder={false}
        >
          <div
            className={classes.resizeHandle}
            onMouseDown={startResizing}
          />

          {isSpaceRoute && <SpaceSidebar />}
          {isSettingsRoute && <SettingsSidebar />}
        </AppShell.Navbar>
      )}

      {/* MAIN */}
      <AppShell.Main>

        {/* ✅ IMPROVED CLIENT MODE BANNER */}
       {clientMode && (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 28,
        background: "#1f2937",
        color: "#fff",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        letterSpacing: 1,
        fontWeight: 600,
      }}
    >
      🔴 CLIENT MODE
    </div>
  )}

        {isSettingsRoute ? (
          <Container size={850}>{children}</Container>
        ) : (
          children
        )}
      </AppShell.Main>

      {/* ASIDE */}
      {isPageRoute && (
        <AppShell.Aside
          className={classes.aside}
          p="md"
          withBorder={false}
        >
          <Aside />
        </AppShell.Aside>
      )}
    </AppShell>
  );
}