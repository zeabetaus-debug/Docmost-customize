import React from "react";
import { Button, Group, Modal, Text } from "@mantine/core";
import ReactDiffViewer from "react-diff-viewer";
import { usePageQuery } from "@/features/page/queries/page-query";
import { changeRequestContentToText } from "@/features/zeaatlas/change-request/change-request.utils";

interface ChangeRequestViewModalProps {
  opened: boolean;
  onClose: () => void;
  pageId?: string;
  title: string;
  content: any;
}

export default function ChangeRequestViewModal({
  opened,
  onClose,
  pageId,
  title,
  content,
}: ChangeRequestViewModalProps) {
  const { data: page } = usePageQuery({ pageId });
  const oldPageBody = changeRequestContentToText(page?.content || "");
  const oldContent = [page?.title, oldPageBody].filter(Boolean).join("\n\n").trim();
  const newContent = changeRequestContentToText(content || "");
  const hasDiff =
    oldContent.trim().length > 0 &&
    newContent.trim().length > 0 &&
    oldContent !== newContent;

  console.log("OLD PAGE:", oldContent);
  console.log("NEW REQUEST:", newContent);

  return (
    <Modal opened={opened} onClose={onClose} title="Full Change" size="xl">
      <Text style={{ whiteSpace: "pre-wrap" }}>
        {newContent.trim().length ? newContent : title || "No content available"}
      </Text>

      {hasDiff && (
        <div style={{ marginTop: 16 }}>
          <ReactDiffViewer
            oldValue={oldContent}
            newValue={newContent}
            splitView={true}
          />
        </div>
      )}

      {!hasDiff && oldContent.trim().length > 0 && (
        <Text c="dimmed" size="sm" mt="md">
          No changes detected
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
