import React from "react";
import { Button, Group, Paper, Stack, Text, Textarea } from "@mantine/core";
import { IChangeRequestComment } from "@/features/zeaatlas/change-request/change-request.types";

interface CommentThreadProps {
  comments?: IChangeRequestComment[];
  disabled?: boolean;
  reply: string;
  onReplyChange: (value: string) => void;
  onReplySubmit: () => void;
}

export default function CommentThread({
  comments = [],
  disabled = false,
  reply,
  onReplyChange,
  onReplySubmit,
}: CommentThreadProps) {
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  return (
    <Stack mt="sm" gap="xs">
      {comments.map((comment) => (
        <Paper p="xs" radius="md" withBorder key={comment.id}>
          <Text size="xs" c="dimmed">
            {comment.createdBy} • {new Date(comment.createdAt).toLocaleTimeString()}
          </Text>
          <Text size="sm">{comment.message}</Text>
        </Paper>
      ))}

      <Group mt="xs" align="flex-end">
        <Textarea
          placeholder="Write a comment..."
          value={reply}
          onChange={(event) => onReplyChange(event.currentTarget.value)}
          minRows={2}
          autosize
          disabled={disabled}
          style={{ flex: 1 }}
        />
        <Button onClick={onReplySubmit} disabled={disabled}>
          Reply
        </Button>
      </Group>
      <div ref={bottomRef} />
    </Stack>
  );
}
