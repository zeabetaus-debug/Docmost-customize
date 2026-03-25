import { Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { DiagramVersion } from "../types/diagram.types";
import { VersionItem } from "./version-item";

interface VersionHistoryProps {
  versions: DiagramVersion[];
  onRestore: (version: DiagramVersion) => void;
}

export function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Stack gap="md" h="100%">
        <div>
          <Text fw={600}>Version History</Text>
          <Text size="sm" c="dimmed">
            Saved snapshots are stored locally for this diagram.
          </Text>
        </div>

        {versions.length === 0 ? (
          <Text size="sm" c="dimmed">
            No saved versions yet.
          </Text>
        ) : (
          <ScrollArea h={340}>
            <Stack gap="sm">
              {versions.map((version) => (
                <VersionItem key={version.id} version={version} onRestore={onRestore} />
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  );
}
