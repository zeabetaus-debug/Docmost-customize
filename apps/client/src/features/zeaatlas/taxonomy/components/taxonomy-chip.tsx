import React from "react";
import { Badge } from "@mantine/core";
import { TaxonomyItem } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import { getDefaultTaxonomyColor } from "@/features/zeaatlas/taxonomy/utils/taxonomy-utils";

interface TaxonomyChipProps {
  item: TaxonomyItem;
}

export default function TaxonomyChip({ item }: TaxonomyChipProps) {
  return (
    <Badge color={item.color || getDefaultTaxonomyColor(item.type)} variant="light">
      {item.name}
    </Badge>
  );
}
