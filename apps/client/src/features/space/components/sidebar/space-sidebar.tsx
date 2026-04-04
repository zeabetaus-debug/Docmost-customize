import {
  ActionIcon,
  Group,
  Text,
  Tooltip,
  UnstyledButton,
  Menu,
} from "@mantine/core";
import {
  IconFileExport,
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  IconDots,
  IconTrash,
} from "@tabler/icons-react";
import classes from "./space-sidebar.module.css";
import React from "react";
import { useAtom } from "jotai";
import { treeApiAtom } from "@/features/page/tree/atoms/tree-api-atom.ts";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useDisclosure } from "@mantine/hooks";
import SpaceSettingsModal from "@/features/space/components/settings-modal.tsx";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import SpaceTree from "@/features/page/tree/components/space-tree.tsx";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { useTranslation } from "react-i18next";
import { SwitchSpace } from "./switch-space";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import { searchSpotlight } from "@/features/search/constants";
import { useClientGuard } from "@/features/zeaatlas/client-mode/use-client-guard";
import { clientModeAtom } from "@/store/client-store";

export function SpaceSidebar() {
  const [clientMode] = useAtom(clientModeAtom);
  const { t } = useTranslation();
  const { guardClientAction } = useClientGuard();
  const isClient = clientMode;

  const [tree] = useAtom(treeApiAtom);
  const location = useLocation();
  const [opened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  if (!space) return <></>;

  function handleCreatePage() {
    if (clientMode) return;
    tree?.create({ parentId: null, type: "internal", index: 0 });
  }

  return (
    <>
      <div className={classes.navbar}>

        {/* TOP */}
        <div className={classes.section}>
          <SwitchSpace
            spaceName={space?.name}
            spaceSlug={space?.slug}
            spaceIcon={space?.logo}
          />
        </div>

        {/* MENU */}
        <div className={classes.section}>
          <div className={classes.menuItems}>

            <UnstyledButton
              component={Link}
              to={getSpaceUrl(spaceSlug)}
              className={clsx(
                classes.menu,
                location.pathname.toLowerCase() === getSpaceUrl(spaceSlug)
                  ? classes.activeButton
                  : ""
              )}
            >
              <div className={classes.menuItemInner}>
                <IconHome size={18} className={classes.menuItemIcon} />
                <span>{t("Overview")}</span>
              </div>
            </UnstyledButton>

            <UnstyledButton
              className={classes.menu}
              onClick={searchSpotlight.open}
            >
              <div className={classes.menuItemInner}>
                <IconSearch size={18} className={classes.menuItemIcon} />
                <span>{t("Search")}</span>
              </div>
            </UnstyledButton>

            <UnstyledButton
              className={classes.menu}
              onClick={() => {
                if (clientMode) return;
                guardClientAction(openSettings);
              }}
            >
              <div className={classes.menuItemInner}>
                <IconSettings size={18} className={classes.menuItemIcon} />
                <span>{t("Space settings")}</span>
              </div>
            </UnstyledButton>

            {/* ✅ SHEETS */}
            <UnstyledButton component={Link} to="/sheets" className={classes.menu}>
              <div className={classes.menuItemInner}>
                <IconFileExport size={18} className={classes.menuItemIcon} />
                <span>Sheets</span>
              </div>
            </UnstyledButton>

            {!isClient &&
              spaceAbility.can(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page
              ) && (
                <UnstyledButton
                  className={classes.menu}
                  onClick={() => {
                    handleCreatePage();
                    if (mobileSidebarOpened) toggleMobileSidebar();
                  }}
                >
                  <div className={classes.menuItemInner}>
                    <IconPlus size={18} className={classes.menuItemIcon} />
                    <span>{t("New page")}</span>
                  </div>
                </UnstyledButton>
              )}

          </div>
        </div>

        {/* ✅ PAGES SECTION */}
        <div className={clsx(classes.section, classes.sectionPages)}>

          <Group className={classes.pagesHeader} justify="space-between">
            <Text size="xs" fw={500} c="dimmed">
              {t("Pages")}
            </Text>

            {!isClient &&
              spaceAbility.can(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page
              ) && (
                <Group gap="xs">
                  <SpaceMenu spaceId={space.id} onSpaceSettings={openSettings} />

                  <Tooltip label={t("Create page")} withArrow position="right">
                    <ActionIcon
                      variant="default"
                      size={18}
                      onClick={handleCreatePage}
                    >
                      <IconPlus />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
          </Group>

          <div className={classes.pages}>
            <SpaceTree
              spaceId={space.id}
              readOnly={
                clientMode ||
                spaceAbility.cannot(
                  SpaceCaslAction.Manage,
                  SpaceCaslSubject.Page
                )
              }
            />
          </div>

        </div>

      </div>

      <SpaceSettingsModal
        opened={opened}
        onClose={closeSettings}
        spaceId={space?.slug}
      />
    </>
  );
}

/* ✅ SPACE MENU FIX */
function SpaceMenu({ spaceId, onSpaceSettings }: any) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { guardClientAction } = useClientGuard();
  const { spaceSlug } = useParams();

  return (
    <Menu width={200} shadow="md" withArrow>
      <Menu.Target>
        <Tooltip label={t("Space menu")} withArrow>
          <ActionIcon variant="default" size={18}>
            <IconDots size={16} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          onClick={() => guardClientAction(onSpaceSettings)}
          leftSection={<IconSettings size={16} />}
        >
          {t("Space settings")}
        </Menu.Item>

        <Menu.Item
          onClick={() =>
            guardClientAction(() => navigate(`/s/${spaceSlug}/trash`))
          }
          leftSection={<IconTrash size={16} />}
        >
          {t("Trash")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

