import React from "react";
import { Group, Button, Text, Modal, Textarea } from "@mantine/core";
import { useUpdatePageMutation } from "@/features/page/queries/page-query";
import { IPage } from "@/features/page/types/page.types";
import { notifications } from "@mantine/notifications";

type StatusType = "draft" | "review" | "approved" | "archived";

interface Props {
  page: IPage;
  onStatusChange?: (s: StatusType) => void;

  // 🔥 ADD THIS (RECEIVE FROM PARENT)
  setChangeRequests?: React.Dispatch<React.SetStateAction<string[]>>;
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
  setChangeRequests, // 👈 RECEIVE HERE
}: Props) {
  const mutation = useUpdatePageMutation();

  const [localStatus, setLocalStatus] = React.useState<StatusType>(
    getValidStatus(page?.status)
  );

  const [openModal, setOpenModal] = React.useState(false);
  const [comment, setComment] = React.useState("");

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

  // ✅ FINAL FIX — SEND DATA TO PARENT
  const handleSubmitRequest = () => {
    if (!comment.trim()) return;

    // 🔥 SEND TO Page.tsx
    setChangeRequests?.((prev) => [...prev, comment]);

    setComment("");
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
            onClick={() => setOpenModal(true)}
          >
            Request Change
          </Button>
        </Group>
      );
    }

    if (status === "approved") {
      return (
        <Text size="sm" c="green" fw={500}>
          Approved (Locked)
        </Text>
      );
    }

    return null;
  };

  return (
    <>
      <Group align="center" gap="sm">
        {renderActions()}
      </Group>

      {/* Modal */}
      <Modal
        opened={openModal}
        onClose={() => setOpenModal(false)}
        title="Request Change"
      >
        <Textarea
          placeholder="Describe what needs to be changed..."
          value={comment}
          onChange={(e) => setComment(e.currentTarget.value)}
        />

        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={() => setOpenModal(false)}>
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