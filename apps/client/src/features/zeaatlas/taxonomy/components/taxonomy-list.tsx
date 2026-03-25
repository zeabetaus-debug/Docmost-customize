import React from "react";
import { Group, Text } from "@mantine/core";
import { TaxonomyItem as TaxonomyItemType } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import TaxonomyItem from "@/features/zeaatlas/taxonomy/components/taxonomy-item";

interface TaxonomyListProps {
  items: TaxonomyItemType[];
  onDelete: (id: string) => void;
}

export default function TaxonomyList({ items, onDelete }: TaxonomyListProps) {
  if (items.length === 0) {
    return <Text c="dimmed">No items added yet</Text>;
  }

  return (
    <Group gap="sm">
      {items.map((item) => (
        <TaxonomyItem key={item.id} item={item} onDelete={onDelete} />
      ))}
    </Group>
  );
}
