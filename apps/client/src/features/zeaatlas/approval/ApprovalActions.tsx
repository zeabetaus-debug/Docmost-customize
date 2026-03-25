import React from "react";
import { Group, Button, Text, Modal, Textarea } from "@mantine/core";
import { useUpdatePageMutation } from "@/features/page/queries/page-query";
import { IPage } from "@/features/page/types/page.types";
import { notifications } from "@mantine/notifications";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { IChangeRequest } from "@/features/zeaatlas/change-request/change-request.types";
import { createLocalChangeRequest } from "@/features/zeaatlas/change-request/change-request.utils";

type StatusType = "draft" | "review" | "approved" | "archived";

interface Props {
  page: IPage;
  onStatusChange?: (s: StatusType) => void;
  requests?: IChangeRequest[];
  setChangeRequests?: React.Dispatch<React.SetStateAction<IChangeRequest[]>>;
}

const getValidStatus = (status: string | null | undefined): StatusType => {
  if (
    status === "draft" ||
    status === "review" ||
    status === "approved" ||
    status === "archived"
  ) {
    return status;
  }
  return "draft";
};

export default function ApprovalActions({
  page,
  onStatusChange,
  requests,
  setChangeRequests,
}: Props) {
  const mutation = useUpdatePageMutation();
  const currentUser = useAtomValue(currentUserAtom);

  const [localStatus, setLocalStatus] = React.useState<StatusType>(
    getValidStatus(page?.status)
  );
  const [openModal, setOpenModal] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    setLocalStatus(getValidStatus(page?.status));
  }, [page?.status]);

  const status = localStatus;

  const updateStatus = async (newStatus: StatusType) => {
    try {
      setLocalStatus(newStatus);

      await mutation.mutateAsync({
        pageId: page.id,
        status: newStatus,
      } as any);

      notifications.show({
        message: `Page moved to ${newStatus}`,
        color: "teal",
      });

      onStatusChange?.(newStatus);
    } catch (err) {
      console.error(err);
      notifications.show({
        message: "Failed to update status",
        color: "red",
      });
    }
  };

  const handleSubmitRequest = () => {
    if (!message.trim()) {
      notifications.show({
        message: "Please enter your change request",
        color: "red",
      });
      return;
    }

    const normalizedMessage = message.trim();
    const exists = (requests || []).some(
      (request) =>
        request.status === "pending" &&
        typeof request.content === "string" &&
        request.content.trim() === normalizedMessage,
    );

    if (exists) {
      notifications.show({
        message: "This pending change request already exists",
        color: "yellow",
      });
      return;
    }

    setChangeRequests?.((prev) => [
      ...prev,
      createLocalChangeRequest({
        content: normalizedMessage,
        pageId: page.id,
        user: currentUser?.user,
      }),
    ]);

    setMessage("");
    setOpenModal(false);

    updateStatus("draft");
  };

  const renderActions = () => {
    if (status === "draft") {
      return (
        <Button
          size="sm"
          loading={mutation.isPending}
          onClick={() => updateStatus("review")}
        >
          Submit for Review
        </Button>
      );
    }

    if (status === "review") {
      return (
        <Group gap="xs">
          <Button
            size="sm"
            color="green"
            loading={mutation.isPending}
            onClick={() => updateStatus("approved")}
          >
            Approve
          </Button>

          <Button
            size="sm"
            variant="default"
            disabled={page.status === "approved"}
            onClick={() => setOpenModal(true)}
          >
            Request Change
          </Button>
        </Group>
      );
    }

    if (status === "approved") {
      return (
        <>
          <Text size="sm" c="green" fw={500}>
            Approved (Locked)
          </Text>
          <Text size="xs" c="green">
            Page is locked. No further changes allowed.
          </Text>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <Group align="center" gap="sm">
        {renderActions()}
      </Group>

      <Modal
        opened={openModal}
        onClose={() => {
          setMessage("");
          setOpenModal(false);
        }}
        title="Request Change"
        size="md"
      >
        <Textarea
          placeholder="Describe what changes you want..."
          minRows={6}
          autosize
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />

        <Group mt="md" justify="flex-end">
          <Button
            variant="default"
            onClick={() => {
              setMessage("");
              setOpenModal(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmitRequest}>
            Submit Change Request
          </Button>
        </Group>
      </Modal>
    </>
  );
}
