import React from "react";
import { Button, Checkbox, Group, Modal, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const API_KEY_SCOPES = ["read:pages", "write:pages", "delete:pages"];

interface ApiKeyModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (name: string, scopes: string[]) => void;
}

export default function ApiKeyModal({
  opened,
  onClose,
  onCreate,
}: ApiKeyModalProps) {
  const [name, setName] = React.useState("");
  const [scopes, setScopes] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (opened) {
      setName("");
      setScopes([]);
    }
  }, [opened]);

  const handleSubmit = () => {
    if (!name.trim()) {
      notifications.show({ message: "API key name is required", color: "red" });
      return;
    }

    onCreate(name.trim(), scopes);
    notifications.show({ message: "API Key created", color: "green" });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create API Key" size="md">
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="n8n automation key"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />

        <Checkbox.Group label="Scopes" value={scopes} onChange={setScopes}>
          <Stack gap="xs" mt="xs">
            {API_KEY_SCOPES.map((scope) => (
              <Checkbox key={scope} value={scope} label={scope} />
            ))}
          </Stack>
        </Checkbox.Group>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
