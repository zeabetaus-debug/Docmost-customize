import {
  ActionIcon,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconBellRinging, IconMessageCircle } from "@tabler/icons-react";
import React from "react";
import ChangeRequestCard from "@/features/zeaatlas/change-request/ChangeRequestCard";
import { IChangeRequest } from "@/features/zeaatlas/change-request/change-request.types";
import { hasValidChangeRequestContent } from "@/features/zeaatlas/change-request/change-request.utils";

interface ChangeRequestIndicatorProps {
  pageId?: string;
  pageTitle?: string;
  requests?: IChangeRequest[];
  onRequestsChange?: React.Dispatch<React.SetStateAction<IChangeRequest[]>>;
}

export default function ChangeRequestIndicator({
  pageId,
  pageTitle,
  requests = [],
  onRequestsChange,
}: ChangeRequestIndicatorProps) {
  const [opened, setOpened] = React.useState(false);
  const validRequests = React.useMemo(
    () =>
      requests.filter(
        (request) =>
          Boolean(request) &&
          request.isReal === true &&
          hasValidChangeRequestContent(request.content),
      ),
    [requests],
  );
  const pageRequests = React.useMemo(
    () =>
      validRequests.filter((request) =>
        pageId ? request.pageId === pageId : true,
      ),
    [pageId, validRequests],
  );
  const pendingRequests = React.useMemo(
    () => pageRequests.filter((request) => request.status === "pending"),
    [pageRequests],
  );
  const visibleRequests = React.useMemo(
    () =>
      pageRequests.filter(
        (request) =>
          request.status === "pending" || request.status === "approved",
      ),
    [pageRequests],
  );
  const hasRequests = visibleRequests.length > 0;
  const notificationCount = pendingRequests.length;

  const handleLocalStatusChange = React.useCallback(
    (id: string, status: IChangeRequest["status"]) => {
      onRequestsChange?.((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                status,
                updatedAt: new Date().toISOString(),
              }
            : request,
        ),
      );
    },
    [onRequestsChange],
  );

  const handleRequestUpdate = React.useCallback(
    (id: string, updater: (request: IChangeRequest) => IChangeRequest) => {
      onRequestsChange?.((current) =>
        current.map((request) =>
          request.id === id ? updater(request) : request,
        ),
      );
    },
    [onRequestsChange],
  );

  return (
    <Popover
      position="bottom-end"
      shadow="lg"
      opened={opened}
      onChange={setOpened}
      withArrow
      withinPortal={false}
    >
      <Popover.Target>
        <Tooltip label="Change requests" withArrow>
          <ActionIcon
            variant="subtle"
            color={notificationCount > 0 ? "yellow" : "dark"}
            onClick={() => setOpened((current) => !current)}
            aria-label="Open change requests"
          >
            <Indicator
              disabled={notificationCount === 0}
              label={notificationCount}
              size={16}
              offset={6}
              color="red"
              withBorder
            >
              <IconBellRinging size={20} stroke={2} />
            </Indicator>
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown
        p="sm"
        style={{ width: "min(360px, calc(100vw - 24px))" }}
      >
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Change Requests
          </Text>

          {hasRequests ? (
            <ScrollArea.Autosize mah={280} scrollbarSize={6} offsetScrollbars>
              <Stack gap="xs">
                {visibleRequests.map((request, index) => (
                  <ChangeRequestCard
                    key={request.id}
                    index={index}
                    pageId={pageId}
                    pageTitle={pageTitle}
                    request={request}
                    onLocalStatusChange={handleLocalStatusChange}
                    onRequestUpdate={handleRequestUpdate}
                  />
                ))}
              </Stack>
            </ScrollArea.Autosize>
          ) : (
            <Stack align="center" gap="xs" py="md">
              <IconMessageCircle
                size={26}
                stroke={1.7}
                color="var(--mantine-color-dimmed)"
              />
              <Text size="sm" c="dimmed">
                No change requests yet
              </Text>
            </Stack>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
