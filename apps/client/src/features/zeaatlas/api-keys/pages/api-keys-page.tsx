import React from "react";
import { Button, Container, Group, Stack, Title } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { getAppName } from "@/lib/config";
import ApiKeyList from "@/features/zeaatlas/api-keys/components/api-key-list";
import ApiKeyModal from "@/features/zeaatlas/api-keys/components/api-key-modal";
import { useMockApiKeys } from "@/features/zeaatlas/api-keys/hooks/use-mock-api-keys";

export default function ApiKeysPage() {
  const { keys, createKey, deleteKey } = useMockApiKeys();
  const [opened, setOpened] = React.useState(false);

  return (
    <Container size="lg" py="xl">
      <Helmet>
        <title>{`API Keys - ${getAppName()}`}</title>
      </Helmet>

      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>API Keys</Title>
          <Button onClick={() => setOpened(true)}>Create API Key</Button>
        </Group>

        <ApiKeyList keys={keys} onDelete={deleteKey} />
      </Stack>

      <ApiKeyModal
        opened={opened}
        onClose={() => setOpened(false)}
        onCreate={createKey}
      />
    </Container>
  );
}
