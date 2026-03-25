import React from "react";
import { Button, Group, Modal, Text } from "@mantine/core";
import ReadonlyPageEditor from "@/features/editor/readonly-page-editor";

interface ChangeRequestViewModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  content: any;
}

export default function ChangeRequestViewModal({
  opened,
  onClose,
  title,
  content,
}: ChangeRequestViewModalProps) {
  const isStructuredContent =
    content && typeof content === "object" && !Array.isArray(content);

  return (
    <Modal opened={opened} onClose={onClose} title="Full Change" size="xl">
      {isStructuredContent ? (
        <ReadonlyPageEditor title={title || "Change Request"} content={content} />
      ) : (
        <Text style={{ whiteSpace: "pre-wrap" }}>
          {typeof content === "string" && content.trim().length
            ? content
            : "No content available"}
        </Text>
      )}

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
