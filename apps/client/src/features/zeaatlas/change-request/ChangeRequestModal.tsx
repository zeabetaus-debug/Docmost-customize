import React from "react";
import { Modal, Textarea, Group, Button } from "@mantine/core";
import ChangeRequestDiff from "./ChangeRequestDiff";
import ChangeRequestActions from "./ChangeRequestActions";

interface Props {
  opened: boolean;
  onClose: () => void;
  originalContent: string;
  onApprove: (proposed: string) => void;
}

export default function ChangeRequestModal({
  opened,
  onClose,
  originalContent,
  onApprove,
}: Props) {
  const [proposed, setProposed] = React.useState<string>(originalContent || "");
  const [mode, setMode] = React.useState<"edit" | "review">("edit");

  // ✅ Reset state when modal opens
  React.useEffect(() => {
    if (opened) {
      setProposed(originalContent || "");
      setMode("edit");
    }
  }, [opened, originalContent]);

  const handleSubmit = () => {
    setMode("review");
  };

  const handleCancel = () => {
    setMode("edit");
    onClose();
  };

  const handleApprove = () => {
    onApprove(proposed);
    onClose();
  };

  const handleReject = () => {
    setProposed(originalContent || "");
    setMode("edit");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title={mode === "edit" ? "Request Change" : "Review Proposal"}
      size="xl"
    >
      {mode === "edit" ? (
        <div>
          <Textarea
            autosize
            minRows={12}
            value={proposed}
            onChange={(e) => setProposed(e.currentTarget.value)}
            placeholder="Propose changes to page content here..."
          />

          <Group justify="flex-end" mt="md" gap="sm">
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>

            <Button onClick={handleSubmit}>
              Submit Change Request
            </Button>
          </Group>
        </div>
      ) : (
        <div>
          <ChangeRequestDiff
            original={originalContent}
            proposed={proposed}
          />

          <Group justify="flex-end" mt="md" gap="sm">
            <ChangeRequestActions
              proposed={proposed}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </Group>
        </div>
      )}
    </Modal>
  );
}