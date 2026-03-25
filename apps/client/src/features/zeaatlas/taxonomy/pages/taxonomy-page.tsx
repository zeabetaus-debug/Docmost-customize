import React from "react";
import { Container, Stack, Title } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { getAppName } from "@/lib/config";
import { useMockTaxonomy } from "@/features/zeaatlas/taxonomy/hooks/use-mock-taxonomy";
import TaxonomySection from "@/features/zeaatlas/taxonomy/components/taxonomy-section";
import TaxonomyPreview from "@/features/zeaatlas/taxonomy/components/taxonomy-preview";
import { TaxonomyType } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";
import { getItemsByType } from "@/features/zeaatlas/taxonomy/utils/taxonomy-utils";

const TAXONOMY_SECTIONS: Array<{ title: string; type: TaxonomyType }> = [
  { title: "Owner", type: "owner" },
  { title: "System", type: "system" },
  { title: "Workflow Type", type: "workflow" },
  { title: "Environment", type: "environment" },
  { title: "Severity", type: "severity" },
];

export default function TaxonomyPage() {
  const { items, addItem, deleteItem } = useMockTaxonomy();

  return (
    <Container size="xl" py="xl">
      <Helmet>
        <title>{`Taxonomy - ${getAppName()}`}</title>
      </Helmet>

      <Stack gap="lg">
        <Title order={2}>Taxonomy</Title>

        {TAXONOMY_SECTIONS.map((section) => (
          <TaxonomySection
            key={section.type}
            title={section.title}
            type={section.type}
            items={getItemsByType(items, section.type)}
            onAdd={(type, input) => addItem({ ...input, type })}
            onDelete={deleteItem}
          />
        ))}

        <TaxonomyPreview items={items} />
      </Stack>
    </Container>
  );
}
