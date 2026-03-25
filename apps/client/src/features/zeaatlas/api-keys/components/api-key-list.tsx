import React from "react";
import { Stack, Text } from "@mantine/core";
import ApiKeyCard from "@/features/zeaatlas/api-keys/components/api-key-card";
import { ApiKey } from "@/features/zeaatlas/api-keys/types/api-key.types";

interface ApiKeyListProps {
  keys: ApiKey[];
  onDelete: (id: string) => void;
}

export default function ApiKeyList({ keys, onDelete }: ApiKeyListProps) {
  if (keys.length === 0) {
    return (
      <Text c="dimmed" ta="center">
        No API keys created
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {keys.map((apiKey) => (
        <ApiKeyCard key={apiKey.id} apiKey={apiKey} onDelete={onDelete} />
      ))}
    </Stack>
  );
}
