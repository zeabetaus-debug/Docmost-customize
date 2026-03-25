import React from "react";
import { Group, Button } from "@mantine/core";

interface Props {
  proposed: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function ChangeRequestActions({
  proposed,
  onApprove,
  onReject,
}: Props) {
  return (
    <Group gap="xs">
      <Button color="green" onClick={onApprove}>
        Approve Changes
      </Button>

      <Button variant="default" onClick={onReject}>
        Reject Changes
      </Button>
    </Group>
  );
}