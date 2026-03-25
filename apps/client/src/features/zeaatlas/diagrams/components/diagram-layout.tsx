import { Grid, Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface DiagramLayoutProps {
  toolbar: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  versions: ReactNode;
}

export function DiagramLayout({
  toolbar,
  editor,
  preview,
  versions,
}: DiagramLayoutProps) {
  return (
    <Stack gap="md">
      {toolbar}
      <Grid gutter="md" align="stretch">
        <Grid.Col span={{ base: 12, lg: 6 }}>{editor}</Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>{preview}</Grid.Col>
        <Grid.Col span={12}>{versions}</Grid.Col>
      </Grid>
    </Stack>
  );
}
