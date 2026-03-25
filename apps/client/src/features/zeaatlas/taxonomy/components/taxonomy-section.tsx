import React from "react";
import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { TaxonomyItem, TaxonomyType } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import TaxonomyFormModal from "@/features/zeaatlas/taxonomy/components/taxonomy-form-modal";
import TaxonomyList from "@/features/zeaatlas/taxonomy/components/taxonomy-list";
import { getTaxonomyLabel } from "@/features/zeaatlas/taxonomy/utils/taxonomy-utils";

interface TaxonomySectionProps {
  title: string;
  type: TaxonomyType;
  items: TaxonomyItem[];
  onAdd: (type: TaxonomyType, input: { name: string; color?: string }) => void;
  onDelete: (id: string) => void;
}

export default function TaxonomySection({
  title,
  type,
  items,
  onAdd,
  onDelete,
}: TaxonomySectionProps) {
  const [opened, setOpened] = React.useState(false);

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600}>{title}</Text>
          <Button size="xs" variant="default" onClick={() => setOpened(true)}>
            Add {getTaxonomyLabel(type)}
          </Button>
        </Group>

        <TaxonomyList items={items} onDelete={onDelete} />
      </Stack>

      <TaxonomyFormModal
        opened={opened}
        onClose={() => setOpened(false)}
        type={type}
        onSubmit={(input) => onAdd(type, input)}
      />
    </Card>
  );
}
