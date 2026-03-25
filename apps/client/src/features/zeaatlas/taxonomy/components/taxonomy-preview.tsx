import React from "react";
import { Card, Group, Stack, Text } from "@mantine/core";
import { TaxonomyItem } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import TaxonomyChip from "@/features/zeaatlas/taxonomy/components/taxonomy-chip";
import { groupByType } from "@/features/zeaatlas/taxonomy/utils/taxonomy-utils";

interface TaxonomyPreviewProps {
  items: TaxonomyItem[];
}

function PreviewRow({ label, item }: { label: string; item?: TaxonomyItem }) {
  return (
    <Group>
      <Text fw={500}>{label}:</Text>
      {item ? <TaxonomyChip item={item} /> : <Text c="dimmed">Not set</Text>}
    </Group>
  );
}

export default function TaxonomyPreview({ items }: TaxonomyPreviewProps) {
  const grouped = groupByType(items);

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Text fw={600}>Preview</Text>
        <PreviewRow label="Owner" item={grouped.owner[0]} />
        <PreviewRow label="System" item={grouped.system[0]} />
        <PreviewRow label="Workflow" item={grouped.workflow[0]} />
        <PreviewRow label="Environment" item={grouped.environment[0]} />
        <PreviewRow label="Severity" item={grouped.severity[0]} />
      </Stack>
    </Card>
  );
}
