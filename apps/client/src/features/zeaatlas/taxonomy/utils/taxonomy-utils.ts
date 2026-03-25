import { TaxonomyItem, TaxonomyType } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";

export function groupByType(items: TaxonomyItem[]) {
  return items.reduce<Record<TaxonomyType, TaxonomyItem[]>>(
    (acc, item) => {
      acc[item.type].push(item);
      return acc;
    },
    {
      owner: [],
      system: [],
      workflow: [],
      environment: [],
      severity: [],
    },
  );
}

export function getItemsByType(items: TaxonomyItem[], type: TaxonomyType) {
  return items.filter((item) => item.type === type);
}

export function getDefaultTaxonomyColor(type: TaxonomyType) {
  switch (type) {
    case "owner":
      return "blue";
    case "system":
      return "cyan";
    case "workflow":
      return "violet";
    case "environment":
      return "green";
    case "severity":
      return "red";
    default:
      return "gray";
  }
}

export function getTaxonomyLabel(type: TaxonomyType) {
  switch (type) {
    case "owner":
      return "Owner";
    case "system":
      return "System";
    case "workflow":
      return "Workflow Type";
    case "environment":
      return "Environment";
    case "severity":
      return "Severity";
    default:
      return type;
  }
}
