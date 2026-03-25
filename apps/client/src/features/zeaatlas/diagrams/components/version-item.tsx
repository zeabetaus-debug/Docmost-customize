import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { DiagramVersion } from "../types/diagram.types";

dayjs.extend(relativeTime);

interface VersionItemProps {
  version: DiagramVersion;
  onRestore: (version: DiagramVersion) => void;
}

export function VersionItem({ version, onRestore }: VersionItemProps) {
  const preview = version.code.split("\n").slice(0, 2).join(" ");

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={500}>{dayjs(version.createdAt).format("DD MMM, HH:mm")}</Text>
            <Text size="xs" c="dimmed">
              {dayjs(version.createdAt).fromNow()}
            </Text>
          </div>
          <Button variant="light" size="xs" onClick={() => onRestore(version)}>
            Restore
          </Button>
        </Group>
        <Text size="sm" lineClamp={2} c="dimmed">
          {preview}
        </Text>
      </Stack>
    </Paper>
  );
}
