import React from "react";
import { Button, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import {
  IChangeRequest,
} from "@/features/zeaatlas/change-request/change-request.types";
import ChangeRequestStatusBadge from "@/features/zeaatlas/change-request/ChangeRequestStatusBadge";
import {
  canManageChangeRequests,
  formatChangeRequestTime,
  getChangeRequestPreview,
} from "@/features/zeaatlas/change-request/change-request.utils";
import {
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
} from "@/features/zeaatlas/change-request/change-request-query";
import ChangeRequestViewModal from "@/features/zeaatlas/change-request/ChangeRequestViewModal";
import CommentThread from "@/features/zeaatlas/change-request/CommentThread";

interface ChangeRequestCardProps {
  index: number;
  pageId?: string;
  pageTitle?: string;
  request: IChangeRequest;
  onLocalStatusChange: (id: string, status: IChangeRequest["status"]) => void;
  onRequestUpdate: (id: string, updater: (request: IChangeRequest) => IChangeRequest) => void;
}

export default function ChangeRequestCard({
  index,
  pageId,
  pageTitle,
  request,
  onLocalStatusChange,
  onRequestUpdate,
}: ChangeRequestCardProps) {
  const currentUser = useAtomValue(currentUserAtom);
  const approveMutation = useApproveChangeRequestMutation(pageId);
  const rejectMutation = useRejectChangeRequestMutation();
  const [opened, { open, close }] = useDisclosure(false);
  const [reply, setReply] = React.useState("");
  const canManage = canManageChangeRequests(currentUser?.user?.role);
  const isPending = request.status === "pending";
  const isLoading = approveMutation.isPending || rejectMutation.isPending;
  const isActionDisabled = !isPending || isLoading || request.isLocalOnly;

  const validateRequestId = () => {
    if (!request?.id) {
      console.error("Invalid request ID", request);
      notifications.show({
        message: "Invalid request ID",
        color: "red",
      });
      return false;
    }

    if (request.isLocalOnly) {
      console.error("Change request is not synced with backend yet", request);
      notifications.show({
        message: "This change request is not synced with the server yet",
        color: "red",
      });
      return false;
    }

    return true;
  };

  const handleApprove = async () => {
    if (!validateRequestId()) return;
    if (!window.confirm("Are you sure you want to approve this request?")) return;

    try {
      await approveMutation.mutateAsync(request.id);
      onLocalStatusChange(request.id, "approved");
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!validateRequestId()) return;
    if (!window.confirm("Are you sure you want to reject this request?")) return;

    try {
      await rejectMutation.mutateAsync(request.id);
      onLocalStatusChange(request.id, "rejected");
    } catch (error) {
      console.error(error);
    }
  };

  const handleReply = () => {
    if (!isPending) return;
    if (!reply.trim()) return;

    const newComment = {
      id: crypto.randomUUID(),
      message: reply.trim(),
      createdBy: currentUser?.user?.name || "Unknown user",
      createdAt: new Date().toISOString(),
    };

    onRequestUpdate(request.id, (currentRequest) => ({
      ...currentRequest,
      comments: [...(currentRequest.comments || []), newComment],
    }));

    setReply("");
  };

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        border: opened ? "1px solid #228be6" : undefined,
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text fw={600} size="sm">
              Request #{index + 1}
            </Text>
            <Text size="xs" c="dimmed">
              By: {request.requestedBy?.name || "Unknown user"}
            </Text>
            <Text size="xs" c="dimmed">
              Time: {formatChangeRequestTime(request.createdAt)}
            </Text>
          </Stack>

          <ChangeRequestStatusBadge status={request.status} />
        </Group>

        <Text size="sm" lineClamp={2}>
          {getChangeRequestPreview(request.content)}
        </Text>

        <Group gap="xs" justify="space-between">
          <Button size="xs" variant="light" onClick={open}>
            View Full Change
          </Button>

          {canManage && (
            <Group gap="xs" justify="flex-end">
              <Button
                size="xs"
                color="green"
                onClick={handleApprove}
                disabled={isActionDisabled}
                loading={approveMutation.isPending}
              >
                Approve
              </Button>

              <Button
                size="xs"
                color="red"
                variant="light"
                onClick={handleReject}
                disabled={isActionDisabled}
                loading={rejectMutation.isPending && !approveMutation.isPending}
              >
                Reject
              </Button>

              {!isPending && (
                <Text size="xs" c="dimmed">
                  Decision recorded
                </Text>
              )}
            </Group>
          )}
        </Group>

        {!canManage && request.status === "pending" && !isLoading && (
          <Text size="xs" c="dimmed">
            Approve and reject actions are available for admins and reviewers.
          </Text>
        )}

        {request.isLocalOnly && (
          <Text size="xs" c="dimmed">
            This request is only available locally until the backend returns a saved request ID.
          </Text>
        )}

        <Divider my="sm" />
        <CommentThread
          comments={request.comments}
          disabled={!isPending}
          reply={reply}
          onReplyChange={setReply}
          onReplySubmit={handleReply}
        />
      </Stack>

      <ChangeRequestViewModal
        opened={opened}
        onClose={close}
        pageId={pageId}
        title={pageTitle || "Change Request"}
        content={request.content}
      />
    </Paper>
  );
}
