import React from "react";
import { ActionIcon, Group } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { TaxonomyItem as TaxonomyItemType } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import TaxonomyChip from "@/features/zeaatlas/taxonomy/components/taxonomy-chip";

interface TaxonomyItemProps {
  item: TaxonomyItemType;
  onDelete: (id: string) => void;
}

export default function TaxonomyItem({ item, onDelete }: TaxonomyItemProps) {
  const handleDelete = () => {
    onDelete(item.id);
    notifications.show({ message: "Taxonomy item deleted", color: "green" });
  };

  return (
    <Group gap="xs">
      <TaxonomyChip item={item} />
      <ActionIcon variant="subtle" color="red" onClick={handleDelete}>
        <IconTrash size={14} />
      </ActionIcon>
    </Group>
  );
}
