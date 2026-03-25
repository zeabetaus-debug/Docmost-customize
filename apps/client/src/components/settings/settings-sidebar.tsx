import React, { useEffect, useState } from "react";
import { Group, Text, ScrollArea, ActionIcon } from "@mantine/core";
import {
  IconUser,
  IconSettings,
  IconUsers,
  IconArrowLeft,
  IconUsersGroup,
  IconSpaces,
  IconBrush,
  IconWorld,
  IconWebhook,
  IconKey,
  IconHistory,
  IconTemplate,
  IconTags,
} from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import classes from "./settings.module.css";
import { useTranslation } from "react-i18next";
import { isCloud } from "@/lib/config.ts";
import useUserRole from "@/hooks/use-user-role.tsx";

import {
  prefetchGroups,
  prefetchShares,
  prefetchSpaces,
  prefetchWorkspaceMembers,
} from "@/components/settings/settings-queries.tsx";

import AppVersion from "@/components/settings/app-version.tsx";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useAtom } from "jotai";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import { useSettingsNavigation } from "@/hooks/use-settings-navigation";

type DataItem = {
  label: string;
  icon: React.ElementType;
  path: string;
};

type DataGroup = {
  heading: string;
  items: DataItem[];
};

const groupedData: DataGroup[] = [
  {
    heading: "Account",
    items: [
      { label: "Profile", icon: IconUser, path: "/settings/account/profile" },
      {
        label: "Preferences",
        icon: IconBrush,
        path: "/settings/account/preferences",
      },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "General", icon: IconSettings, path: "/settings/workspace" },
      { label: "Members", icon: IconUsers, path: "/settings/members" },
      { label: "Groups", icon: IconUsersGroup, path: "/settings/groups" },
      { label: "Spaces", icon: IconSpaces, path: "/settings/spaces" },
      { label: "Public sharing", icon: IconWorld, path: "/settings/sharing" },
      {
        label: "Automation Webhooks",
        icon: IconWebhook,
        path: "/settings/webhooks",
      },
      {
        label: "API Keys",
        icon: IconKey,
        path: "/settings/api-keys",
      },
      {
        label: "Audit Log",
        icon: IconHistory,
        path: "/settings/audit-log",
      },
      {
        label: "Smart Templates",
        icon: IconTemplate,
        path: "/settings/templates",
      },
      {
        label: "Taxonomy",
        icon: IconTags,
        path: "/settings/taxonomy",
      },
    ],
  },
];

export default function SettingsSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate(); // 🔥 ADD THIS
  const [active, setActive] = useState(location.pathname);
  const { goBack } = useSettingsNavigation();
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  useEffect(() => {
    setActive(location.pathname);
  }, [location.pathname]);

  const menuItems = groupedData.map((group) => (
    <div key={group.heading}>
      <Text c="dimmed" className={classes.linkHeader}>
        {t(group.heading)}
      </Text>

      {group.items.map((item) => {
        let prefetchHandler: any;

        switch (item.label) {
          case "Members":
            prefetchHandler = prefetchWorkspaceMembers;
            break;
          case "Spaces":
            prefetchHandler = prefetchSpaces;
            break;
          case "Groups":
            prefetchHandler = prefetchGroups;
            break;
          case "Public sharing":
            prefetchHandler = prefetchShares;
            break;
        }

        return (
          <div
            key={item.label}
            onMouseEnter={prefetchHandler}
            className={classes.link}
            data-active={active.startsWith(item.path) || undefined}
            onClick={() => {
              navigate(item.path); // 🔥 FORCE NAVIGATION

              if (mobileSidebarOpened) {
                toggleMobileSidebar();
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <item.icon className={classes.linkIcon} stroke={2} />
            <span>{t(item.label)}</span>
          </div>
        );
      })}
    </div>
  ));

  return (
    <div className={classes.navbar}>
      <Group className={classes.title} justify="flex-start">
        <ActionIcon
          onClick={() => {
            goBack();
            if (mobileSidebarOpened) {
              toggleMobileSidebar();
            }
          }}
          variant="transparent"
          c="gray"
          aria-label="Back"
        >
          <IconArrowLeft stroke={2} />
        </ActionIcon>

        <Text fw={500}>{t("Settings")}</Text>
      </Group>

      <ScrollArea w="100%">{menuItems}</ScrollArea>

      {!isCloud() && <AppVersion />}
    </div>
  );
}
