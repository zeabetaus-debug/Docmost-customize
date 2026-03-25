import React from "react";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { TaxonomyType } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import { getTaxonomyLabel } from "@/features/zeaatlas/taxonomy/utils/taxonomy-utils";

interface TaxonomyFormModalProps {
  opened: boolean;
  onClose: () => void;
  type: TaxonomyType;
  onSubmit: (input: { name: string; color?: string }) => void;
}

export default function TaxonomyFormModal({
  opened,
  onClose,
  type,
  onSubmit,
}: TaxonomyFormModalProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("");

  React.useEffect(() => {
    if (opened) {
      setName("");
      setColor("");
    }
  }, [opened]);

  const handleSubmit = () => {
    if (!name.trim()) {
      notifications.show({ message: "Name is required", color: "red" });
      return;
    }

    onSubmit({ name: name.trim(), color: color.trim() || undefined });
    notifications.show({ message: "Taxonomy item created", color: "green" });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Add ${getTaxonomyLabel(type)}`}
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder={`Enter ${getTaxonomyLabel(type).toLowerCase()} name`}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />

        <TextInput
          label="Color"
          placeholder="Optional Mantine color"
          value={color}
          onChange={(event) => setColor(event.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
