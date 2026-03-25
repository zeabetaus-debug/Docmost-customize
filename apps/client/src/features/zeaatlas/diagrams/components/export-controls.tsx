import { Button, Group } from "@mantine/core";
import { IconFileTypePng, IconFileTypeSvg } from "@tabler/icons-react";

interface ExportControlsProps {
  onExportPng: () => void;
  onExportSvg: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ExportControls({
  onExportPng,
  onExportSvg,
  disabled = false,
  loading = false,
}: ExportControlsProps) {
  return (
    <Group gap="sm">
      <Button
        variant="default"
        leftSection={<IconFileTypePng size={16} />}
        onClick={onExportPng}
        disabled={disabled}
        loading={loading}
      >
        Export PNG
      </Button>
      <Button
        variant="default"
        leftSection={<IconFileTypeSvg size={16} />}
        onClick={onExportSvg}
        disabled={disabled}
        loading={loading}
      >
        Export SVG
      </Button>
    </Group>
  );
}
