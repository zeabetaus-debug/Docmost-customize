import React from "react";
import { Modal, Text } from "@mantine/core";

export default function PageShareModal({ readOnly }: { readOnly?: boolean }) {
  return (
    <Modal opened={false} onClose={() => {}} title="Page Share">
      <Text>Page sharing UI (stub){readOnly ? " - read only" : ""}</Text>
    </Modal>
  );
}
